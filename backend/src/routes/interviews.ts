import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import { Interview, AiInterview } from '../models';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { logger, createTraceId } from '../utils/logger';
import { finalizeSessionScoring } from '../services/scoring';

const router = Router();

router.use(authMiddleware);

async function resolveInterviewForUser(identifier: string, userId: string) {
  if (identifier === 'demo') {
    const demo = await Interview.findOne({ inviteToken: 'demo-invite-token', createdBy: userId });
    if (demo) return demo;
    return Interview.findOne({ createdBy: userId, status: 'active' });
  }
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    return Interview.findOne({ _id: identifier, createdBy: userId });
  }
  return Interview.findOne({ inviteToken: identifier, createdBy: userId });
}

router.get('/recruiter/sessions', async (req: AuthRequest, res: Response) => {
  const interviews = await Interview.find({ createdBy: req.user!.id }).select('_id title questions');
  const ids = interviews.map((i) => i._id);
  const sessions = await AiInterview.find({ interviewId: { $in: ids } }).sort({ createdAt: -1 });
  const titleMap = Object.fromEntries(interviews.map((i) => [String(i._id), i.title]));
  const interviewMap = Object.fromEntries(interviews.map((i) => [String(i._id), i]));

  for (const session of sessions) {
    if (session.status === 'processing') {
      const interview = interviewMap[String(session.interviewId)];
      if (interview) await finalizeSessionScoring(session, interview);
    }
  }

  res.json({
    sessions: sessions.map((s) => ({
      ...s.toObject(),
      interviewTitle: titleMap[String(s.interviewId)] || 'Interview',
    })),
  });
});

router.get('/recruiter/sessions/:sessionId', async (req: AuthRequest, res: Response) => {
  const session = await AiInterview.findById(req.params.sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  const interview = await Interview.findOne({ _id: session.interviewId, createdBy: req.user!.id });
  if (!interview) return res.status(404).json({ error: 'Not found' });

  if (session.status === 'processing') {
    await finalizeSessionScoring(session, interview);
  }

  res.json({ session, interview });
});

router.get('/', async (req: AuthRequest, res: Response) => {
  const interviews = await Interview.find({ createdBy: req.user!.id }).sort({ createdAt: -1 });
  res.json({ interviews });
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const traceId = createTraceId();
  try {
    const invitedEmails = (req.body.invitedEmails || [])
      .map((e: string) => String(e).toLowerCase().trim())
      .filter(Boolean);

    const interview = await Interview.create({
      ...req.body,
      invitedEmails,
      createdBy: req.user!.id,
      inviteToken: uuidv4(),
      status: 'active',
    });
    logger.info('Interview created', { traceId, interviewId: interview._id });
    res.status(201).json({ interview });
  } catch (err) {
    logger.error('Create interview failed', { traceId, error: String(err) });
    res.status(500).json({ error: 'Failed to create interview' });
  }
});

router.post('/generate-questions', async (req: AuthRequest, res: Response) => {
  const traceId = createTraceId();
  const { jobDescription } = req.body;

  // Simulated AI generation — replace with Claude API in production
  const questions = [
    { text: 'Tell us about a challenging project you led.', category: 'Behavioral', difficulty: 'Medium', order: 0, keywords: ['project', 'lead', 'challenge', 'team', 'result', 'impact'] },
    { text: 'Explain your approach to system design for scale.', category: 'Technical', difficulty: 'Hard', order: 1, keywords: ['system', 'design', 'scale', 'architecture', 'performance', 'database'] },
    { text: 'How do you handle conflicting priorities?', category: 'Leadership', difficulty: 'Medium', order: 2, keywords: ['priority', 'deadline', 'stakeholder', 'communicate', 'decision', 'tradeoff'] },
    { text: 'Walk through debugging a production issue.', category: 'Technical', difficulty: 'Hard', order: 3, keywords: ['debug', 'production', 'logs', 'root cause', 'fix', 'monitoring'] },
    { text: 'Describe receiving critical feedback.', category: 'Behavioral', difficulty: 'Easy', order: 4, keywords: ['feedback', 'improve', 'listen', 'learn', 'growth', 'change'] },
    { text: 'Why are you interested in this role?', category: 'Culture', difficulty: 'Easy', order: 5, keywords: ['role', 'company', 'growth', 'mission', 'skills', 'passion'] },
  ];

  logger.info('Questions generated', { traceId, count: questions.length, jobDescLength: jobDescription?.length });
  res.json({ questions });
});

router.get('/debug/:interviewId', async (req: AuthRequest, res: Response) => {
  const session = await AiInterview.findById(req.params.interviewId);
  if (!session) return res.status(404).json({ error: 'Not found' });
  res.json({
    status: session.status,
    session_data: session.session_data,
    proctoringEvents: session.proctoringEvents,
    traceId: session.traceId,
    chunkCount: session.session_data.chunks.length,
  });
});

router.get('/:id/sessions', async (req: AuthRequest, res: Response) => {
  const interview = await resolveInterviewForUser(req.params.id, req.user!.id);
  if (!interview) return res.status(404).json({ error: 'Interview not found' });
  const sessions = await AiInterview.find({ interviewId: interview._id }).sort({ createdAt: -1 });
  res.json({ sessions });
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  const interview = await resolveInterviewForUser(req.params.id, req.user!.id);
  if (!interview) return res.status(404).json({ error: 'Interview not found' });
  res.json({ interview });
});

export default router;
