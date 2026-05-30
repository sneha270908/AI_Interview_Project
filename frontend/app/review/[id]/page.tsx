'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

/** Legacy route — redirect to real session review with video + scores */
export default function LegacyReviewRedirect() {
  const params = useParams();
  const router = useRouter();
  const interviewId = String(params.id || '');

  useEffect(() => {
    async function redirect() {
      try {
        const { sessions } = await api.listSessions(interviewId);
        const session =
          sessions.find((s) => s.videoUrl) ||
          sessions.find((s) => s.status === 'completed') ||
          sessions.find((s) => s.status === 'processing') ||
          sessions[0];

        if (session?._id) {
          router.replace(`/review/session/${session._id}`);
          return;
        }
      } catch {
        /* fall through */
      }
      router.replace('/dashboard/candidates');
    }
    redirect();
  }, [interviewId, router]);

  return (
    <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center">
      <Loader2 className="animate-spin text-accent-blue" />
    </div>
  );
}
