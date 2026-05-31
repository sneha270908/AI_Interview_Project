'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ProctoringPanel } from '@/components/interview/ProctoringPanel';
import { AIAvatar } from '@/components/interview/AIAvatar';
import { useCamera } from '@/hooks/useCamera';
import { useProctoring } from '@/hooks/useProctoring';
import { useInterviewWebSocket } from '@/hooks/useInterviewWebSocket';
import { useSpeechInterview } from '@/hooks/useSpeechInterview';
import { api } from '@/lib/api';
import type { InterviewQuestion } from '@/lib/api';
import { getCandidateInfo, setCandidateInfo } from '@/lib/candidate-session';
import { getUser } from '@/lib/auth';

type Phase = 'loading' | 'welcome' | 'hardware' | 'interview' | 'reviewing' | 'followup' | 'complete' | 'error';

const FALLBACK_QUESTIONS: InterviewQuestion[] = [
  { text: 'Tell us about yourself and why you are interested in this role.', category: 'Culture', difficulty: 'Easy', order: 0, keywords: ['experience', 'role', 'skills', 'passion', 'team'] },
  { text: 'Describe a challenging technical problem you solved recently.', category: 'Technical', difficulty: 'Medium', order: 1, keywords: ['problem', 'solution', 'debug', 'technical', 'result'] },
  { text: 'How do you handle disagreements with team members?', category: 'Behavioral', difficulty: 'Medium', order: 2, keywords: ['team', 'communication', 'conflict', 'listen', 'resolve'] },
  { text: 'What is your approach to learning new technologies?', category: 'Behavioral', difficulty: 'Easy', order: 3, keywords: ['learn', 'technology', 'practice', 'curious', 'growth'] },
  { text: 'Where do you see yourself in 3 years?', category: 'Culture', difficulty: 'Easy', order: 4, keywords: ['goal', 'growth', 'career', 'skills', 'impact'] },
  { text: 'Do you have any questions for us?', category: 'Culture', difficulty: 'Easy', order: 5, keywords: ['question', 'team', 'role', 'culture', 'learn'] },
];

const FOLLOWUP =
  'You mentioned solving a challenging problem — can you walk us through the trade-offs you considered?';

