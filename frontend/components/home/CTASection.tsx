'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';

const ThreeScene = dynamic(() => import('../ThreeScene').then((m) => m.ThreeScene), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-[#0a0a12]" aria-hidden />,
});
import { GlitchText } from '../GlitchText';

export function CTASection() {
  return (
    <section id="pricing" className="relative h-screen flex items-center justify-center overflow-hidden bg-[#0a0a12]">
      <ThreeScene variant="hero" />

      <div className="relative z-10 text-center px-6">
        <GlitchText
          text="Ready to Transform Your Hiring?"
          className="font-display text-3xl md:text-5xl lg:text-6xl font-bold max-w-3xl mx-auto leading-tight"
          as="h2"
        />

        <Link
          href="/signup"
          className="inline-block mt-12 px-12 py-5 text-lg font-semibold text-white rounded-2xl relative overflow-hidden group"
          style={{
            background: 'linear-gradient(135deg, #2dd4bf, #a78bfa)',
            boxShadow: '0 0 40px rgba(45,212,191,0.35)',
          }}
        >
          <span className="relative z-10">Start For Free →</span>
          <div className="absolute inset-0 bg-gradient-to-r from-accent-purple to-accent-blue opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </Link>
      </div>
    </section>
  );
}
