'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthBackground } from '@/components/AuthBackground';
import { Navbar } from '@/components/Navbar';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { setSession, DEMO_CREDENTIALS } from '@/lib/auth';
import { api, isApiError } from '@/lib/api';
import type { User } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    if (!email) {
      setFieldErrors({ email: 'Email is required' });
      return;
    }
    if (!password) {
      setFieldErrors({ password: 'Password is required' });
      return;
    }

    setLoading(true);

    try {
      const data = await api.login(email, password);
      const user = data.user as User & { role?: string };
      setSession(data.token, user);
      router.push(user.role === 'candidate' ? '/candidate' : '/dashboard');
    } catch (err) {
      if (isApiError(err)) {
        if (err.status === 0) {
          setFieldErrors({ password: err.message });
        } else if (err.status === 401) {
          setFieldErrors({
            password: 'Invalid email or password. New candidate? Sign up first, or use recruiter demo below.',
          });
        } else {
          setFieldErrors({ password: err.message || 'Login failed' });
        }
      } else {
        setFieldErrors({
          password: `Cannot reach server. Start backend (port 4000): cd backend && npm run dev`,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] overflow-hidden">
      <Navbar />
      <div className="flex flex-col lg:flex-row min-h-screen pt-16">
        <div className="hidden lg:block lg:w-[58%] relative h-[calc(100vh-4rem)] overflow-hidden">
          <AuthBackground quote="The future of hiring is here." />
        </div>
        <div className="lg:hidden fixed inset-0 pt-16 -z-0 pointer-events-none">
          <AuthBackground />
        </div>
        <div className="relative z-20 flex-1 w-full lg:w-[42%] min-h-[calc(100vh-4rem)] overflow-y-auto bg-[#0a0a12]/90 lg:bg-[#0a0a12]/95 backdrop-blur-sm lg:border-l border-white/10">
          <div className="flex items-center justify-center min-h-full px-6 sm:px-10 py-10">
            <div className="w-full max-w-md">
              <Link href="/" className="font-display font-bold text-xl flex items-center gap-0.5 mb-8">
                HIREAI<span className="w-1.5 h-1.5 rounded-full bg-accent-blue inline-block" />
              </Link>
              <h1 className="font-display text-3xl font-bold mb-2">Welcome back</h1>
              <p className="text-gray-500 mb-2">Sign in to your dashboard</p>
              <p className="text-xs text-gray-600 mb-8">
                Recruiter demo: {DEMO_CREDENTIALS.email} / {DEMO_CREDENTIALS.password}
                <br />
                Candidate? <Link href="/signup" className="text-accent-blue hover:underline">Sign up</Link> or{' '}
                <Link href="/join" className="text-accent-blue hover:underline">use invite link</Link>
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg bg-white/5 border text-white placeholder-gray-600 focus:outline-none focus:border-accent-blue ${
                    fieldErrors.email ? 'border-red-500' : 'border-white/10'
                  }`}
                />
                {fieldErrors.email && <p className="text-red-500 text-xs">{fieldErrors.email}</p>}

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full px-4 py-3 pr-12 rounded-lg bg-white/5 border text-white placeholder-gray-600 focus:outline-none focus:border-accent-blue ${
                      fieldErrors.password ? 'border-red-500' : 'border-white/10'
                    }`}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {fieldErrors.password && <p className="text-red-500 text-xs">{fieldErrors.password}</p>}

                <button type="submit" disabled={loading} className="w-full py-3 rounded-lg gradient-btn text-white font-medium flex justify-center gap-2 disabled:opacity-70">
                  {loading ? <Loader2 size={20} className="animate-spin" /> : 'Sign In'}
                </button>
              </form>

              <p className="text-center text-gray-500 text-sm mt-8">
                Don&apos;t have an account? <Link href="/signup" className="text-accent-blue hover:underline">Get Started</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
