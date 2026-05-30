'use client';

const testimonials = [
  { name: 'Sarah Chen', role: 'Head of Talent, Stripe', text: 'Cut our first-round interview time by 70%. The AI scorecards are eerily accurate.' },
  { name: 'Marcus Williams', role: 'VP Engineering, Notion', text: 'We went from 3 weeks to 3 days for initial screening. Game changer.' },
  { name: 'Priya Patel', role: 'Recruiting Lead, Figma', text: 'Candidates love the async format. Our completion rate jumped to 94%.' },
  { name: 'James Okonkwo', role: 'CTO, Linear', text: 'The highlight reels save me hours every week. I watch 90 seconds instead of 45 minutes.' },
  { name: 'Elena Rodriguez', role: 'HR Director, Vercel', text: 'Proctoring caught what human reviewers missed. Fair and thorough.' },
  { name: 'David Kim', role: 'Founder, Acme AI', text: 'Scaled from 10 to 500 interviews/month without adding a single recruiter.' },
];

function TestimonialCard({ t }: { t: typeof testimonials[0] }) {
  return (
    <div className="glass rounded-2xl p-6 min-w-[320px] mx-3 flex-shrink-0">
      <p className="text-gray-300 text-sm leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
      <div>
        <p className="font-display font-semibold text-sm">{t.name}</p>
        <p className="text-gray-500 text-xs">{t.role}</p>
      </div>
    </div>
  );
}

export function TestimonialsSection() {
  const row1 = [...testimonials, ...testimonials];
  const row2 = [...testimonials.slice(3), ...testimonials.slice(0, 3), ...testimonials.slice(3), ...testimonials.slice(0, 3)];

  return (
    <section className="py-24 bg-bg-secondary overflow-hidden">
      <h2 className="font-display text-3xl font-bold text-center mb-12">Trusted by hiring teams</h2>

      <div className="flex animate-scroll-left mb-6">
        {row1.map((t, i) => (
          <TestimonialCard key={`r1-${i}`} t={t} />
        ))}
      </div>

      <div className="flex animate-scroll-right">
        {row2.map((t, i) => (
          <TestimonialCard key={`r2-${i}`} t={t} />
        ))}
      </div>
    </section>
  );
}
