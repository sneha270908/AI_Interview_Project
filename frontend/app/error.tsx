'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0a0a12] flex flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-3xl font-bold text-[#2dd4bf] mb-4">Something went wrong</h1>
      <p className="text-gray-400 mb-8 max-w-md">{error.message || 'An unexpected error occurred.'}</p>
      <button
        onClick={reset}
        className="px-6 py-3 rounded-lg gradient-btn text-white font-medium"
      >
        Try again
      </button>
    </div>
  );
}
