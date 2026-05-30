'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const features = [
  { icon: '👁️', title: 'Face Detection', desc: 'Ensures candidate presence throughout' },
  { icon: '🔄', title: 'Tab Switch Alert', desc: 'Flags when candidates leave the interview' },
  { icon: '🎤', title: 'Multiple Voice Detection', desc: 'Detects unauthorized assistance' },
  { icon: '👀', title: 'Attention Monitoring', desc: 'Tracks focus and gaze patterns' },
  { icon: '🔊', title: 'Stress Analysis', desc: 'Voice pattern analysis for authenticity' },
];

export function ProctoringSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    gsap.fromTo(
      section.querySelectorAll('.proc-card'),
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        stagger: 0.1,
        duration: 0.6,
        scrollTrigger: { trigger: section, start: 'top 70%' },
      }
    );

    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  }, []);

  return (
    <section ref={sectionRef} className="py-32 px-6 bg-black">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-display text-4xl md:text-6xl font-bold text-center mb-16">
          Nothing Gets Past Us.
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="proc-card glass rounded-2xl p-6 opacity-0 group hover:border-accent-blue/30 transition-all duration-300"
            >
              <span className="text-4xl block mb-4 group-hover:scale-125 group-hover:rotate-12 transition-transform duration-300 inline-block">
                {f.icon}
              </span>
              <h3 className="font-display text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
