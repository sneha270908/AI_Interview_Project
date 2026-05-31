'use client';

import Link from 'next/link';
import { GlitchText } from '../GlitchText';

export function CTASection() {
  return (
    <section id="pricing" className="relative h-screen flex items-center justify-center overflow-hidden bg-[#0a0a0a]">
      {/* Subtle grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
          backgroundSize: '80px 80px',
        }}
      />

      <div className="relative z-10 text-center px-6">
        <GlitchText
          text="Ready to Transform Your Hiring?"
          className="font-display text-3xl md:text-5xl lg:text-6xl font-bold max-w-3xl mx-auto leading-tight text-white"
          as="h2"
        />

        <Link
          href="/signup"
          className="inline-block mt-12 px-12 py-5 text-lg font-semibold text-white rounded-2xl border border-white/20 bg-white/5 transition-all duration-300 hover:bg-white/10 hover:border-white/40 hover:scale-105"
        >
          Start For Free →
        </Link>
      </div>
    </section>
  );
}