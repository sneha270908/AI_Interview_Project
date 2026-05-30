'use client';

import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { AiSession } from '@/lib/api';
import { Loader2 } from 'lucide-react';

function ScoreBadge({ score }: { score?: number }) {
  if (score == null) return <span className="text-gray-600 text-xs">—</span>;
  const color = score > 80 ? 'bg-green-500/20 text-green-400' : score >= 60 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400';
  return <span className={`px-2 py-0.5 rounded-full text-xs font-mono ${color}`}>{score}</span>;
}

export default function DashboardPage() {
  const [animated, setAnimated] = useState(false);
  const [sessions, setSessions] = useState<AiSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ active: 0, completed: 0, avgScore: '—', pending: 0 });

  useEffect(() => {
    setTimeout(() => setAnimated(true), 100);

    async function load() {
      try {
        const [{ interviews }, { sessions: allSessions }] = await Promise.all([
          api.listInterviews(),
          api.listRecruiterSessions(),
        ]);
        setSessions(allSessions.slice(0, 6));

        const completed = allSessions.filter((s) => s.status === 'completed' || s.status === 'processing');
        const pending = allSessions.filter((s) => s.status === 'in_progress').length;
        const scores = completed.map((s) => s.scores?.overall).filter((v): v is number => v != null);
        const avg = scores.length ? `${Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)}%` : '—';

        setStats({
          active: interviews.filter((i) => i.status === 'active').length,
          completed: completed.length,
          avgScore: avg,
          pending,
        });
      } catch {
        /* keep defaults */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const statCards = [
    { label: 'Active Interviews', value: stats.active, color: 'text-accent-blue' },
    { label: 'Completed', value: stats.completed, color: 'text-accent-green' },
    { label: 'Avg Score', value: stats.avgScore, color: 'text-accent-purple' },
    { label: 'In Progress', value: stats.pending, color: 'text-yellow-500' },
  ];

  return (
    <DashboardLayout title="Overview">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, i) => (
          <div
            key={stat.label}
            className={`glass rounded-xl p-6 transition-all duration-500 ${animated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: `${i * 100}ms` }}
          >
            <p className="text-gray-500 text-sm">{stat.label}</p>
            <p className={`font-display text-3xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
          <h2 className="font-display font-semibold">Recent Submissions</h2>
          <Link href="/dashboard/candidates" className="text-xs text-accent-blue hover:underline">
            View all
          </Link>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-accent-blue" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-12">No submissions yet. Launch an interview and share the link.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-white/5">
                <th className="px-6 py-3">Candidate</th>
                <th className="px-6 py-3">Interview</th>
                <th className="px-6 py-3">Score</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s._id} className="border-b border-white/5 hover:bg-white/3">
                  <td className="px-6 py-4 text-sm">{s.candidateName || 'Unknown'}</td>
                  <td className="px-6 py-4 text-sm text-gray-400">{s.interviewTitle}</td>
                  <td className="px-6 py-4"><ScoreBadge score={s.scores?.overall} /></td>
                  <td className="px-6 py-4 text-xs text-gray-400">{s.status}</td>
                  <td className="px-6 py-4">
                    <Link href={`/review/session/${s._id}`} className="text-xs text-accent-blue hover:underline">
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DashboardLayout>
  );
}
