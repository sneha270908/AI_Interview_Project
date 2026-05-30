'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { ProctorFlag } from '@/components/interview/ProctoringPanel';
import type { BlazeFaceModel } from '@tensorflow-models/blazeface';

export type ProctoringOptions = {
  manualBlock?: boolean;
  enableFace?: boolean;
  enableTab?: boolean;
  getStream?: () => MediaStream | null;
};

const MIN_FACE_SCORE = 0.55;
const MIN_FACE_AREA_RATIO = 0.008;

function getFaceScore(probability: unknown): number {
  if (typeof probability === 'number') return probability;
  if (Array.isArray(probability) && probability.length > 0) {
    const value = probability[0];
    return typeof value === 'number' ? value : 0;
  }
  return 0;
}

function faceIsPresent(
  predictions: Awaited<ReturnType<BlazeFaceModel['estimateFaces']>>,
  videoWidth: number,
  videoHeight: number
) {
  if (!predictions.length) return false;

  const frameArea = videoWidth * videoHeight;
  if (!frameArea) return false;

  return predictions.some((face) => {
    const score = getFaceScore(face.probability);
    if (score < MIN_FACE_SCORE) return false;

    const topLeft = face.topLeft as [number, number];
    const bottomRight = face.bottomRight as [number, number];
    const width = bottomRight[0] - topLeft[0];
    const height = bottomRight[1] - topLeft[1];
    const area = Math.max(0, width) * Math.max(0, height);
    return area / frameArea >= MIN_FACE_AREA_RATIO;
  });
}

