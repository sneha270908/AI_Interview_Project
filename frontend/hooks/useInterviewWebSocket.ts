'use client';

import { useCallback, useEffect, useRef } from 'react';
import { WS_URL } from '@/lib/api';

type ProctoringPayload = {
  eventType: string;
  timestamp: number;
  severity: string;
  details?: Record<string, unknown>;
};

export function useInterviewWebSocket(sessionId: string | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const connectedRef = useRef(false);

  const connect = useCallback(() => {
    if (!sessionId || wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      connectedRef.current = true;
      ws.send(JSON.stringify({ type: 'join', interviewId: sessionId }));
    };

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data as string);
        if (msg.type === 'joined') connectedRef.current = true;
      } catch {
        /* ignore */
      }
    };

    ws.onclose = () => {
      connectedRef.current = false;
    };

    ws.onerror = () => {
      connectedRef.current = false;
    };
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    connect();
    return () => {
      wsRef.current?.close();
      wsRef.current = null;
      connectedRef.current = false;
    };
  }, [sessionId, connect]);

  const sendChunk = useCallback(
    (meta: { sequence: number; byteSize: number }) => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN || !sessionId) return false;
      // Send lightweight metadata only — full video blobs freeze the main thread
      ws.send(
        JSON.stringify({
          type: 'chunk',
          interviewId: sessionId,
          sequence: meta.sequence,
          data: `chunk:${meta.sequence}:${meta.byteSize}`,
        })
      );
      return true;
    },
    [sessionId]
  );

  const sendProctoringEvent = useCallback(
    (payload: ProctoringPayload) => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN || !sessionId) return;
      ws.send(
        JSON.stringify({
          type: 'proctoring_event',
          interviewId: sessionId,
          ...payload,
        })
      );
    },
    [sessionId]
  );

  return { sendChunk, sendProctoringEvent, isConnected: () => connectedRef.current, connect };
}
