'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import VanillaTilt from 'vanilla-tilt';
import { MiniShape } from '../MiniShape';

gsap.registerPlugin(ScrollTrigger);

const cards = [
  {
    step: 'CREATE',
    type: 'cube' as const,
    title: 'Paste Your Job Description',
    desc: 'AI generates perfectly tailored interview questions in seconds',
    from: 'left',
  },
  {
    step: 'SEND',
    type: 'sphere' as const,
    title: 'Candidates Interview Anytime',
    desc: 'AI avatar asks questions. Candidates answer on their schedule.',
    from: 'right',
  },
  {
    step: 'REVIEW',
    type: 'torus' as const,
    title: 'Review Highlights in Minutes',
    desc: '90-second highlight reels. AI scorecards. Zero manual work.',
    from: 'left',
  },
];

export function HowItWorksSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const cardEls = section.querySelectorAll('.how-card');
    cardEls.forEach((card, i) => {
      const fromX = cards[i]?.from === 'right' ? 100 : -100;
      gsap.fromTo(
        card,
        { opacity: 0, x: fromX },
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          scrollTrigger: {
            trigger: card,
            start: 'top 80%',
          },
        }
      );

      VanillaTilt.init(card as HTMLElement, {
        max: 15,
        speed: 400,
        glare: true,
        'max-glare': 0.1,
      });
    });

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
      cardEls.forEach((card) => {
        (card as HTMLElement & { vanillaTilt?: { destroy: () => void } }).vanillaTilt?.destroy();
      });
    };
  }, []);

  return (
    <section id="how-it-works" ref={sectionRef} className="py-32 px-6 bg-bg-secondary">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-display text-4xl md:text-5xl font-bold text-center mb-4">
          How It Works
        </h2>
        <p className="text-gray-500 text-center mb-16">Three steps to transform your hiring</p>

        <div className="grid md:grid-cols-3 gap-8">
          {cards.map((card) => (
            <div
              key={card.step}
              className="how-card glass rounded-2xl p-8 glow-border opacity-0"
              data-tilt
            >
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-mono text-accent-blue tracking-widest">{card.step}</span>
                <MiniShape type={card.type} />
              </div>
              <h3 className="font-display text-xl font-semibold mb-3">{card.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
