'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Play, Pause, Loader2 } from 'lucide-react';
import { api, videoFullUrl } from '@/lib/api';
import type { AiSession, InterviewQuestion } from '@/lib/api';

function CircularProgress({ value, color, label }: { value: number; color: string; label: string }) {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <div className="flex flex-col items-center">
      <svg width="100" height="100" className="-rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="6" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <span className="font-display text-xl font-bold -mt-14 relative z-10">{value}%</span>
      <span className="text-xs text-gray-500 mt-4">{label}</span>
    </div>
  );
}

function recommendationLabel(rec?: string) {
  if (rec === 'recommend') return '✅ Recommend for Next Round';
  if (rec === 'review') return '📋 Review Required';
  if (rec === 'reject') return '❌ Not Recommended';
  return '📋 Pending Review';
}

export default function SessionReviewPage() {
  const params = useParams();
  const sessionId = String(params.sessionId || '');
  const videoRef = useRef<HTMLVideoElement>(null);

  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [candidateName, setCandidateName] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [answers, setAnswers] = useState<AiSession['answers']>([]);
  const [scores, setScores] = useState([
    { label: 'Communication', value: 0, color: '#00d4ff' },
    { label: 'Technical', value: 0, color: '#7c3aed' },
    { label: 'Confidence', value: 0, color: '#00ff88' },
    { label: 'Overall', value: 0, color: '#00d4ff' },
  ]);
  const [flags, setFlags] = useState<Array<{ label: string; time: string; severity: string }>>([]);
  const [suspiciousActivityCount, setSuspiciousActivityCount] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const { session, interview } = await api.getRecruiterSession(sessionId);
        setCandidateName(session.candidateName || 'Candidate');
        setVideoUrl(videoFullUrl(session.videoUrl));
        setStatus(session.status);
        setRecommendation(session.scores?.recommendation || '');
        setQuestions(interview.questions || []);
        setAnswers(session.answers || []);
        setSuspiciousActivityCount(session.suspiciousActivityCount || 0);

        if (session.scores) {
          setScores([
            { label: 'Communication', value: session.scores.communication ?? 0, color: '#00d4ff' },
            { label: 'Technical', value: session.scores.technical ?? 0, color: '#7c3aed' },
            { label: 'Confidence', value: session.scores.confidence ?? 0, color: '#00ff88' },
            { label: 'Overall', value: session.scores.overall ?? 0, color: '#00d4ff' },
          ]);
        }

        setFlags(
          (session.proctoringEvents || []).map((e) => ({
            label: e.type.replace(/_/g, ' '),
            time: new Date(e.timestamp).toLocaleTimeString(),
            severity: e.severity,
          }))
        );
      } catch {
        /* empty state */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sessionId]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Review">
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-accent-blue" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`Review — ${candidateName}`}>
      {status === 'processing' && (
        <p className="text-xs text-yellow-500/80 mb-4">Scoring in progress — refresh in a moment.</p>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-black rounded-xl overflow-hidden aspect-video border border-white/10 relative">
            {videoUrl ? (
              <>
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="w-full h-full object-contain"
                  controls
                  playsInline
                  onPlay={() => setPlaying(true)}
                  onPause={() => setPlaying(false)}
                />
                <button
                  onClick={togglePlay}
                  className="absolute bottom-4 left-4 w-10 h-10 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80"
                >
                  {playing ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                </button>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 p-6 text-center">
                <p>No video uploaded for this session yet.</p>
                <p className="text-xs text-gray-600 mt-2">Video saves when the candidate submits their interview.</p>
              </div>
            )}
          </div>

          <div className="mt-4 glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display font-semibold">AI Scorecard</h3>
              {recommendation && (
                <span className="px-3 py-1 rounded-full text-xs bg-green-500/20 text-green-400">
                  {recommendationLabel(recommendation)}
                </span>
              )}
            </div>
            <div className="flex justify-around flex-wrap gap-4">
              {scores.map((s) => (
                <CircularProgress key={s.label} {...s} />
              ))}
            </div>
          </div>

          <div className="mt-4 glass rounded-xl p-6">
            <h3 className="font-display font-semibold mb-4">Question answers</h3>
            {(!answers || answers.length === 0) ? (
              <p className="text-sm text-gray-500">No answers recorded yet.</p>
            ) : (
              <div className="space-y-4">
                {answers.map((a, i) => {
                  const q = questions[a.questionIndex];
                  return (
                    <div key={i} className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex justify-between items-start gap-4 mb-2">
                        <p className="text-sm font-medium">
                          Q{a.questionIndex + 1}: {q?.text || `Question ${a.questionIndex + 1}`}
                          {a.isFollowup && <span className="text-orange-400 ml-2 text-xs">(Follow-up)</span>}
                        </p>
                        {a.score != null && (
                          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-accent-blue/20 text-accent-blue shrink-0">
                            {a.score}%
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        {a.transcript || 'No transcript captured'}
                      </p>
                      {q?.keywords?.length ? (
                        <p className="text-[10px] text-gray-600 mt-2">
                          Keywords: {q.keywords.join(', ')}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {suspiciousActivityCount > 0 && (
            <div className="glass rounded-xl p-4 border border-orange-500/30 bg-orange-500/10">
              <h3 className="font-display font-semibold text-sm text-orange-300 mb-1">Suspicious Activity</h3>
              <p className="text-2xl font-bold text-orange-400">{suspiciousActivityCount}</p>
              <p className="text-xs text-gray-500 mt-1">Recorded in video &amp; proctoring log</p>
            </div>
          )}

          <div className="glass rounded-xl p-4">
            <h3 className="font-display font-semibold text-sm mb-4">Proctoring flags</h3>
            {flags.length === 0 ? (
              <p className="text-xs text-gray-600">No flags recorded</p>
            ) : (
              <ul className="space-y-2">
                {flags.map((f, i) => (
                  <li
                    key={i}
                    className={`text-xs p-2 rounded-lg border ${
                      f.severity === 'high'
                        ? 'bg-red-500/10 text-red-300 border-red-500/20'
                        : 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20'
                    }`}
                  >
                    {f.label} <span className="text-gray-600">· {f.time}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Link href="/dashboard/candidates" className="text-xs text-accent-blue hover:underline inline-block">
            ← All candidates
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
