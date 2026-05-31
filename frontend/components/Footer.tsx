import Link from 'next/link';

export function Footer() {
  return (
    <footer className="py-12 px-6 bg-black border-t border-white/5">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <p className="font-display font-bold text-lg flex items-center gap-0.5">
            HIREAI
            <span className="w-1.5 h-1.5 rounded-full bg-white/40 inline-block" />
          </p>
          <p className="text-gray-600 text-sm mt-1">Interview smarter. Hire faster.</p>
        </div>

        <div className="flex gap-8 text-sm text-gray-500">
          <Link href="/join" className="hover:text-white transition-colors">Take Interview</Link>
          <Link href="/login" className="hover:text-white transition-colors">Recruiter Login</Link>
          <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
        </div>

        <p className="text-gray-600 text-xs">Built with Banao Technology</p>
      </div>
    </footer>
  );
}