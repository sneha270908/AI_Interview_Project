import { Router, Response } from 'express';
import { Interview, AiInterview } from '../models';
import { AuthRequest, authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/assignments', async (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'candidate') {
    return res.status(403).json({ error: 'Candidate access only' });
  }

  const email = req.user!.email.toLowerCase();
  const interviews = await Interview.find({
    status: 'active',
    invitedEmails: email,
  }).sort({ createdAt: -1 });

  const interviewIds = interviews.map((i) => i._id);
  const sessions = await AiInterview.find({
    interviewId: { $in: interviewIds },
    candidateEmail: email,
  });

  const sessionByInterview = new Map(sessions.map((s) => [String(s.interviewId), s]));

  res.json({
    assignments: interviews.map((inv) => {
      const session = sessionByInterview.get(String(inv._id));
      return {
        interviewId: inv._id,
        title: inv.title,
        questionCount: inv.questions?.length ?? 0,
        sessionStatus: session?.status ?? 'pending',
        sessionId: session?._id ?? null,
        completedAt: session?.updatedAt,
      };
    }),
  });
});

export default router;
