/**
 * HireAI Background Workers
 *
 * Processes interview media pipeline:
 * 1. Chunk merge (FFmpeg)
 * 2. Transcription (Deepgram)
 * 3. AI Evaluation (Claude)
 * 4. Highlight reel generation
 * 5. Scorecard PDF (Puppeteer)
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import winston from 'winston';

dotenv.config();

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()],
});

const aiInterviewSchema = new mongoose.Schema({
  status: String,
  session_data: mongoose.Schema.Types.Mixed,
  answers: [mongoose.Schema.Types.Mixed],
  scores: mongoose.Schema.Types.Mixed,
  traceId: String,
}, { timestamps: true });

const AiInterview = mongoose.models.AiInterview || mongoose.model('AiInterview', aiInterviewSchema);

async function processQueue() {
  const pending = await AiInterview.find({ status: 'processing' }).limit(5);
  for (const session of pending) {
    const traceId = session.traceId || `worker_${Date.now()}`;
    logger.info('Processing interview session', { traceId, sessionId: session._id });

    try {
      // Step 1: Merge chunks with FFmpeg (simulated)
      logger.info('Merging video chunks', { traceId, chunkCount: session.session_data?.chunks?.length || 0 });
      await sleep(1000);

      // Step 2: Transcribe with Deepgram (simulated)
      logger.info('Transcribing audio', { traceId });
      await sleep(1500);

      // Step 3: AI evaluation with Claude (simulated)
      logger.info('Running AI evaluation', { traceId });
      await sleep(2000);

      session.status = 'completed';
      session.scores = {
        communication: 75 + Math.floor(Math.random() * 20),
        technical: 70 + Math.floor(Math.random() * 25),
        confidence: 65 + Math.floor(Math.random() * 30),
        overall: 72 + Math.floor(Math.random() * 20),
        recommendation: 'recommend',
      };
      await session.save();
      logger.info('Session processing complete', { traceId, sessionId: session._id });
    } catch (err) {
      logger.error('Processing failed', { traceId, error: String(err) });
      session.status = 'failed';
      await session.save();
    }
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function start() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/hireai';
  await mongoose.connect(mongoUri);
  logger.info('Worker connected to MongoDB');

  setInterval(processQueue, 10000);
  logger.info('Worker polling every 10s');
}

start().catch(console.error);
