import express from 'express';
import cors from 'cors';
import http from 'http';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth';
import interviewRoutes from './routes/interviews';
import publicRoutes from './routes/public';
import candidateRoutes from './routes/candidate';
import { setupWebSocket } from './websocket';
import { logger } from './utils/logger';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 4000;
const uploadsPath = path.resolve(__dirname, '../uploads');

app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://frontend:3000',
    ],
    credentials: true,
  })
);
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static(uploadsPath));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/candidate', candidateRoutes);

setupWebSocket(server);

async function start() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/hireai';
  try {
    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB');
  } catch (err) {
    logger.warn('MongoDB connection failed — running without DB', { error: String(err) });
  }

  server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
}

start();
