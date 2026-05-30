'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { AuthBackground } from './AuthBackground';

const ThreeScene = dynamic(
  () => import('./ThreeScene').then((m) => m.ThreeScene),
  {
    ssr: false,
    loading: () => <AuthBackground />,
  }
);

interface SceneBackgroundProps {
  variant?: 'hero' | 'auth';
  showQuote?: string;
  preferLightweight?: boolean;
}

export function SceneBackground({ variant = 'hero', showQuote, preferLightweight }: SceneBackgroundProps) {
  const [mounted, setMounted] = useState(false);
  const [useLight, setUseLight] = useState(preferLightweight ?? variant === 'auth');

  useEffect(() => {
    setMounted(true);
    if (variant === 'auth') {
      setUseLight(true);
      return;
    }
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) setUseLight(true);
    } catch {
      setUseLight(true);
    }
  }, [variant]);

  if (!mounted) {
    return <AuthBackground quote={showQuote} />;
  }

  if (useLight) {
    return <AuthBackground quote={showQuote} />;
  }

  return <ThreeScene variant={variant} showQuote={showQuote} />;
}
