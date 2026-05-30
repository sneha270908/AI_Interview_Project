'use client';

import { useEffect, useState } from 'react';

interface GlitchTextProps {
  text: string;
  className?: string;
  delay?: number;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
}

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';

export function GlitchText({ text, className = '', delay = 0, as: Tag = 'h1' }: GlitchTextProps) {
  const [display, setDisplay] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      let iteration = 0;
      const maxIterations = text.length * 3;
      const interval = setInterval(() => {
        setDisplay(
          text
            .split('')
            .map((char, i) => {
              if (char === ' ') return ' ';
              if (char === '.' || char === ',') return char;
              if (i < iteration / 3) return text[i];
              return CHARS[Math.floor(Math.random() * CHARS.length)];
            })
            .join('')
        );
        iteration++;
        if (iteration >= maxIterations) {
          clearInterval(interval);
          setDisplay(text);
          setDone(true);
        }
      }, 25);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [text, delay]);

  return (
    <Tag
      className={`${className} ${done ? 'glitch-chromatic' : ''}`}
      style={{ transition: 'text-shadow 0.3s ease' }}
    >
      {display || '\u00A0'}
    </Tag>
  );
}
