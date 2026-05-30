'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export function useCamera(displayRef: React.RefObject<HTMLVideoElement | null>) {
  const streamRef = useRef<MediaStream | null>(null);
  const bufferRef = useRef<HTMLVideoElement | null>(null);
  const attachingRef = useRef(false);
  const readyRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // Tiny offscreen video keeps the MediaStream alive between layout phases
  useEffect(() => {
    const el = document.createElement('video');
    el.muted = true;
    el.playsInline = true;
    el.setAttribute('playsinline', 'true');
    el.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;left:-9999px';
    document.body.appendChild(el);
    bufferRef.current = el;
    return () => {
      el.remove();
      bufferRef.current = null;
    };
  }, []);

  const setReadyState = useCallback((value: boolean) => {
    if (readyRef.current !== value) {
      readyRef.current = value;
      setReady(value);
    }
  }, []);

  const attachStreamToVideo = useCallback(async (video: HTMLVideoElement | null) => {
    const stream = streamRef.current;
    if (!video || !stream) return false;

    if (video.srcObject !== stream) {
      video.srcObject = stream;
    }
    video.muted = true;
    video.playsInline = true;

    try {
      await video.play();
      const ok = video.readyState >= 2 && video.videoWidth > 0;
      if (video === displayRef.current) setReadyState(ok);
      return ok;
    } catch {
      return false;
    }
  }, [displayRef, setReadyState]);

  const attachToVideo = useCallback(async () => {
    if (attachingRef.current) return readyRef.current;
    attachingRef.current = true;
    try {
      await attachStreamToVideo(bufferRef.current);
      return await attachStreamToVideo(displayRef.current);
    } finally {
      attachingRef.current = false;
    }
  }, [attachStreamToVideo, displayRef]);

  const startCamera = useCallback(async () => {
    if (streamRef.current) {
      await attachToVideo();
      return streamRef.current;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: true,
      });
      streamRef.current = stream;
      setError(null);
      setReadyState(stream.getVideoTracks()[0]?.readyState === 'live');
      await attachToVideo();
      return stream;
    } catch (err) {
      const msg =
        err instanceof Error && err.name === 'NotAllowedError'
          ? 'Camera permission denied. Allow camera in browser settings and refresh.'
          : 'Could not access camera. Check permissions and try again.';
      setError(msg);
      setReadyState(false);
      return null;
    }
  }, [attachToVideo, setReadyState]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  return {
    streamRef,
    startCamera,
    attachToVideo,
    error,
    ready,
    getStream: useCallback(() => streamRef.current, []),
  };
}
