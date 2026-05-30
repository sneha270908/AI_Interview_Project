'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { GlitchText } from '../GlitchText';
import { VideoModal } from '../VideoModal';
import { MagneticButton } from '../MagneticButton';

const ThreeScene = dynamic(() => import('../ThreeScene').then((m) => m.ThreeScene), {
  ssr: false,
  loading: () => (
    <div
      className="absolute inset-0"
      style={{
        background: 'radial-gradient(ellipse at 30% 40%, #1e1040 0%, #0f0728 40%, #06030f 100%)',
      }}
      aria-hidden
    />
  ),
});

export function HeroSection() {
  const [videoOpen, setVideoOpen] = useState(false);

  const scrollToDemo = () => {
    document.querySelector('#demo')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative h-screen w-full overflow-hidden hero-orb-bg">
      <ThreeScene variant="hero" className="z-0" />

      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6 pointer-events-none">
        <GlitchText
          text="HIRE SMARTER."
          className="font-display text-5xl sm:text-7xl md:text-8xl lg:text-[120px] font-bold leading-none tracking-tight bg-gradient-to-r from-[#c084fc] via-[#a855f7] to-[#e879f9] bg-clip-text text-transparent"
          as="h1"
          delay={800}
        />
        <GlitchText
          text="INTERVIEW FASTER."
          className="font-display text-5xl sm:text-7xl md:text-8xl lg:text-[120px] font-bold leading-none tracking-tight mt-2 bg-gradient-to-r from-[#3b82f6] via-[#a855f7] to-[#06b6d4] bg-clip-text text-transparent"
          as="h1"
          delay={950}
        />

        <p className="mt-8 text-base md:text-xl tracking-[3px] max-w-xl leading-relaxed text-[#94a3b8]">
          The AI that interviews for you.
          <br />
          24/7. At scale. Without bias.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 pointer-events-auto">
          <MagneticButton
            onClick={scrollToDemo}
            className="px-8 py-3 rounded-xl text-white font-medium text-sm backdrop-blur-md border border-[#a855f7]/60 bg-white/5 transition-all duration-300 hover:scale-105 hover:bg-[#a855f7]/15 hover:shadow-[0_0_35px_rgba(168,85,247,0.35)]"
          >
            See It Live
          </MagneticButton>
          <Link
            href="/join"
            className="px-8 py-3 rounded-xl text-white font-medium text-sm backdrop-blur-md border border-white/20 bg-white/5 transition-all duration-300 hover:border-[#06b6d4]/60 hover:bg-[#06b6d4]/10"
          >
            I&apos;m a Candidate →
          </Link>
          <MagneticButton
            onClick={() => setVideoOpen(true)}
            magnetic={false}
            className="flex items-center gap-2 text-[#64748b] hover:text-[#a855f7] transition-colors text-sm group bg-transparent border-none cursor-pointer"
          >
            Watch Demo
            <span className="arrow-hover inline-block">→</span>
          </MagneticButton>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 scroll-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-[#a855f7]/30 flex items-start justify-center p-1.5">
          <div className="w-1 h-2 bg-[#c084fc]/60 rounded-full" />
        </div>
        <span className="text-xs text-[#475569] tracking-widest">SCROLL</span>
      </div>

      <VideoModal isOpen={videoOpen} onClose={() => setVideoOpen(false)} />
    </section>
  );
}
