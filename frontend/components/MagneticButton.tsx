'use client';

import { useRef, useEffect, ReactNode } from 'react';

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  magnetic?: boolean;
}

export function MagneticButton({ children, magnetic = true, className = '', ...props }: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!magnetic) return;
    const el = ref.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist < 80) {
        el.style.transform = `translate(${dx * 0.25}px, ${dy * 0.25}px)`;
      } else {
        el.style.transform = '';
      }
    };

    const onLeave = () => {
      el.style.transform = '';
    };

    window.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, [magnetic]);

  return (
    <button ref={ref} className={className} data-cursor-hover {...props}>
      {children}
    </button>
  );
}
