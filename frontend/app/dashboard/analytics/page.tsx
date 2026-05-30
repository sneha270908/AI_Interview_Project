'use client';

import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

const metrics = [
  { label: 'Completion Rate', value: '94%', change: '+3%' },
  { label: 'Avg Interview Length', value: '18m', change: '-2m' },
  { label: 'Pass Rate', value: '62%', change: '+5%' },
  { label: 'Flags per Interview', value: '1.2', change: '-0.3' },
];

export default function AnalyticsPage() {
  return (
    <DashboardLayout title="Analytics">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metrics.map((m) => (
          <div key={m.label} className="glass rounded-xl p-6">
            <p className="text-gray-500 text-sm">{m.label}</p>
            <p className="font-display text-3xl font-bold text-accent-blue mt-2">{m.value}</p>
            <p className="text-green-400 text-xs mt-1">{m.change} vs last month</p>
          </div>
        ))}
      </div>
      <div className="glass rounded-xl p-8 h-64 flex items-center justify-center text-gray-500">
        Chart visualization — connect your analytics provider in production
      </div>
    </DashboardLayout>
  );
}
