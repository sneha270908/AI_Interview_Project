'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LogOut, Loader2, Play } from 'lucide-react';
import { clearSession, getToken, getUser, setSession, type User } from '@/lib/auth';
import { api } from '@/lib/api';
import type { CandidateAssignment } from '@/lib/api';

export default function CandidateDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [assignments, setAssignments] = useState<CandidateAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const token = getToken();
      if (!token) {
        router.replace('/login?role=candidate');
        return;
      }

      try {
        const { user: me } = await api.getMe();
        const u = me as User & { _id?: string; role?: string };
        if (u.role !== 'candidate') {
          router.replace('/dashboard');
          return;
        }
        const normalized: User = {
          id: u.id || u._id,
          name: u.name,
          email: u.email,
          company: u.company,
          role: 'candidate',
        };
        setUser(normalized);
        setSession(token, normalized);

        const { assignments: list } = await api.getCandidateAssignments();
        setAssignments(list);
      } catch {
        clearSession();
        router.replace('/login?role=candidate');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  const logout = () => {
    clearSession();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center">
        <Loader2 className="animate-spin text-accent-blue" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a12]">
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-display font-bold text-xl">HIREAI</Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">Hi, {user?.name?.split(' ')[0]}</span>
          <button onClick={logout} className="text-sm text-gray-500 hover:text-red-400 flex items-center gap-1">
            <LogOut size={14} /> Logout
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="font-display text-3xl font-bold mb-2">Your Interviews</h1>
        <p className="text-gray-500 mb-8 text-sm">
          Interviews assigned to <span className="text-gray-300">{user?.email}</span>. No invite link needed when you login.
        </p>

        {assignments.length === 0 ? (
          <div className="glass rounded-xl p-8 text-center">
            <p className="text-gray-400 mb-4">No interviews assigned to your email yet.</p>
            <p className="text-sm text-gray-600 mb-6">
              Ask your recruiter to add <strong className="text-gray-400">{user?.email}</strong> when creating the interview,
              or use an invite link:
            </p>
            <Link href="/join" className="text-accent-blue hover:underline text-sm">
              Join with invite link →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((a) => (
              <div key={a.interviewId} className="glass rounded-xl p-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-display font-semibold text-lg">{a.title || 'Interview'}</h2>
                  <p className="text-gray-500 text-sm mt-1">{a.questionCount} questions</p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs ${
                      a.sessionStatus === 'completed' || a.sessionStatus === 'processing'
                        ? 'bg-green-500/20 text-green-400'
                        : a.sessionStatus === 'in_progress'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-blue-500/20 text-blue-400'
                    }`}
                  >
                    {a.sessionStatus === 'pending' ? 'Not started' : a.sessionStatus.replace('_', ' ')}
                  </span>
                  {a.sessionStatus === 'completed' || a.sessionStatus === 'processing' ? (
                    <span className="text-sm text-gray-500">Submitted ✓</span>
                  ) : (
                    <Link
                      href={`/interview/${a.interviewId}`}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-btn text-white text-sm"
                    >
                      <Play size={14} /> Start
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 pt-6 border-t border-white/10 text-center">
          <p className="text-xs text-gray-600 mb-2">Have a direct invite link instead?</p>
          <Link href="/join" className="text-sm text-accent-blue hover:underline">
            Join via link (no login)
          </Link>
        </div>
      </main>
    </div>
  );
}
