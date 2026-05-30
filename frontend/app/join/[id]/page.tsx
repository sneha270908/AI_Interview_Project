'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

/** Recruiter share link: /join/{interviewId} redirects to interview welcome */
export default function JoinDirectPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id || '');

  useEffect(() => {
    router.replace(`/interview/${id}`);
  }, [id, router]);

  return (
    <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
