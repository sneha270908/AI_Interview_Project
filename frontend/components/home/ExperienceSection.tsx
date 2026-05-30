'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

function BrowserMockup({ side }: { side: 'recruiter' | 'candidate' }) {
  const isRecruiter = side === 'recruiter';

  return (
    <div
      className="glass rounded-xl overflow-hidden"
      style={{ transform: 'perspective(1000px) rotateY(5deg)' }}
    >
      <div className="flex items-center gap-2 px-4 py-3 bg-black/50 border-b border-white/10">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
        </div>
        <div className="flex-1 mx-4">
          <div className="bg-white/5 rounded-md px-3 py-1 text-xs text-gray-500 font-mono">
            {isRecruiter ? 'app.hireai.com/dashboard' : 'app.hireai.com/interview/abc123'}
          </div>
        </div>
      </div>

      <div className="p-4 min-h-[280px]">
        {isRecruiter ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium">Candidates</span>
              <span className="flex items-center gap-1.5 text-xs text-red-400">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                LIVE
              </span>
            </div>
            {['Sarah Chen', 'Marcus Lee', 'Priya Patel'].map((name, i) => (
              <div key={name} className="flex items-center gap-3 p-3 rounded-lg bg-white/3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center text-xs font-bold">
                  {name[0]}
                </div>
                <div className="flex-1">
                  <p className="text-sm">{name}</p>
                  <div className="h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full bg-accent-blue rounded-full animate-pulse"
                      style={{ width: `${[85, 72, 91][i]}%`, animationDelay: `${i * 0.3}s` }}
                    />
                  </div>
                </div>
                <span className="text-xs text-accent-blue font-mono">{[85, 72, 91][i]}%</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-accent-blue/20 to-accent-purple/20 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-accent-blue/30 flex items-center justify-center text-2xl">🤖</div>
              </div>
              <div className="flex-1 breathe-green rounded-xl bg-black/50 h-24 flex items-center justify-center">
                <span className="text-xs text-gray-500">Camera Preview</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Question 3 of 6</span>
                <span>2:34</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full w-1/2 bg-accent-green rounded-full" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function ExperienceSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    gsap.fromTo(
      '.exp-left',
      { opacity: 0, x: -80 },
      { opacity: 1, x: 0, duration: 0.8, scrollTrigger: { trigger: section, start: 'top 70%' } }
    );
    gsap.fromTo(
      '.exp-right',
      { opacity: 0, x: 80 },
      { opacity: 1, x: 0, duration: 0.8, scrollTrigger: { trigger: section, start: 'top 70%' } }
    );

    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  }, []);

  return (
    <section id="demo" ref={sectionRef} className="py-32 px-6 bg-bg-secondary">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-display text-4xl md:text-5xl font-bold text-center mb-4">
          The Experience
        </h2>
        <p className="text-gray-500 text-center mb-16">Two sides. One seamless platform.</p>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="exp-left opacity-0">
            <p className="text-sm text-accent-blue font-mono mb-4 tracking-widest">RECRUITER VIEW</p>
            <BrowserMockup side="recruiter" />
          </div>
          <div className="exp-right opacity-0">
            <p className="text-sm text-accent-purple font-mono mb-4 tracking-widest">CANDIDATE VIEW</p>
            <BrowserMockup side="candidate" />
          </div>
        </div>
      </div>
    </section>
  );
}
