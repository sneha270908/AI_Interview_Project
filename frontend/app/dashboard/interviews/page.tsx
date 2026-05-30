'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { api } from '@/lib/api';
import { interviews as demoInterviews } from '@/lib/demo-data';
import type { InterviewRecord } from '@/lib/api';
import { Loader2 } from 'lucide-react';

function formatDate(iso?: string) {
  if (!iso) return 'Recently';
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString();
}

export default function InterviewsPage() {
  const [items, setItems] = useState<InterviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingDemo, setUsingDemo] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const { interviews } = await api.listInterviews();
        setItems(interviews);
        setUsingDemo(false);
      } catch {
        setItems(
          demoInterviews.map((d) => ({
            _id: d.id,
            title: d.title,
            status: d.status.toLowerCase(),
            questions: [],
          }))
        );
        setUsingDemo(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <DashboardLayout title="Interviews">
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-accent-blue" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Interviews">
      {usingDemo && (
        <p className="text-xs text-yellow-500/80 mb-4">Showing demo data — connect backend for live interviews.</p>
      )}
      <div className="grid gap-4">
        {items.length === 0 ? (
          <div className="glass rounded-xl p-8 text-center text-gray-400">
            No interviews yet.{' '}
            <Link href="/create" className="text-accent-blue hover:underline">
              Create one
            </Link>
          </div>
        ) : (
          items.map((item) => (
            <div key={item._id} className="glass rounded-xl p-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-display font-semibold text-lg">{item.title || 'Untitled'}</h3>
                <p className="text-gray-500 text-sm mt-1">Created {formatDate(item.createdAt)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs ${
                    item.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                  }`}
                >
                  {item.status || 'active'}
                </span>
                <Link href={`/review/${item._id}`} className="text-sm text-accent-blue hover:underline">
                  Review
                </Link>
                <Link
                  href={`/interview/${item._id}`}
                  className="text-sm px-3 py-1.5 rounded-lg border border-white/20 hover:border-accent-blue"
                >
                  Preview
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
