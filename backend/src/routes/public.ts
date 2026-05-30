import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { Interview, AiInterview } from '../models';
import { createTraceId, logger } from '../utils/logger';
import { handleReconnect } from '../websocket';
import { finalizeSessionScoring } from '../services/scoring';

const router = Router();

const uploadsDir = path.resolve(__dirname, '../../uploads/sessions');
fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (_req, file, cb) => {
      const sessionId = (_req as Request).params.sessionId;
      cb(null, `${sessionId}.webm`);
    },
  }),
  limits: { fileSize: 150 * 1024 * 1024 },
});

async function findInterview(identifier: string) {
  if (identifier === 'demo') {
    const demo = await Interview.findOne({ inviteToken: 'demo-invite-token' });
    if (demo) return demo;
    return Interview.findOne({ status: 'active' });
  }
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    const byId = await Interview.findById(identifier);
    if (byId) return byId;
  }
  return Interview.findOne({ inviteToken: identifier });
}

router.get('/interviews/:identifier', async (req: Request, res: Response) => {
  try {
    const interview = await findInterview(req.params.identifier);
    if (!interview) return res.status(404).json({ error: 'Interview not found' });

    res.json({
      interview: {
        id: interview._id,
        title: interview.title,
        questions: interview.questions,
        persona: interview.persona,
        timeLimitPerQuestion: interview.timeLimitPerQuestion,
        proctoring: interview.proctoring,
      },
    });
  } catch (err) {
    logger.error('Public get interview failed', { error: String(err) });
    res.status(500).json({ error: 'Failed to load interview' });
  }
});

router.post('/interviews/:identifier/sessions', async (req: Request, res: Response) => {
  const traceId = createTraceId();
  try {
    const interview = await findInterview(req.params.identifier);
    if (!interview) return res.status(404).json({ error: 'Interview not found' });

    const { candidateName, candidateEmail } = req.body;
    const session = await AiInterview.create({
      interviewId: interview._id,
      candidateName: candidateName || 'Candidate',
      candidateEmail: candidateEmail || '',
      status: 'in_progress',
      traceId,
      session_data: { currentQuestion: 0, chunks: [], wsReconnectCount: 0, lastChunkSequence: -1 },
    });

    logger.info('Session started', { traceId, sessionId: session._id, interviewId: interview._id });
    res.status(201).json({ session: { id: session._id, interviewId: interview._id, status: session.status } });
  } catch (err) {
    logger.error('Start session failed', { traceId, error: String(err) });
    res.status(500).json({ error: 'Failed to start session' });
  }
});

router.get('/sessions/:sessionId', async (req: Request, res: Response) => {
  try {
    const session = await AiInterview.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json({
      session: {
        id: session._id,
        interviewId: session.interviewId,
        status: session.status,
        candidateName: session.candidateName,
        scores: session.scores,
        proctoringEvents: session.proctoringEvents,
        answers: session.answers,
        chunkCount: session.session_data?.chunks?.length ?? 0,
        videoUrl: session.videoUrl || null,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load session' });
  }
});

router.post('/sessions/:sessionId/video', upload.single('video'), async (req: Request, res: Response) => {
  const traceId = createTraceId();
  try {
    const session = await AiInterview.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (!req.file) return res.status(400).json({ error: 'No video file uploaded' });

    const videoUrl = `/uploads/sessions/${req.params.sessionId}.webm`;
    session.videoUrl = videoUrl;
    await session.save();

    logger.info('Video uploaded', { traceId, sessionId: session._id, size: req.file.size });
    res.json({ videoUrl, size: req.file.size });
  } catch (err) {
    logger.error('Video upload failed', { traceId, error: String(err) });
    res.status(500).json({ error: 'Video upload failed' });
  }
});

router.patch('/sessions/:sessionId', async (req: Request, res: Response) => {
  const traceId = createTraceId();
  try {
    const session = await AiInterview.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const { status, currentQuestion, answers, suspiciousActivityCount } = req.body;
    if (typeof currentQuestion === 'number') {
      session.session_data!.currentQuestion = currentQuestion;
    }
    if (Array.isArray(answers)) {
      session.answers = answers as typeof session.answers;
    }
    if (typeof suspiciousActivityCount === 'number') {
      session.suspiciousActivityCount = suspiciousActivityCount;
    }
    if (status) {
      session.status = status;
    }

    if (status === 'processing') {
      const interview = await Interview.findById(session.interviewId);
      await finalizeSessionScoring(session, interview);
      logger.info('Session scored and completed', { traceId, sessionId: session._id, overall: session.scores?.overall });
    } else {
      await session.save();
    }

    logger.info('Session updated', { traceId, sessionId: session._id, status: session.status });
    res.json({
      session: {
        id: session._id,
        status: session.status,
        scores: session.scores,
        answers: session.answers,
      },
    });
  } catch (err) {
    logger.error('Update session failed', { traceId, error: String(err) });
    res.status(500).json({ error: 'Failed to update session' });
  }
});

router.post('/sessions/:sessionId/proctoring', async (req: Request, res: Response) => {
  try {
    const { eventType, timestamp, severity, details } = req.body;
    const session = await AiInterview.findByIdAndUpdate(
      req.params.sessionId,
      {
        $push: {
          proctoringEvents: {
            type: eventType,
            timestamp: timestamp || Date.now(),
            severity: severity || 'medium',
            details,
          },
        },
      },
      { new: true }
    );
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Failed to save proctoring event' });
  }
});

router.post('/sessions/:sessionId/reconnect', async (req: Request, res: Response) => {
  try {
    const lastSequence = req.body.lastSequence ?? -1;
    const result = await handleReconnect(req.params.sessionId, lastSequence);
    if (!result.success) return res.status(400).json(result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Reconnect failed' });
  }
});

export default router;
