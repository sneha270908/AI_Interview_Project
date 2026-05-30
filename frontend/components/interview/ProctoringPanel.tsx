'use client';

export type ProctorFlag = {
  id: string;
  type: 'face_absent' | 'tab_switch' | 'multiple_faces' | 'looking_away' | 'audio_anomaly';
  message: string;
  severity: 'low' | 'medium' | 'high';
  time: string;
};

interface ProctoringPanelProps {
  faceDetected: boolean;
  cameraActive: boolean;
  tabFocused: boolean;
  blocked?: boolean;
  suspiciousCount?: number;
  flags: ProctorFlag[];
  riskScore: number;
}

const checks = [
  { key: 'face', label: 'Face Detection', icon: '👁️' },
  { key: 'tab', label: 'Tab Focus', icon: '🔄' },
  { key: 'gaze', label: 'Attention', icon: '👀' },
  { key: 'audio', label: 'Voice Analysis', icon: '🎤' },
];

export function ProctoringPanel({
  faceDetected,
  cameraActive,
  tabFocused,
  blocked = false,
  suspiciousCount = 0,
  flags,
  riskScore,
}: ProctoringPanelProps) {
  const gazeOk = faceDetected && tabFocused;

  return (
    <aside className="w-full lg:w-72 flex-shrink-0 glass rounded-2xl p-4 h-fit lg:sticky lg:top-24">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-sm">Proctoring</h3>
        <span
          className={`text-xs font-mono px-2 py-0.5 rounded-full ${
            riskScore < 30
              ? 'bg-green-500/20 text-green-400'
              : riskScore < 60
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'bg-red-500/20 text-red-400'
          }`}
        >
          Risk {riskScore}%
        </span>
      </div>

      {suspiciousCount > 0 && (
        <div className="mb-3 p-2 rounded-lg bg-orange-500/20 border border-orange-500/40 text-orange-300 text-xs text-center font-semibold">
          {suspiciousCount} suspicious {suspiciousCount === 1 ? 'activity' : 'activities'}
        </div>
      )}

      {blocked && (
        <div className="mb-3 p-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 text-xs text-center">
          ⚠ Interview paused — return to this tab
        </div>
      )}

      <div className="space-y-2 mb-4">
        {checks.map((c) => {
          let ok = true;
          if (c.key === 'face') ok = faceDetected && cameraActive;
          if (c.key === 'tab') ok = tabFocused;
          if (c.key === 'gaze') ok = gazeOk;
          if (c.key === 'audio') ok = cameraActive;

          return (
            <div
              key={c.key}
              className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${
                ok ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
              }`}
            >
              <span>{c.icon}</span>
              <span className="flex-1">{c.label}</span>
              <span>{ok ? '✓' : '!'}</span>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Live flags</p>
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {flags.length === 0 ? (
          <p className="text-xs text-gray-600">No suspicious activity detected</p>
        ) : (
          flags.slice(-5).reverse().map((f) => (
            <div
              key={f.id}
              className={`text-xs p-2 rounded-lg border ${
                f.severity === 'high'
                  ? 'border-red-500/30 bg-red-500/10 text-red-300'
                  : f.severity === 'medium'
                    ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300'
                    : 'border-white/10 text-gray-400'
              }`}
            >
              <p>{f.message}</p>
              <p className="text-gray-600 mt-0.5">{f.time}</p>
            </div>
          ))
        )}
      </div>

      <p className="text-[10px] text-gray-600 mt-4 leading-relaxed">
        Uses your camera feed + tab focus to detect face absence, tab switches, and attention drops.
        Flags appear on the recruiter&apos;s review timeline.
      </p>
    </aside>
  );
}
