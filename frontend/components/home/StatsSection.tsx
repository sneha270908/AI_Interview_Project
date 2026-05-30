'use client';

import { Counter } from '../Counter';

const stats = [
  { value: 10000, suffix: '+', label: 'Interviews Conducted' },
  { value: 98, suffix: '%', label: 'Transcription Accuracy' },
  { value: 2, suffix: 's', label: 'Average Processing Time', prefix: '' },
  { value: 60, suffix: '%', label: 'Reduction in Time-to-Hire' },
];

export function StatsSection() {
  return (
    <section id="features" className="py-24 px-6 bg-black border-y border-white/5">
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className={`text-center ${i < stats.length - 1 ? 'md:border-r md:border-white/10' : ''}`}
          >
            <Counter
              end={stat.value}
              suffix={stat.suffix}
              prefix={stat.prefix}
              className="font-display text-5xl md:text-7xl font-bold text-accent-blue block"
            />
            <p className="text-gray-500 text-sm mt-3">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
