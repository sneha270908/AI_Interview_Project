'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LogOut } from 'lucide-react';
import { clearSession, getToken, getUser, setSession, type User } from '@/lib/auth';
import { api } from '@/lib/api';

const navItems = [
  { href: '/dashboard', icon: '🏠', label: 'Overview' },
  { href: '/dashboard/interviews', icon: '🎥', label: 'Interviews' },
  { href: '/dashboard/candidates', icon: '👥', label: 'Candidates' },
  { href: '/dashboard/analytics', icon: '📊', label: 'Analytics' },
  { href: '/dashboard/settings', icon: '⚙️', label: 'Settings' },
];

export function DashboardLayout({ children, title }: { children: React.ReactNode; title: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function validate() {
      const token = getToken();
      if (!token) {
        router.replace('/login');
        return;
      }

      const cached = getUser();
      if (cached) setUser(cached);

      try {
        const { user: fresh } = await api.getMe();
        const raw = fresh as User & { _id?: string; role?: string };
        if (raw.role === 'candidate') {
          router.replace('/candidate');
          return;
        }
        const u: User = {
          id: raw.id || raw._id,
          name: raw.name,
          email: raw.email,
          company: raw.company,
          role: raw.role,
        };
        setUser(u);
        setSession(token, u);
      } catch {
        clearSession();
        router.replace('/login');
        return;
      }

      setReady(true);
    }

    validate();
  }, [router]);

  const logout = () => {
    clearSession();
    router.push('/');
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex">
      <aside className="fixed left-0 top-0 bottom-0 w-60 bg-bg-secondary border-r border-white/10 flex flex-col z-40">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center font-bold text-sm">
              {user?.name?.[0] || 'A'}
            </div>
            <div>
              <p className="font-medium text-sm">{user?.name || 'User'}</p>
              <p className="text-gray-500 text-xs">{user?.company || 'HireAI'}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-4">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-6 py-3 text-sm transition-all ${
                  active
                    ? 'border-l-[3px] border-accent-blue bg-accent-blue/5 text-white'
                    : 'border-l-[3px] border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={logout}
          className="flex items-center gap-3 px-6 py-4 text-sm text-gray-400 hover:text-red-400 border-t border-white/10 transition-colors"
        >
          <LogOut size={16} />
          Logout
        </button>
      </aside>

      <main className="flex-1 ml-60">
        <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-xl border-b border-white/10 px-8 py-4 flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold">{title}</h1>
          <Link href="/create" className="gradient-btn px-4 py-2 rounded-lg text-sm font-medium text-white">
            + New Interview
          </Link>
        </header>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
