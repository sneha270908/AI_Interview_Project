'use client';

import { useEffect, useRef } from 'react';

export function AIAvatar() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const startRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 120;
    canvas.width = size;
    canvas.height = size;
    startRef.current = performance.now();

    let frameId = 0;
    let lastBlink = 0;
    let blinkT = 1;
    let ringPhase = 0;

    const draw = (now: number) => {
      frameId = requestAnimationFrame(draw);
      const elapsed = now - startRef.current;
      const talking = elapsed < 3500;

      const bob = Math.sin(elapsed * 0.002) * 6;
      wrap.style.transform = `translateY(calc(-50% + ${bob}px))`;

      ctx.clearRect(0, 0, size, size);
      const cx = size / 2;
      const cy = size / 2;

      // Pulsing aurora ring
      ringPhase += 0.025;
      const pulse = 0.85 + Math.sin(ringPhase) * 0.15;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, size / 2);
      grad.addColorStop(0, '#2dd4bf');
      grad.addColorStop(0.55, '#818cf8');
      grad.addColorStop(1, '#0a0a12');
      ctx.beginPath();
      ctx.arc(cx, cy, (size / 2 - 2) * pulse, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Spinning arc segments
      for (let i = 0; i < 3; i++) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(elapsed * 0.001 * (i % 2 === 0 ? 1 : -1) + i * 2.1);
        ctx.beginPath();
        ctx.arc(0, 0, size / 2 - 6, 0, Math.PI * 0.6);
        ctx.strokeStyle = i === 0 ? '#2dd4bf' : i === 1 ? '#a78bfa' : '#fbbf24';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5;
        ctx.stroke();
        ctx.restore();
      }
      ctx.globalAlpha = 1;

      // Face
      ctx.beginPath();
      ctx.arc(cx, cy - 2, 36, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.fill();

      if (now - lastBlink > 4500) {
        lastBlink = now;
        blinkT = 0;
      }
      if (blinkT < 1) blinkT = Math.min(1, blinkT + 0.018);
      const eyeY = blinkT < 0.5 ? lerp(1, 0.08, blinkT / 0.5) : lerp(0.08, 1, (blinkT - 0.5) / 0.5);

      ctx.fillStyle = '#0a0a12';
      [cx - 13, cx + 13].forEach((ex) => {
        ctx.save();
        ctx.translate(ex, cy - 8);
        ctx.scale(1, eyeY);
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      ctx.strokeStyle = '#0a0a12';
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (talking) {
        const h = Math.sin(elapsed * 0.012) * 5 + 5;
        ctx.ellipse(cx, cy + 13, 9, h, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.arc(cx, cy + 9, 9, 0.2 * Math.PI, 0.8 * Math.PI);
        ctx.stroke();
      }
    };

    frameId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <div
      ref={wrapRef}
      className="fixed z-20 pointer-events-none hidden lg:block"
      style={{ left: '12%', top: '50%' }}
    >
      <canvas ref={canvasRef} width={120} height={120} className="rounded-full" />
      <p className="text-center mt-2 text-[10px] font-body text-[#a78bfa]/80">AI Interviewer</p>
    </div>
  );
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
