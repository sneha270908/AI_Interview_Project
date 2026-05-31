'use client';

import { useEffect, useRef } from 'react';

interface AIAvatarProps {
  speaking?: boolean;
}

export function AIAvatar({ speaking = false }: AIAvatarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const speakingRef = useRef(speaking);

  useEffect(() => {
    speakingRef.current = speaking;
  }, [speaking]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const S = 120;
    canvas.width = S;
    canvas.height = S;
    const cx = S / 2;
    const cy = S / 2;
    const R = 44;

    let frameId = 0;
    const start = performance.now();
    let blinkT = 1;
    let lastBlink = 0;
    let mouthOpen = 0;
    let ringAngle = 0;

    function lerp(a: number, b: number, t: number) {
      return a + (b - a) * t;
    }

    const draw = (now: number) => {
      frameId = requestAnimationFrame(draw);
      const t = (now - start) / 1000;

      ctx.clearRect(0, 0, S, S);

      const bob = Math.sin(t * 1.2) * 3;
      wrap.style.transform = `translateY(${bob}px)`;

      // Outer orbit dots
      ringAngle += 0.012;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + ringAngle;
        const x = cx + Math.cos(a) * (R + 14);
        const y = cy + Math.sin(a) * (R + 14);
        const alpha = 0.1 + 0.3 * Math.abs(Math.sin(t * 2 + i * 0.8));
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(45,212,191,${alpha})`;
        ctx.fill();
      }

      // Spinning arcs
      for (let i = 0; i < 2; i++) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(t * (i === 0 ? 0.4 : -0.3) + i * 1.5);
        ctx.beginPath();
        ctx.arc(0, 0, R + 8 + i * 3, 0, Math.PI * 0.5);
        ctx.strokeStyle = i === 0 ? 'rgba(45,212,191,0.5)' : 'rgba(167,139,250,0.4)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }

      // Speaking pulse ring
      if (speakingRef.current) {
        const pulse = 0.3 + 0.3 * Math.sin(t * 8);
        ctx.beginPath();
        ctx.arc(cx, cy, R + 4, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(45,212,191,${pulse})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Sphere 3D gradient
      const sphereGrad = ctx.createRadialGradient(
        cx - R * 0.3, cy - R * 0.3, R * 0.05,
        cx, cy, R
      );
      sphereGrad.addColorStop(0, '#2e2e50');
      sphereGrad.addColorStop(0.45, '#18182e');
      sphereGrad.addColorStop(0.8, '#0f0f1e');
      sphereGrad.addColorStop(1, '#07070f');
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = sphereGrad;
      ctx.fill();

      // Rim glow
      const rim = ctx.createRadialGradient(cx, cy, R * 0.72, cx, cy, R);
      rim.addColorStop(0, 'transparent');
      rim.addColorStop(0.82, 'transparent');
      rim.addColorStop(1, 'rgba(45,212,191,0.22)');
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = rim;
      ctx.fill();

      // Gloss
      const gloss = ctx.createRadialGradient(
        cx - R * 0.3, cy - R * 0.35, 0,
        cx - R * 0.15, cy - R * 0.2, R * 0.5
      );
      gloss.addColorStop(0, 'rgba(255,255,255,0.15)');
      gloss.addColorStop(0.6, 'rgba(255,255,255,0.03)');
      gloss.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = gloss;
      ctx.fill();

      // Clip to sphere
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R - 1, 0, Math.PI * 2);
      ctx.clip();

      // Antenna
      const antY = cy - R * 0.72;
      ctx.strokeStyle = 'rgba(45,212,191,0.65)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, antY);
      ctx.lineTo(cx, antY - 10);
      ctx.stroke();
      const ap = 0.5 + 0.5 * Math.sin(t * 5);
      const antGlow = ctx.createRadialGradient(cx, antY - 12, 0, cx, antY - 12, 7);
      antGlow.addColorStop(0, `rgba(45,212,191,${0.7 + ap * 0.3})`);
      antGlow.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(cx, antY - 12, 7, 0, Math.PI * 2);
      ctx.fillStyle = antGlow;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, antY - 12, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(45,212,191,${0.8 + ap * 0.2})`;
      ctx.fill();

      // Eye sockets
      const eyeY = cy - 3;
      if (now - lastBlink > 3800) { lastBlink = now; blinkT = 0; }
      if (blinkT < 1) blinkT = Math.min(1, blinkT + 0.1);
      const eyeSY = blinkT < 0.5
        ? lerp(1, 0.05, blinkT / 0.5)
        : lerp(0.05, 1, (blinkT - 0.5) / 0.5);

      [cx - 12, cx + 12].forEach((ex) => {
        const sock = ctx.createRadialGradient(ex, eyeY, 0, ex, eyeY, 8);
        sock.addColorStop(0, 'rgba(0,0,0,0.7)');
        sock.addColorStop(1, 'rgba(0,0,0,0.15)');
        ctx.beginPath();
        ctx.arc(ex, eyeY, 8, 0, Math.PI * 2);
        ctx.fillStyle = sock;
        ctx.fill();

        const iris = ctx.createRadialGradient(ex - 1, eyeY - 1, 0, ex, eyeY, 6);
        iris.addColorStop(0, '#a5f3fc');
        iris.addColorStop(0.4, '#2dd4bf');
        iris.addColorStop(1, '#0e7490');
        ctx.save();
        ctx.translate(ex, eyeY);
        ctx.scale(1, eyeSY);
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fillStyle = iris;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0.5, 0.5, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#000';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-1.2, -1.5, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fill();
        ctx.restore();
      });

      // Mouth
      const mouthY = cy + 14;
      const targetOpen = speakingRef.current
        ? 0.3 + 0.7 * Math.abs(Math.sin(t * 9))
        : 0;
      mouthOpen = lerp(mouthOpen, targetOpen, 0.18);

      ctx.save();
      ctx.strokeStyle = '#2dd4bf';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#2dd4bf';
      ctx.shadowBlur = 4;
      if (mouthOpen > 0.05) {
        ctx.beginPath();
        ctx.ellipse(cx, mouthY, 9, 1.5 + mouthOpen * 6, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(cx, mouthY, 7, mouthOpen * 5, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(cx, mouthY - 3, 8, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.stroke();
      }
      ctx.restore();

      ctx.restore(); // end sphere clip

      // Border ring
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(45,212,191,0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    frameId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <div ref={wrapRef} className="flex flex-col items-center">
      <canvas ref={canvasRef} width={120} height={120} />
      <p className="text-[10px] text-gray-500 mt-1 tracking-wide">AI Interviewer</p>
    </div>
  );
}