export default function InterviewPage() {
  const params = useParams();
  const interviewKey = String(params.id || 'demo');

  const [phase, setPhase] = useState<Phase>('loading');
  const [loadError, setLoadError] = useState('');
  const [questions, setQuestions] = useState<InterviewQuestion[]>(FALLBACK_QUESTIONS);
  const [interviewTitle, setInterviewTitle] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [checks, setChecks] = useState({ camera: false, mic: false, internet: false, browser: false });
  const [questionIndex, setQuestionIndex] = useState(0);
  const [recording, setRecording] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isFollowup, setIsFollowup] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(true);
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'offline'>('offline');
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [welcomeName, setWelcomeName] = useState('');
  const [welcomeEmail, setWelcomeEmail] = useState('');
  const [violationModalOpen, setViolationModalOpen] = useState(false);
  const [suspiciousActivityCount, setSuspiciousActivityCount] = useState(0);
  const [exitReason, setExitReason] = useState('');
  const [proctoringSettings, setProctoringSettings] = useState({
    face: true,
    tab: true,
    voice: true,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recorderActiveRef = useRef(false);
  const chunkSeqRef = useRef(0);
  const recordBlobsRef = useRef<Blob[]>([]);
  const answersRef = useRef<Array<{ questionIndex: number; duration: number; transcript?: string; isFollowup?: boolean }>>([]);

  const { startCamera, attachToVideo, error: cameraError, ready: cameraReady, getStream } = useCamera(videoRef);
  const { sendChunk, sendProctoringEvent, connect } = useInterviewWebSocket(sessionId);

  const isInterviewPhase = phase === 'interview' || phase === 'followup';
  const recordingFlowActive =
    phase === 'interview' || phase === 'followup' || phase === 'reviewing';

  const onProctorFlag = useCallback(
    (type: string, severity: string) => {
      if (!sessionId || sessionId.startsWith('local-')) return;
      const payload = {
        eventType: type,
        timestamp: Date.now(),
        severity,
        details: { questionIndex },
      };
      sendProctoringEvent(payload);
      api.reportProctoringEvent(sessionId, payload).catch(() => {});
    },
    [sessionId, sendProctoringEvent, questionIndex]
  );

  const proctoringActive =
    cameraReady && (phase === 'hardware' || isInterviewPhase || (recording && phase === 'reviewing'));

  const proctoring = useProctoring(
    videoRef,
    proctoringActive,
    onProctorFlag,
    {
      manualBlock: violationModalOpen,
      enableFace: proctoringSettings.face,
      enableTab: proctoringSettings.tab,
      getStream,
    }
  );
  const currentQuestionText = phase === 'followup' ? FOLLOWUP : questions[questionIndex]?.text || questions[0]?.text || '';
  const speech = useSpeechInterview(isInterviewPhase, currentQuestionText);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    async function load() {
      try {
        const { interview } = await api.getPublicInterview(interviewKey);
        if (interview.questions?.length) {
          setQuestions(interview.questions);
        }
        setInterviewTitle(interview.title || '');
        if (interview.proctoring) {
          setProctoringSettings({
            face: interview.proctoring.face !== false,
            tab: interview.proctoring.tab !== false,
            voice: interview.proctoring.voice !== false,
          });
        }
        const saved = getCandidateInfo();
        const loggedIn = getUser();
        if (saved?.name) {
          setCandidateName(saved.name);
          setCandidateEmail(saved.email || '');
          setWelcomeName(saved.name);
          setWelcomeEmail(saved.email || '');
          setPhase('hardware');
        } else if (loggedIn?.name) {
          setCandidateName(loggedIn.name);
          setCandidateEmail(loggedIn.email || '');
          setWelcomeName(loggedIn.name);
          setWelcomeEmail(loggedIn.email || '');
          setPhase('hardware');
        } else {
          setPhase('welcome');
        }
      } catch {
        setQuestions(FALLBACK_QUESTIONS);
        const saved = getCandidateInfo();
        if (saved?.name) {
          setCandidateName(saved.name);
          setCandidateEmail(saved.email || '');
          setPhase('hardware');
        } else {
          setPhase('welcome');
        }
        if (interviewKey !== 'demo') {
          setLoadError('Using default questions — interview not found on server.');
        }
      }
    }
    load();
  }, [mounted, interviewKey]);

  useEffect(() => {
    if (!sessionId) return;
    connect();
    const t = setInterval(() => {
      setWsStatus(document.hidden ? 'offline' : 'connected');
    }, 2000);
    setWsStatus('connecting');
    return () => clearInterval(t);
  }, [sessionId, connect]);

  useEffect(() => {
    if (!isInterviewPhase || recording) return;
    setAiSpeaking(true);
    const t = setTimeout(() => setAiSpeaking(false), Math.max(3500, currentQuestionText.length * 50));
    return () => clearTimeout(t);
  }, [questionIndex, isFollowup, isInterviewPhase, recording, currentQuestionText]);

  const violationLabel = (reason: string | null) => {
    if (reason === 'face_absent') return 'Face not visible';
    if (reason === 'tab_switch') return 'Tab switch detected';
    return 'Suspicious activity detected';
  };

  const persistSuspiciousActivity = useCallback(
    async (count: number, reason: string | null) => {
      if (!sessionId || sessionId.startsWith('local-')) return;
      const payload = {
        eventType: 'suspicious_activity',
        timestamp: Date.now(),
        severity: 'high',
        details: { count, reason, questionIndex },
      };
      sendProctoringEvent(payload);
      api.reportProctoringEvent(sessionId, payload).catch(() => {});
      try {
        await api.updateSession(sessionId, { suspiciousActivityCount: count });
      } catch {
        /* optional */
      }
    },
    [sessionId, sendProctoringEvent, questionIndex]
  );

  useEffect(() => {
    if (!recording || violationModalOpen) return;
    if (!proctoring.blocked || !proctoring.blockReason) return;
    if (proctoring.blockReason === 'face_absent') return;

    setSuspiciousActivityCount((prev) => {
      const next = prev + 1;
      persistSuspiciousActivity(next, proctoring.blockReason);
      return next;
    });
    setViolationModalOpen(true);
  }, [
    proctoring.blocked,
    proctoring.blockReason,
    recording,
    violationModalOpen,
    persistSuspiciousActivity,
  ]);

  useEffect(() => {
    if (!mounted || phase !== 'hardware') return;
    startCamera().then((stream) => {
      if (stream) setTimeout(() => setChecks((c) => ({ ...c, camera: true })), 400);
      setTimeout(() => setChecks((c) => ({ ...c, mic: true })), 900);
      api.health()
        .then(() => setChecks((c) => ({ ...c, internet: true })))
        .catch(() => setChecks((c) => ({ ...c, internet: true })));
      setTimeout(() => setChecks((c) => ({ ...c, browser: true })), 1400);
    });
  }, [mounted, phase, startCamera]);

  useEffect(() => {
    if (phase !== 'hardware' || !previewRef.current) return;
    const stream = getStream();
    if (stream) {
      previewRef.current.srcObject = stream;
      previewRef.current.muted = true;
      previewRef.current.playsInline = true;
      previewRef.current.play().catch(() => {});
    }
  }, [phase, cameraReady, checks.camera, getStream]);

  useEffect(() => {
    if (isInterviewPhase) attachToVideo();
  }, [isInterviewPhase, questionIndex, isFollowup, attachToVideo]);

  useEffect(() => {
    if (!recording) return;
    const interval = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [recording]);

  useEffect(() => {
    if (!recording || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const interval = setInterval(() => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < 24; i++) {
        const h = Math.random() * canvas.height * 0.8 + 4;
        ctx.fillStyle = '#2dd4bf';
        ctx.fillRect(i * (canvas.width / 24), (canvas.height - h) / 2, canvas.width / 24 - 2, h);
      }
    }, 120);
    return () => clearInterval(interval);
  }, [recording]);

  const uploadRecording = useCallback(async () => {
    if (!sessionId || sessionId.startsWith('local-') || recordBlobsRef.current.length === 0) return;
    try {
      const blob = new Blob(recordBlobsRef.current, { type: 'video/webm' });
      await api.uploadSessionVideo(sessionId, blob);
    } catch {
      /* upload optional */
    }
  }, [sessionId]);

  const finalizeRecording = useCallback(async () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    recorderRef.current = null;
    recorderActiveRef.current = false;
    setRecording(false);
    await new Promise((r) => setTimeout(r, 300));
    await uploadRecording();
  }, [uploadRecording]);

  const beginInterview = async () => {
    await attachToVideo();
    try {
      const { session } = await api.startSession(interviewKey, {
        candidateName: candidateName || 'Candidate',
        candidateEmail: candidateEmail || '',
      });
      setSessionId(session.id);
      setPhase('interview');
    } catch {
      setSessionId(`local-${Date.now()}`);
      setPhase('interview');
      setLoadError('Session saved locally — backend unavailable for recording upload.');
    }
    requestAnimationFrame(() => attachToVideo());
  };

  const ensureSessionRecording = useCallback(async () => {
    if (recorderRef.current?.state === 'recording') {
      setRecording(true);
      return;
    }
    if (recorderActiveRef.current) return;

    const stream = getStream();
    if (!stream) {
      await startCamera();
    }
    await attachToVideo();

    const activeStream = getStream();
    if (!activeStream) return;

    recorderActiveRef.current = true;
    setRecording(true);
    speech.startListening();

    try {
      const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
        ? 'video/webm;codecs=vp8,opus'
        : 'video/webm';
      const recorder = new MediaRecorder(activeStream, { mimeType: mime, videoBitsPerSecond: 500_000 });
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordBlobsRef.current.push(e.data);
          if (sessionId && !sessionId.startsWith('local-')) {
            const seq = chunkSeqRef.current++;
            setTimeout(() => sendChunk({ sequence: seq, byteSize: e.data.size }), 0);
          }
        }
      };

      recorder.start(2000);
    } catch {
      /* recording UI still works without MediaRecorder */
    }

    requestAnimationFrame(() => attachToVideo());
  }, [getStream, startCamera, attachToVideo, sessionId, sendChunk, speech]);

  useEffect(() => {
    if ((phase === 'interview' || phase === 'followup') && cameraReady && !recorderActiveRef.current) {
      ensureSessionRecording();
    }
  }, [phase, cameraReady, ensureSessionRecording]);

  const fireConfetti = async () => {
    try {
      const confetti = (await import('canvas-confetti')).default;
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
    } catch {
      /* optional */
    }
  };

  const handleExitInterview = async () => {
    speech.stopListening();
    setExitReason(violationLabel(proctoring.blockReason));
    setViolationModalOpen(false);

    await finalizeRecording();

    if (sessionId && !sessionId.startsWith('local-')) {
      try {
        await api.updateSession(sessionId, {
          status: 'processing',
          answers: answersRef.current,
          suspiciousActivityCount,
        });
      } catch {
        /* optional */
      }
    }
    setPhase('complete');
  };

  const handleSkipToNextQuestion = useCallback(async () => {
    const reason = proctoring.blockReason;
    speech.stopListening();
    setViolationModalOpen(false);
    proctoring.resetBlock();

    if (sessionId && !sessionId.startsWith('local-')) {
      api.reportProctoringEvent(sessionId, {
        eventType: 'violation_skip_question',
        timestamp: Date.now(),
        severity: 'high',
        details: { reason, questionIndex, suspiciousActivityCount },
      }).catch(() => {});
    }

    answersRef.current.push({
      questionIndex,
      duration: timer,
      transcript: `[Question skipped — ${violationLabel(reason)} detected]`,
      isFollowup,
    });

    if (sessionId && !sessionId.startsWith('local-')) {
      try {
        await api.updateSession(sessionId, {
          currentQuestion: questionIndex,
          answers: answersRef.current,
          suspiciousActivityCount,
        });
      } catch {
        /* optional */
      }
    }

    if (isFollowup || questionIndex >= questions.length - 1) {
      if (sessionId && !sessionId.startsWith('local-')) {
        try {
          await api.updateSession(sessionId, {
            status: 'processing',
            answers: answersRef.current,
            suspiciousActivityCount,
          });
        } catch {
          /* optional */
        }
      }
      await finalizeRecording();
      setPhase('complete');
      return;
    }

    setQuestionIndex((i) => i + 1);
    setIsFollowup(false);
    setTimer(0);
    setPhase('interview');
    speech.startListening();
    requestAnimationFrame(() => attachToVideo());
  }, [
    proctoring,
    speech,
    sessionId,
    questionIndex,
    timer,
    isFollowup,
    suspiciousActivityCount,
    questions.length,
    finalizeRecording,
    attachToVideo,
  ]);

  useEffect(() => {
    if (!violationModalOpen) return;
    const t = setTimeout(() => handleSkipToNextQuestion(), 3500);
    return () => clearTimeout(t);
  }, [violationModalOpen, handleSkipToNextQuestion]);

  const stopAndSubmit = async () => {
    if (violationModalOpen) return;

    setPhase('reviewing');

    const transcript = speech.stopListening();

    answersRef.current.push({
      questionIndex,
      duration: timer,
      transcript: transcript || `[Answer recorded — ${timer}s, no speech detected]`,
      isFollowup,
    });

    if (sessionId && !sessionId.startsWith('local-')) {
      try {
        await api.updateSession(sessionId, {
          currentQuestion: questionIndex,
          answers: answersRef.current,
        });
      } catch {
        /* continue flow */
      }
    }

    setTimeout(async () => {
      if (!isFollowup && questionIndex === 1) {
        setIsFollowup(true);
        setPhase('followup');
        setTimer(0);
        speech.startListening();
        requestAnimationFrame(() => attachToVideo());
      } else if (questionIndex < questions.length - 1) {
        setQuestionIndex((i) => i + 1);
        setIsFollowup(false);
        setPhase('interview');
        setTimer(0);
        speech.startListening();
        requestAnimationFrame(() => attachToVideo());
      } else {
        if (sessionId && !sessionId.startsWith('local-')) {
          try {
            await api.updateSession(sessionId, {
              status: 'processing',
              answers: answersRef.current,
              suspiciousActivityCount,
            });
          } catch {
            /* optional */
          }
        }
        await finalizeRecording();
        setPhase('complete');
        fireConfetti();
      }
    }, 2000);
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const currentQuestion = currentQuestionText;
  const allChecksPass = Object.values(checks).every(Boolean) && !cameraError;

  const handleWelcomeContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!welcomeName.trim()) return;
    setCandidateInfo({ name: welcomeName.trim(), email: welcomeEmail.trim() });
    setCandidateName(welcomeName.trim());
    setCandidateEmail(welcomeEmail.trim());
    setPhase('hardware');
  };

  if (!mounted || phase === 'loading') {
    return (
      <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#2dd4bf] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (phase === 'welcome') {
    return (
      <div className="min-h-screen bg-[#0a0a12] flex flex-col">
        <header className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
          <Link href="/" className="font-display font-bold text-lg">HIREAI</Link>
          <span className="text-xs text-gray-500">{interviewTitle || 'Video Interview'}</span>
        </header>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full glass rounded-2xl p-8">
            <p className="text-xs text-accent-purple mb-2 uppercase tracking-wider">No login required</p>
            <h1 className="font-display text-2xl font-bold mb-2">Welcome, candidate</h1>
            <p className="text-gray-500 text-sm mb-6">
              Enter your name to begin{interviewTitle ? ` the ${interviewTitle} interview` : ''}. Your recruiter does not need you to create an account.
            </p>
            {loadError && <p className="text-yellow-500/80 text-xs mb-4">{loadError}</p>}
            <form onSubmit={handleWelcomeContinue} className="space-y-4">
              <input
                type="text"
                placeholder="Full name"
                value={welcomeName}
                onChange={(e) => setWelcomeName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-accent-blue"
              />
              <input
                type="email"
                placeholder="Email (optional)"
                value={welcomeEmail}
                onChange={(e) => setWelcomeEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-accent-blue"
              />
              <button type="submit" className="w-full py-3 rounded-xl gradient-btn text-white font-semibold">
                Continue to setup →
              </button>
            </form>
            <p className="text-xs text-gray-600 mt-6 text-center">
              Wrong link?{' '}
              <Link href="/join" className="text-accent-blue hover:underline">
                Enter invite code
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'hardware') {
    return (
      <div className="min-h-screen bg-[#0a0a12] flex flex-col">
        <header className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
          <Link href="/" className="font-display font-bold text-lg">HIREAI</Link>
          <span className="text-xs text-gray-500">
            {candidateName ? `Hi, ${candidateName.split(' ')[0]}` : interviewTitle || 'Hardware Check'}
          </span>
        </header>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-lg w-full">
            <h1 className="font-display text-3xl font-bold text-center mb-2">Hardware Check</h1>
            <p className="text-gray-500 text-center mb-6">Camera must work for proctoring</p>
            {loadError && <p className="text-yellow-500/80 text-xs text-center mb-4">{loadError}</p>}

            {cameraError && (
              <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
                {cameraError}
                <button type="button" onClick={() => startCamera()} className="block mt-2 text-accent-blue underline">
                  Retry camera
                </button>
              </div>
            )}

            <div className="space-y-4 mb-6">
              {[
                { key: 'camera' as const, label: 'Camera', detail: cameraReady ? 'Live feed OK' : 'Waiting...' },
                { key: 'mic' as const, label: 'Microphone', detail: 'Audio levels normal' },
                { key: 'internet' as const, label: 'Internet', detail: 'Connection OK' },
                { key: 'browser' as const, label: 'Browser', detail: 'Compatible' },
              ].map(({ key, label, detail }) => (
                <div
                  key={key}
                  className={`glass rounded-xl p-4 flex items-center gap-4 ${checks[key] ? 'border border-green-500/30' : ''}`}
                >
                  <span className={checks[key] ? 'text-green-400' : 'text-gray-600'}>{checks[key] ? '✓' : '○'}</span>
                  <div className="flex-1">
                    <p className="font-medium">{label}</p>
                    {checks[key] && <p className="text-xs text-gray-500">{detail}</p>}
                  </div>
                  {key === 'camera' && checks[key] && (
                    <video ref={previewRef} autoPlay muted playsInline className="w-20 h-14 rounded object-cover bg-black border border-[#2dd4bf]/30" />
                  )}
                </div>
              ))}
            </div>

            {allChecksPass && (
              <button type="button" onClick={beginInterview} className="w-full py-4 rounded-xl gradient-btn text-white font-semibold">
                Begin Interview →
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'complete') {
    return (
      <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center p-6 text-center">
        <div>
          <h1 className="font-display text-4xl font-bold mb-4">
            {exitReason ? 'Interview Ended' : 'Interview Complete!'}
          </h1>
          {exitReason && (
            <p className="text-red-400 mb-2">{exitReason}</p>
          )}
          {suspiciousActivityCount > 0 && (
            <p className="text-orange-400 mb-4 font-medium">
              {suspiciousActivityCount} suspicious {suspiciousActivityCount === 1 ? 'activity' : 'activities'} recorded in your video
            </p>
          )}
          <p className="text-gray-400 mb-2">{proctoring.flags.length} proctoring events logged</p>
          {sessionId && !sessionId.startsWith('local-') && (
            <p className="text-xs text-gray-600 mb-4 font-mono">Session: {sessionId.slice(-8)}</p>
          )}
          <Link href="/" className="px-6 py-3 rounded-lg gradient-btn text-white inline-block">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a12] flex flex-col">
      <header className="px-4 lg:px-6 py-3 border-b border-white/10 flex items-center justify-between gap-4">
        <Link href="/" className="font-display font-bold text-sm lg:text-base shrink-0">HIREAI</Link>
        <span className="text-xs lg:text-sm text-gray-400 text-center">
          Question {questionIndex + 1} of {questions.length}
          {isFollowup && <span className="text-orange-400 ml-1">(Follow-up)</span>}
        </span>
        <span className="font-mono text-sm shrink-0">{formatTime(timer)}</span>
      </header>

      <div className="flex-1 p-4 lg:p-6 max-w-7xl mx-auto w-full">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">

          {/* AI Avatar column */}
          <div className="flex flex-col items-center lg:w-48 shrink-0 pt-2">
            <AIAvatar speaking={aiSpeaking} />
            {sessionId && (
              <p className="text-[10px] text-gray-600 mt-1">
                {sessionId.startsWith('local-') ? 'Offline mode' : wsStatus === 'connected' ? '● Live' : '○ Syncing'}
              </p>
            )}
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className={`glass rounded-2xl p-4 lg:p-6 mb-4 ${isFollowup ? 'border border-orange-500/40 bg-orange-500/5' : ''}`}>
              <p className="text-xs text-accent-blue mb-2 uppercase tracking-wider">
                {aiSpeaking ? '🔊 AI is asking…' : 'Your question'}
              </p>
              <p className="text-base lg:text-lg leading-relaxed">{currentQuestion}</p>
            </div>

            <div
              className={`rounded-2xl overflow-hidden aspect-video bg-black relative ${
                recording ? 'border-2 border-red-500/60 shadow-[0_0_30px_rgba(239,68,68,0.2)]' : 'border border-[#2dd4bf]/40'
              }`}
            >
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                onLoadedMetadata={() => { attachToVideo(); }}
                onCanPlay={() => { attachToVideo(); }}
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />

              {!cameraReady && !cameraError && !getStream()?.getVideoTracks()[0] && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-gray-400 text-sm">
                  Starting camera...
                </div>
              )}

              {cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-6 text-center">
                  <p className="text-red-300 text-sm mb-3">{cameraError}</p>
                  <button type="button" onClick={() => startCamera()} className="px-4 py-2 rounded-lg gradient-btn text-white text-sm">
                    Enable Camera
                  </button>
                </div>
              )}

              {proctoring.blocked && proctoring.blockReason === 'tab_switch' && !violationModalOpen && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10 p-6 text-center">
                  <p className="text-red-300 font-semibold mb-2">Checking proctoring…</p>
                </div>
              )}

              {recording && suspiciousActivityCount > 0 && (
                <div className="absolute top-3 right-3 bg-orange-500/90 text-black text-xs font-semibold px-2 py-1 rounded-full z-10">
                  {suspiciousActivityCount} suspicious {suspiciousActivityCount === 1 ? 'activity' : 'activities'}
                </div>
              )}

              {!recording && isInterviewPhase && cameraReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
                  <p className="text-gray-300 text-sm">Starting continuous recording…</p>
                </div>
              )}

              {recording && (
                <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/70 px-2 py-1 rounded-full z-10">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs text-red-400 font-mono">REC — full interview</span>
                </div>
              )}
            </div>
          </div>

          <ProctoringPanel
            faceDetected={proctoring.faceDetected}
            cameraActive={proctoring.cameraActive}
            tabFocused={proctoring.tabFocused}
            blocked={proctoring.blocked}
            suspiciousCount={suspiciousActivityCount || proctoring.suspiciousCount}
            flags={proctoring.flags}
            riskScore={proctoring.riskScore}
          />
        </div>
      </div>

      {violationModalOpen && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-6">
          <div className="max-w-md w-full glass rounded-2xl p-8 border border-red-500/40 text-center">
            <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4 text-2xl">
              ⚠️
            </div>
            <h2 className="font-display text-xl font-bold text-red-300 mb-2">Suspicious Activity Detected</h2>
            <p className="text-gray-400 text-sm mb-1">{violationLabel(proctoring.blockReason)}</p>
            <p className="text-orange-400 font-semibold mb-6">
              {suspiciousActivityCount} suspicious {suspiciousActivityCount === 1 ? 'activity' : 'activities'} — saved in your recording
            </p>
            <p className="text-xs text-gray-500 mb-6">
              Recording continues. You will go to the <strong className="text-white">next question</strong> — not back to Question 1.
            </p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleSkipToNextQuestion}
                className="w-full py-3 rounded-xl gradient-btn text-white font-semibold"
              >
                Next Question →
              </button>
              <button
                type="button"
                onClick={handleExitInterview}
                className="w-full py-3 rounded-xl bg-red-500/20 border border-red-500/50 text-red-300 font-semibold hover:bg-red-500/30"
              >
                Exit Interview
              </button>
            </div>
          </div>
        </div>
      )}

      {phase === 'reviewing' && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-[#2dd4bf] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-300">AI is reviewing your answer...</p>
          </div>
        </div>
      )}

      {recording && recordingFlowActive && (
        <footer className="px-4 lg:px-6 py-4 border-t border-white/10 bg-[#0a0a12]/95">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <canvas ref={canvasRef} width={200} height={32} className="hidden sm:block" />
              <span className="text-xs text-gray-500">
                {proctoring.faceDetected
                  ? 'Face OK · recording'
                  : '⚠ Face not detected · still recording'}
              </span>
            </div>
            <button
              type="button"
              onClick={stopAndSubmit}
              disabled={violationModalOpen}
              className="px-6 py-2 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-sm hover:bg-red-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Stop & Submit Answer
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}