export function useProctoring(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  active: boolean,
  onFlag?: (type: string, severity: 'low' | 'medium' | 'high') => void,
  options?: ProctoringOptions
) {
  const enableFace = options?.enableFace !== false;
  const enableTab = options?.enableTab !== false;
  const getStreamRef = useRef(options?.getStream);
  getStreamRef.current = options?.getStream;

  const [faceDetected, setFaceDetected] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [tabFocused, setTabFocused] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState<string | null>(null);
  const [flags, setFlags] = useState<ProctorFlag[]>([]);
  const [riskScore, setRiskScore] = useState(0);
  const lastFaceRef = useRef(true);
  const activeSinceRef = useRef<number | null>(null);
  const manualBlockRef = useRef(false);
  const blockReasonRef = useRef<string | null>(null);
  const sampleVideoRef = useRef<HTMLVideoElement | null>(null);
  const modelRef = useRef<BlazeFaceModel | null>(null);
  const detectingRef = useRef(false);

  useEffect(() => {
    manualBlockRef.current = options?.manualBlock ?? false;
  }, [options?.manualBlock]);

  useEffect(() => {
    const el = document.createElement('video');
    el.muted = true;
    el.playsInline = true;
    el.setAttribute('playsinline', 'true');
    el.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;left:-9999px';
    document.body.appendChild(el);
    sampleVideoRef.current = el;
    return () => {
      el.remove();
      sampleVideoRef.current = null;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadModel() {
      try {
        const tf = await import('@tensorflow/tfjs-core');
        await import('@tensorflow/tfjs-backend-webgl');
        try {
          await tf.setBackend('webgl');
        } catch {
          await tf.setBackend('cpu');
        }
        await tf.ready();
        const blazeface = await import('@tensorflow-models/blazeface');
        const model = await blazeface.load();
        if (!cancelled) modelRef.current = model;
      } catch {
        /* model failed — face stays false */
      }
    }

    loadModel();
    return () => {
      cancelled = true;
      modelRef.current = null;
    };
  }, []);

  const setBlock = useCallback((reason: string | null) => {
    blockReasonRef.current = reason;
    setBlockReason(reason);
    setBlocked(reason != null);
  }, []);

  const addFlag = useCallback(
    (type: ProctorFlag['type'], message: string, severity: ProctorFlag['severity']) => {
      const flag: ProctorFlag = {
        id: `${type}-${Date.now()}`,
        type,
        message,
        severity,
        time: new Date().toLocaleTimeString(),
      };
      setFlags((prev) => [...prev.slice(-20), flag]);
      setRiskScore((r) => Math.min(100, r + (severity === 'high' ? 15 : severity === 'medium' ? 8 : 4)));
      onFlag?.(type, severity);
    },
    [onFlag]
  );

  const resetBlock = useCallback(() => {
    manualBlockRef.current = false;
    blockReasonRef.current = null;
    setBlocked(false);
    setBlockReason(null);
    lastFaceRef.current = true;
  }, []);

  useEffect(() => {
    if (active) {
      activeSinceRef.current = Date.now();
    } else {
      activeSinceRef.current = null;
      if (!manualBlockRef.current) {
        blockReasonRef.current = null;
        setBlocked(false);
        setBlockReason(null);
      }
      setFaceDetected(false);
    }
  }, [active]);

  useEffect(() => {
    const onVisibility = () => {
      const focused = !document.hidden;
      setTabFocused(focused);
      if (!focused && active && enableTab) {
        addFlag('tab_switch', 'Candidate left the interview tab', 'high');
        setBlock('tab_switch');
      } else if (focused && !manualBlockRef.current && blockReasonRef.current === 'tab_switch') {
        setBlock(null);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    setTabFocused(!document.hidden);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [active, addFlag, enableTab, setBlock]);

  useEffect(() => {
    if (!active) return;

    const tick = async () => {
      if (detectingRef.current) return;

      const display = videoRef.current;
      const stream =
        getStreamRef.current?.() ?? (display?.srcObject as MediaStream | null);

      if (!stream) {
        setCameraActive(false);
        setFaceDetected(false);
        return;
      }

      const videoTrack = stream.getVideoTracks()[0];
      setCameraActive(videoTrack?.readyState === 'live' && videoTrack.enabled);

      const sampleVideo = sampleVideoRef.current;
      if (sampleVideo && sampleVideo.srcObject !== stream) {
        sampleVideo.srcObject = stream;
        sampleVideo.play().catch(() => {});
      }

      let video: HTMLVideoElement | null = null;
      if (display && display.readyState >= 2 && display.videoWidth > 0) {
        video = display;
      } else if (sampleVideo && sampleVideo.readyState >= 2 && sampleVideo.videoWidth > 0) {
        video = sampleVideo;
      }

      if (!video || !modelRef.current) {
        setFaceDetected(false);
        return;
      }

      detectingRef.current = true;
      try {
        const normal = await modelRef.current.estimateFaces(video, false, false);
        const mirrored = await modelRef.current.estimateFaces(video, false, true);
        const hasFace = enableFace
          ? faceIsPresent(normal, video.videoWidth, video.videoHeight) ||
            faceIsPresent(mirrored, video.videoWidth, video.videoHeight)
          : true;

        setFaceDetected(hasFace);

        const warmedUp = activeSinceRef.current && Date.now() - activeSinceRef.current > 3000;
        if (!warmedUp || manualBlockRef.current || !enableFace) return;

        if (!hasFace && lastFaceRef.current) {
          addFlag('face_absent', 'Face not visible in camera', 'high');
          lastFaceRef.current = false;
        } else if (hasFace) {
          lastFaceRef.current = true;
          setRiskScore((r) => Math.max(0, r - 1));
        }
      } catch {
        setFaceDetected(false);
      } finally {
        detectingRef.current = false;
      }
    };

    tick();
    const interval = setInterval(() => {
      void tick();
    }, 700);

    return () => clearInterval(interval);
  }, [active, videoRef, addFlag, enableFace]);

  const suspiciousCount = flags.filter(
    (f) => f.severity === 'high' && ['face_absent', 'tab_switch'].includes(f.type)
  ).length;

  return {
    faceDetected,
    cameraActive,
    tabFocused,
    blocked,
    blockReason,
    suspiciousCount,
    flags,
    riskScore,
    addFlag,
    resetBlock,
  };
}
