'use client';

import { useState } from 'react';
import Link from 'next/link';
import { GlitchText } from '../GlitchText';
import { VideoModal } from '../VideoModal';
import { MagneticButton } from '../MagneticButton';

export function HeroSection() {
  const [videoOpen, setVideoOpen] = useState(false);

  const scrollToDemo = () => {
    document.querySelector('#demo')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative h-screen w-full overflow-hidden bg-black">
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />
      {/* Subtle radial vignette */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.7) 100%)',
        }}
      />

      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6 pointer-events-none">
        <GlitchText
          text="HIRE SMARTER."
          className="font-display text-5xl sm:text-7xl md:text-8xl lg:text-[120px] font-bold leading-none tracking-tight text-white"
          as="h1"
          delay={800}
        />
        <GlitchText
          text="INTERVIEW FASTER."
          className="font-display text-5xl sm:text-7xl md:text-8xl lg:text-[120px] font-bold leading-none tracking-tight mt-2 text-[#9ca3af]"
          as="h1"
          delay={950}
        />

        <p className="mt-8 text-base md:text-xl tracking-[3px] max-w-xl leading-relaxed text-[#6b7280]">
          The AI that interviews for you.
          <br />
          24/7. At scale. Without bias.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 pointer-events-auto">
          <MagneticButton
            onClick={scrollToDemo}
            className="px-8 py-3 rounded-xl text-white font-medium text-sm border border-white/20 bg-white/5 transition-all duration-300 hover:scale-105 hover:bg-white/10 hover:border-white/40"
          >
            See It Live
          </MagneticButton>
          <Link
            href="/join"
            className="px-8 py-3 rounded-xl text-white font-medium text-sm border border-white/15 bg-white/5 transition-all duration-300 hover:border-white/30 hover:bg-white/10"
          >
            I&apos;m a Candidate →
          </Link>
          <MagneticButton
            onClick={() => setVideoOpen(true)}
            magnetic={false}
            className="flex items-center gap-2 text-[#6b7280] hover:text-white transition-colors text-sm group bg-transparent border-none cursor-pointer"
          >
            Watch Demo
            <span className="arrow-hover inline-block">→</span>
          </MagneticButton>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 scroll-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-1.5">
          <div className="w-1 h-2 bg-white/40 rounded-full" />
        </div>
        <span className="text-xs text-[#4b5563] tracking-widest">SCROLL</span>
      </div>

      <VideoModal isOpen={videoOpen} onClose={() => setVideoOpen(false)} />
    </section>
  );
}