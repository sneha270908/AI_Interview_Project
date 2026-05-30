'use client';

export default function InterviewError({ reset }: { reset: () => void }) {
  return (
    <div className="min-h-screen bg-[#0a0a12] flex flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-2xl font-bold text-[#2dd4bf] mb-4">Interview failed to load</h1>
      <p className="text-gray-400 mb-6">Please refresh or try again.</p>
      <button onClick={reset} className="px-6 py-3 rounded-lg gradient-btn text-white">
        Retry
      </button>
    </div>
  );
}
