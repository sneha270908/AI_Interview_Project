'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { api } from '@/lib/api';
import type { AiSession } from '@/lib/api';
import { Loader2 } from 'lucide-react';

function ScoreBadge({ score }: { score?: number }) {
  if (score == null) return <span className="text-gray-600 text-xs">—</span>;
  const color = score > 80 ? 'bg-green-500/20 text-green-400' : score >= 60 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400';
  return <span className={`px-2 py-0.5 rounded-full text-xs font-mono ${color}`}>{score}</span>;
}

function statusLabel(status: string) {
  if (status === 'completed') return 'Completed';
  if (status === 'processing') return 'Processing';
  if (status === 'in_progress') return 'In Progress';
  return status;
}

export default function CandidatesPage() {
  const [sessions, setSessions] = useState<AiSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .listRecruiterSessions()
      .then(({ sessions: list }) => setSessions(list))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout title="Candidates">
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-accent-blue" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="glass rounded-xl p-8 text-center text-gray-400">
          <p>No candidate submissions yet.</p>
          <p className="text-sm text-gray-600 mt-2">
            Share your interview link or invite emails when creating an interview.
          </p>
          <Link href="/create" className="text-accent-blue hover:underline text-sm mt-4 inline-block">
            Create interview →
          </Link>
        </div>
      ) : (
        <div className="glass rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-white/10">
                <th className="px-6 py-4">Candidate</th>
                <th className="px-6 py-4">Interview</th>
                <th className="px-6 py-4">Score</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Video</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s._id} className="border-b border-white/5 hover:bg-white/3">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-blue/50 to-accent-purple/50 flex items-center justify-center text-xs font-bold">
                        {(s.candidateName || '?')[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm">{s.candidateName || 'Unknown'}</p>
                        <p className="text-xs text-gray-600">{s.candidateEmail || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">{s.interviewTitle || 'Interview'}</td>
                  <td className="px-6 py-4">
                    <ScoreBadge score={s.scores?.overall} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">{statusLabel(s.status)}</td>
                  <td className="px-6 py-4 text-xs">
                    {s.videoUrl ? '✓ Uploaded' : '—'}
                    {(s.suspiciousActivityCount ?? 0) > 0 && (
                      <span className="block text-orange-400 mt-0.5">
                        ⚠ {s.suspiciousActivityCount} suspicious
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/review/session/${s._id}`} className="text-xs text-accent-blue hover:underline">
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
