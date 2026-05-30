'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthBackground } from '@/components/AuthBackground';
import { Navbar } from '@/components/Navbar';
import { Loader2, ArrowRight, Link2 } from 'lucide-react';
import { api } from '@/lib/api';
import { parseInviteInput, setCandidateInfo } from '@/lib/candidate-session';

export default function JoinInterviewPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [invite, setInvite] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }

    const interviewId = parseInviteInput(invite);
    if (!interviewId) {
      setError('Paste your invite link or interview code from the recruiter');
      return;
    }

    setLoading(true);
    try {
      await api.getPublicInterview(interviewId);
      setCandidateInfo({ name: name.trim(), email: email.trim() });
      router.push(`/interview/${interviewId}`);
    } catch {
      setError('Interview not found. Check your invite link or ask your recruiter for a new one.');
    } finally {
      setLoading(false);
    }
  };

  const tryDemo = () => {
    setCandidateInfo({ name: name.trim() || 'Demo Candidate', email: email.trim() });
    router.push('/interview/demo');
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] overflow-hidden">
      <Navbar />
      <div className="flex flex-col lg:flex-row min-h-screen pt-16">
        <div className="hidden lg:block lg:w-[58%] relative h-[calc(100vh-4rem)] overflow-hidden">
          <AuthBackground quote="No account needed — just your invite link." />
        </div>
        <div className="lg:hidden fixed inset-0 pt-16 -z-0 pointer-events-none">
          <AuthBackground />
        </div>

        <div className="relative z-20 flex-1 w-full lg:w-[42%] min-h-[calc(100vh-4rem)] overflow-y-auto bg-[#0a0a12]/90 lg:bg-[#0a0a12]/95 backdrop-blur-sm lg:border-l border-white/10">
          <div className="flex items-center justify-center min-h-full px-6 sm:px-10 py-10">
            <div className="w-full max-w-md">
              <Link href="/" className="font-display font-bold text-xl flex items-center gap-0.5 mb-8">
                HIREAI<span className="w-1.5 h-1.5 rounded-full bg-accent-blue inline-block" />
              </Link>

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-purple/10 border border-accent-purple/30 text-accent-purple text-xs mb-4">
                <Link2 size={12} />
                Candidate — no login required
              </div>

              <h1 className="font-display text-3xl font-bold mb-2">Join your interview</h1>
              <p className="text-gray-500 mb-8">
                Your recruiter sent you a link, or login if your email was invited.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-accent-blue"
                />
                <input
                  type="email"
                  placeholder="Email (optional)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-accent-blue"
                />
                <input
                  type="text"
                  placeholder="Paste invite link or interview code"
                  value={invite}
                  onChange={(e) => setInvite(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-accent-blue font-mono text-sm"
                />

                {error && <p className="text-red-400 text-sm">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-lg gradient-btn text-white font-medium flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {loading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>
                      Start Interview
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-white/10">
                <p className="text-xs text-gray-600 mb-3">Just exploring? Try the demo interview:</p>
                <button
                  type="button"
                  onClick={tryDemo}
                  className="text-sm text-accent-blue hover:underline"
                >
                  Open demo interview →
                </button>
              </div>

              <p className="text-center text-gray-600 text-xs mt-8">
                Invited by email?{' '}
                <Link href="/login" className="text-accent-blue hover:underline">
                  Login as candidate
                </Link>
                {' · '}
                Recruiter?{' '}
                <Link href="/login" className="text-accent-blue hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
