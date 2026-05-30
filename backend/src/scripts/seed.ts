import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { User, Interview, AiInterview } from '../models';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

async function seed() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/hireai';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  // Admin user
  const existing = await User.findOne({ email: 'admin@test.com' });
  if (!existing) {
    const hashed = await bcrypt.hash('password123', 12);
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@test.com',
      password: hashed,
      company: 'HireAI Demo',
      role: 'recruiter',
    });
    console.log('Created admin user: admin@test.com / password123');

    const interview = await Interview.create({
      title: 'Senior Software Engineer',
      jobDescription: 'We are looking for a senior engineer...',
      questions: [
        { text: 'Tell us about yourself.', category: 'Behavioral', difficulty: 'Easy', order: 0 },
        { text: 'Describe a system you designed.', category: 'Technical', difficulty: 'Hard', order: 1 },
      ],
      persona: 'professional',
      createdBy: admin._id,
      status: 'active',
      inviteToken: 'demo-invite-token',
    });

    await AiInterview.create({
      interviewId: interview._id,
      candidateName: 'Sarah Chen',
      candidateEmail: 'sarah@example.com',
      status: 'completed',
      scores: { communication: 85, technical: 78, confidence: 72, overall: 80, recommendation: 'recommend' },
      proctoringEvents: [
        { type: 'face_absent', timestamp: 754, severity: 'high', details: { duration: 45 } },
        { type: 'tab_switch', timestamp: 501, severity: 'medium', details: { duration: 2 } },
      ],
      traceId: 'seed_trace_001',
    });

    console.log('Created sample interview and session');
  } else {
    console.log('Seed data already exists');
  }

  await mongoose.disconnect();
  console.log('Seed complete');
}

seed().catch(console.error);
