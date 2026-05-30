'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthBackground } from '@/components/AuthBackground';
import { Navbar } from '@/components/Navbar';
import { Eye, EyeOff, Loader2, Check } from 'lucide-react';
import { setSession, type User } from '@/lib/auth';
import { api, ApiError } from '@/lib/api';

type Step = 'form' | 'role';

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('form');
  const [form, setForm] = useState({ name: '', email: '', company: '', password: '' });
  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'recruiter' | 'candidate' | null>(null);
  const [error, setError] = useState('');

  const handleFormContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) return;
    setError('');
    setStep('role');
  };

  const handleRoleSelect = async (role: 'recruiter' | 'candidate') => {
    setSelectedRole(role);
    setLoading(true);
    setError('');

    try {
      const data = await api.signup({ ...form, role });
      setSession(data.token, data.user as User);
      router.push(role === 'recruiter' ? '/dashboard' : '/candidate');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Cannot reach server. Is the backend running?');
      setSelectedRole(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] overflow-hidden">
      <Navbar />
      <div className="flex flex-col lg:flex-row min-h-screen pt-16">
        <div className="hidden lg:block lg:w-[58%] relative h-[calc(100vh-4rem)] overflow-hidden">
          <AuthBackground quote="Screen smarter. Hire faster." />
        </div>
        <div className="lg:hidden fixed inset-0 pt-16 -z-0 pointer-events-none">
          <AuthBackground />
        </div>
        <div className="relative z-20 flex-1 w-full lg:w-[42%] min-h-[calc(100vh-4rem)] overflow-y-auto bg-[#0a0a12]/90 lg:bg-[#0a0a12]/95 backdrop-blur-sm lg:border-l border-white/10">
          <div className="flex items-center justify-center min-h-full px-6 sm:px-10 py-10">
            <div className="w-full max-w-md">
              {step === 'form' ? (
                <>
                  <Link href="/" className="font-display font-bold text-xl flex items-center gap-0.5 mb-8">
                    HIREAI<span className="w-1.5 h-1.5 rounded-full bg-accent-blue inline-block" />
                  </Link>
                  <h1 className="font-display text-3xl font-bold mb-2">Create account</h1>
                  <p className="text-gray-500 mb-8">Choose recruiter or candidate in the next step</p>
                  <form onSubmit={handleFormContinue} className="space-y-4">
                    {(['name', 'email', 'company'] as const).map((field) => (
                      <input
                        key={field}
                        type={field === 'email' ? 'email' : 'text'}
                        placeholder={field === 'name' ? 'Full Name' : field === 'email' ? 'Email' : field === 'company' ? 'Company (optional for candidates)' : 'Company Name'}
                        value={form[field]}
                        onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                        required={field !== 'company'}
                        className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-accent-blue"
                      />
                    ))}
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        required
                        className="w-full px-4 py-3 pr-12 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-accent-blue"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <label className="flex items-center gap-3 text-sm text-gray-400 cursor-pointer">
                      <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                      I agree to the Terms of Service
                    </label>
                    <button type="submit" disabled={!agreed} className="w-full py-3 rounded-lg gradient-btn text-white font-medium">
                      Continue
                    </button>
                  </form>
                  <p className="text-center text-gray-500 text-sm mt-8">
                    Already have an account? <Link href="/login" className="text-accent-blue">Sign in</Link>
                  </p>
                </>
              ) : (
                <>
                  <h1 className="font-display text-3xl font-bold mb-2">I am a...</h1>
                  <p className="text-gray-500 mb-8">This sets up your account correctly</p>
                  {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
                  <div className="grid gap-4">
                    {[
                      { role: 'recruiter' as const, emoji: '💼', title: 'Recruiter', desc: 'Create interviews & review candidates' },
                      { role: 'candidate' as const, emoji: '🎯', title: 'Candidate', desc: 'See assigned interviews after login' },
                    ].map((r) => (
                      <button
                        key={r.role}
                        onClick={() => handleRoleSelect(r.role)}
                        disabled={loading}
                        className={`glass rounded-2xl p-6 text-left w-full transition-all hover:scale-[1.02] disabled:opacity-60 ${
                          selectedRole === r.role ? 'border-accent-blue shadow-[0_0_30px_rgba(45,212,191,0.3)]' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="text-3xl">{r.emoji}</span>
                            <div>
                              <p className="font-display font-semibold text-lg">{r.title}</p>
                              <p className="text-gray-500 text-sm">{r.desc}</p>
                            </div>
                          </div>
                          {loading && selectedRole === r.role ? (
                            <Loader2 className="animate-spin text-accent-blue" />
                          ) : selectedRole === r.role ? (
                            <Check className="text-accent-blue" />
                          ) : null}
                        </div>
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setStep('form')} className="mt-6 text-sm text-gray-500 hover:text-white">
                    ← Back
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
