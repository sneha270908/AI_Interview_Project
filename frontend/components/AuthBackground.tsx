'use client';

/** Lightweight CSS background for auth pages — avoids WebGL crashes */
export function AuthBackground({ quote }: { quote?: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#0a0a12]">
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 30% 40%, rgba(45,212,191,0.18) 0%, transparent 55%),
            radial-gradient(ellipse 60% 45% at 70% 60%, rgba(167,139,250,0.15) 0%, transparent 50%),
            radial-gradient(ellipse 40% 30% at 50% 80%, rgba(251,191,36,0.08) 0%, transparent 45%)
          `,
        }}
      />
      <div
        className="absolute w-[420px] h-[420px] rounded-full blur-[100px] animate-pulse"
        style={{
          background: 'rgba(45,212,191,0.12)',
          top: '20%',
          left: '15%',
          animationDuration: '4s',
        }}
      />
      <div
        className="absolute w-[360px] h-[360px] rounded-full blur-[90px] animate-pulse"
        style={{
          background: 'rgba(167,139,250,0.1)',
          bottom: '15%',
          right: '10%',
          animationDuration: '5s',
          animationDelay: '1s',
        }}
      />

      {/* Grid */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(45,212,191,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(45,212,191,0.5) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      {quote && (
        <div className="absolute inset-0 flex items-center justify-center px-10 pointer-events-none">
          <p className="font-display text-3xl md:text-5xl font-bold text-center max-w-lg leading-tight text-white/70 drop-shadow-[0_0_40px_rgba(45,212,191,0.2)]">
            {quote}
          </p>
        </div>
      )}
    </div>
  );
}
