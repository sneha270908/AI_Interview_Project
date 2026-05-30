import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { logger, createTraceId } from '../utils/logger';

const router = Router();

router.post('/signup', async (req, res) => {
  const traceId = createTraceId();
  try {
    const { name, email, password, company, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const userRole = role === 'candidate' ? 'candidate' : 'recruiter';
    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashed,
      company,
      role: userRole,
    });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '7d' }
    );

    logger.info('User registered', { traceId, userId: user._id, role: userRole });
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, company: user.company, role: user.role },
    });
  } catch (err) {
    logger.error('Signup failed', { traceId, error: String(err) });
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  const traceId = createTraceId();
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '7d' }
    );

    logger.info('User logged in', { traceId, userId: user._id });
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, company: user.company, role: user.role },
    });
  } catch (err) {
    logger.error('Login failed', { traceId, error: String(err) });
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user!.id).select('-password');
  res.json({ user });
});

export default router;
