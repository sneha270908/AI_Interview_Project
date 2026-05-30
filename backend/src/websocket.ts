import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import crypto from 'crypto';
import { AiInterview } from './models';
import { logger, createTraceId } from './utils/logger';

interface WSClient {
  ws: WebSocket;
  interviewId?: string;
  traceId: string;
}

const clients = new Map<WebSocket, WSClient>();

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    const traceId = createTraceId();
    clients.set(ws, { ws, traceId });
    logger.info('WebSocket connected', { traceId });

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        const client = clients.get(ws);
        if (!client) return;

        switch (message.type) {
          case 'join':
            client.interviewId = message.interviewId;
            ws.send(JSON.stringify({ type: 'joined', interviewId: message.interviewId }));
            break;

          case 'chunk': {
            const md5 = crypto.createHash('md5').update(message.data).digest('hex');
            const session = await AiInterview.findById(message.interviewId);
            if (!session) {
              ws.send(JSON.stringify({ type: 'error', error: 'Session not found' }));
              return;
            }

            const existing = session.session_data.chunks.find(
              (c) => c.sequence === message.sequence
            );
            if (existing?.md5 === md5) {
              ws.send(JSON.stringify({ type: 'chunk_ack', sequence: message.sequence, deduplicated: true }));
              return;
            }

            session.session_data.chunks.push({
              sequence: message.sequence,
              md5,
              s3Key: `chunks/${message.interviewId}/${message.sequence}.webm`,
              uploadedAt: new Date(),
            });
            session.session_data.lastChunkSequence = message.sequence;
            await session.save();

            ws.send(JSON.stringify({ type: 'chunk_ack', sequence: message.sequence }));
            break;
          }

          case 'proctoring_event': {
            await AiInterview.findByIdAndUpdate(message.interviewId, {
              $push: {
                proctoringEvents: {
                  type: message.eventType,
                  timestamp: message.timestamp,
                  severity: message.severity,
                  details: message.details,
                },
              },
            });
            break;
          }

          case 'ping':
            ws.send(JSON.stringify({ type: 'pong' }));
            break;
        }
      } catch (err) {
        logger.error('WebSocket message error', { error: String(err) });
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
      logger.info('WebSocket disconnected', { traceId });
    });
  });

  // Heartbeat every 30s
  setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'heartbeat' }));
      }
    });
  }, 30000);

  return wss;
}

export async function handleReconnect(interviewId: string, lastSequence: number) {
  const session = await AiInterview.findById(interviewId);
  if (!session) return { success: false, error: 'Session not found' };

  if (session.session_data.wsReconnectCount >= 5) {
    return { success: false, error: 'Max reconnect attempts exceeded' };
  }

  session.session_data.wsReconnectCount += 1;
  await session.save();

  const missingSequences: number[] = [];
  const chunks = session.session_data.chunks.map((c) => c.sequence);
  for (let i = 0; i <= session.session_data.lastChunkSequence; i++) {
    if (!chunks.includes(i)) missingSequences.push(i);
  }

  return {
    success: true,
    missingSequences,
    currentQuestion: session.session_data.currentQuestion,
    reconnectCount: session.session_data.wsReconnectCount,
  };
}
