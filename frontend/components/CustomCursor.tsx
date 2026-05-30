'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const disabled = pathname?.startsWith('/interview/') || pathname?.startsWith('/join');

  useEffect(() => {
    if (disabled) {
      document.body.classList.remove('custom-cursor-active');
      return;
    }

    const cursor = cursorRef.current;
    if (!cursor) return;

    const move = (e: MouseEvent) => {
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
    };

    const addHover = () => cursor.classList.add('hover');
    const removeHover = () => cursor.classList.remove('hover');

    document.body.classList.add('custom-cursor-active');
    window.addEventListener('mousemove', move);

    const hoverables = document.querySelectorAll('a, button, [data-cursor-hover]');
    hoverables.forEach((el) => {
      el.addEventListener('mouseenter', addHover);
      el.addEventListener('mouseleave', removeHover);
    });

    const observer = new MutationObserver(() => {
      document.querySelectorAll('a, button, [data-cursor-hover]').forEach((el) => {
        el.removeEventListener('mouseenter', addHover);
        el.removeEventListener('mouseleave', removeHover);
        el.addEventListener('mouseenter', addHover);
        el.addEventListener('mouseleave', removeHover);
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.body.classList.remove('custom-cursor-active');
      window.removeEventListener('mousemove', move);
      observer.disconnect();
    };
  }, [disabled]);

  if (disabled) return null;

  return <div ref={cursorRef} className="custom-cursor hidden md:block" />;
}
