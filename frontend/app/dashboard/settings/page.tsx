'use client';

import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { getUser } from '@/lib/auth';
import { useEffect, useState } from 'react';

export default function SettingsPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const user = getUser();
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setCompany(user.company || '');
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const user = getUser();
    if (user) {
      localStorage.setItem('user', JSON.stringify({ ...user, name, email, company }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <DashboardLayout title="Settings">
      <form onSubmit={handleSave} className="max-w-lg space-y-5">
        <div>
          <label className="text-sm text-gray-400 block mb-2">Full Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-accent-blue focus:outline-none"
          />
        </div>
        <div>
          <label className="text-sm text-gray-400 block mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-accent-blue focus:outline-none"
          />
        </div>
        <div>
          <label className="text-sm text-gray-400 block mb-2">Company</label>
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-accent-blue focus:outline-none"
          />
        </div>
        <button type="submit" className="px-6 py-3 rounded-lg gradient-btn text-white font-medium">
          {saved ? 'Saved ✓' : 'Save Changes'}
        </button>
      </form>
    </DashboardLayout>
  );
}
