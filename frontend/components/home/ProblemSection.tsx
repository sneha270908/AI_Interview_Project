'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Counter } from '../Counter';

gsap.registerPlugin(ScrollTrigger);

export function ProblemSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const wordsRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const words = wordsRef.current;
    if (!section || !words) return;

    const wordEls = words.querySelectorAll('.word');
    gsap.fromTo(
      wordEls,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        stagger: 0.05,
        duration: 0.6,
        scrollTrigger: {
          trigger: section,
          start: 'top 70%',
        },
      }
    );

    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  }, []);

  const sentence = 'Manual first-round interviews drain your team, slow hiring, and introduce unconscious bias at scale.';

  return (
    <section ref={sectionRef} className="py-32 px-6 grid-pattern bg-black">
      <div className="max-w-4xl mx-auto text-center">
        <Counter
          end={47}
          suffix=" Hours"
          className="font-display text-7xl md:text-9xl font-bold text-accent-blue block mb-4"
        />
        <p className="text-gray-400 text-lg mb-12">
          Average time wasted on first-round interviews per hire
        </p>
        <p ref={wordsRef} className="text-xl md:text-2xl text-gray-300 leading-relaxed">
          {sentence.split(' ').map((word, i) => (
            <span key={i} className="word inline-block mr-2 opacity-0">
              {word}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
