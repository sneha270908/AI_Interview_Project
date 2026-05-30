import { Navbar } from '@/components/Navbar';
import { HeroSection } from '@/components/home/HeroSection';
import { ProblemSection } from '@/components/home/ProblemSection';
import { HowItWorksSection } from '@/components/home/HowItWorksSection';
import { StatsSection } from '@/components/home/StatsSection';
import { ExperienceSection } from '@/components/home/ExperienceSection';
import { ProctoringSection } from '@/components/home/ProctoringSection';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { CTASection } from '@/components/home/CTASection';
import { Footer } from '@/components/Footer';

export default function HomePage() {
  return (
    <main className="bg-[#0a0a12] min-h-screen">
      <Navbar />
      <HeroSection />
      <ProblemSection />
      <HowItWorksSection />
      <StatsSection />
      <ExperienceSection />
      <ProctoringSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </main>
  );
}
