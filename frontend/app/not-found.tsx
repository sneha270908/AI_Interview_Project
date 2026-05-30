import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a12] flex flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-6xl font-bold text-[#2dd4bf]">404</h1>
      <p className="text-gray-400 mt-4 mb-8">This page doesn&apos;t exist.</p>
      <Link href="/" className="px-6 py-3 rounded-lg gradient-btn text-white font-medium">
        Back to Home
      </Link>
    </div>
  );
}
