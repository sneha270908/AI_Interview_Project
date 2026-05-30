'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Sparkles, GripVertical, Plus, Trash2, Check, Loader2, Copy } from 'lucide-react';
import { api, ApiError } from '@/lib/api';

type Question = { id: string; text: string; category: string; difficulty: string; order: number };

const PERSONAS = [
  { id: 'friendly', emoji: '😊', label: 'Friendly', desc: 'Warm and encouraging tone' },
  { id: 'professional', emoji: '😐', label: 'Professional', desc: 'Balanced and formal' },
  { id: 'tough', emoji: '😤', label: 'Tough', desc: 'Challenging follow-ups' },
];

export default function CreateInterviewPage() {
  const [step, setStep] = useState(1);
  const [jobDesc, setJobDesc] = useState('');
  const [title, setTitle] = useState('');
  const [generating, setGenerating] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [persona, setPersona] = useState('professional');
  const [timeLimit, setTimeLimit] = useState(120);
  const [proctoring, setProctoring] = useState({ face: true, tab: true, voice: true, gaze: false, stress: true });
  const [inviteEmailsText, setInviteEmailsText] = useState('');
  const [launched, setLaunched] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [interviewId, setInterviewId] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const generateQuestions = async () => {
    setGenerating(true);
    setError('');
    try {
      const { questions: generated } = await api.generateQuestions(jobDesc);
      setQuestions(
        generated.map((q, i) => ({
          id: String(i + 1),
          text: q.text,
          category: q.category,
          difficulty: q.difficulty,
          order: q.order ?? i,
        }))
      );
      if (!title.trim()) {
        const firstLine = jobDesc.split('\n')[0].slice(0, 60);
        setTitle(firstLine || 'New Interview');
      }
      setStep(2);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to generate questions');
    } finally {
      setGenerating(false);
    }
  };

  const launchInterview = async () => {
    setLaunching(true);
    setError('');
    try {
      const invitedEmails = inviteEmailsText
        .split(/[\n,;]+/)
        .map((e) => e.trim().toLowerCase())
        .filter((e) => e.includes('@'));

      const { interview } = await api.createInterview({
        title: title || 'Untitled Interview',
        jobDescription: jobDesc,
        questions: questions.map((q, i) => ({
          text: q.text,
          category: q.category,
          difficulty: q.difficulty,
          order: i,
        })),
        persona,
        timeLimitPerQuestion: timeLimit,
        proctoring,
        invitedEmails,
      });
      const id = interview._id;
      const link = `${window.location.origin}/interview/${id}`;
      setInterviewId(id);
      setInviteLink(link);
      setLaunched(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to launch interview');
    } finally {
      setLaunching(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy link');
    }
  };

  const updateQuestion = (id: string, text: string) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, text } : q)));
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { id: Date.now().toString(), text: 'New question...', category: 'Custom', difficulty: 'Medium', order: questions.length },
    ]);
  };

  const steps = ['Job Details', 'Questions', 'Settings', 'Launch'];

  return (
    <DashboardLayout title="Create Interview">
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">{error}</div>
      )}

      <div className="flex gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-mono ${
                step > i + 1 ? 'bg-accent-green text-black' : step === i + 1 ? 'bg-accent-blue text-black' : 'bg-white/10 text-gray-500'
              }`}
            >
              {step > i + 1 ? <Check size={14} /> : i + 1}
            </div>
            <span className={`text-sm hidden sm:block ${step === i + 1 ? 'text-white' : 'text-gray-500'}`}>{s}</span>
            {i < steps.length - 1 && <div className="w-8 h-px bg-white/20 mx-2" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="max-w-2xl">
          <h2 className="font-display text-xl font-semibold mb-4">Paste Job Description</h2>
          <input
            type="text"
            placeholder="Interview title (optional — auto-generated from JD)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 mb-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-accent-blue"
          />
          <textarea
            value={jobDesc}
            onChange={(e) => setJobDesc(e.target.value)}
            placeholder="Paste the full job description here..."
            rows={12}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-accent-blue focus:shadow-[0_0_20px_rgba(0,212,255,0.15)] resize-none"
          />
          <button
            onClick={generateQuestions}
            disabled={!jobDesc.trim() || generating}
            className="mt-4 px-6 py-3 rounded-xl gradient-btn text-white font-medium flex items-center gap-2 disabled:opacity-50"
          >
            {generating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                AI is thinking<span className="animate-pulse">...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Generate Questions with AI
              </>
            )}
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="max-w-3xl space-y-4">
          {questions.map((q, i) => (
            <div key={q.id} className="glass rounded-xl p-4 flex gap-3 items-start">
              <GripVertical size={18} className="text-gray-600 mt-2 cursor-grab flex-shrink-0" />
              <div className="flex-1">
                <textarea
                  value={q.text}
                  onChange={(e) => updateQuestion(q.id, e.target.value)}
                  className="w-full bg-transparent text-white text-sm resize-none focus:outline-none"
                  rows={2}
                />
                <div className="flex gap-2 mt-2">
                  <span className="px-2 py-0.5 rounded-full text-xs bg-accent-blue/20 text-accent-blue">{q.category}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-accent-purple/20 text-accent-purple">{q.difficulty}</span>
                </div>
              </div>
              <button onClick={() => removeQuestion(q.id)} className="text-gray-600 hover:text-red-400 p-1">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <button onClick={addQuestion} className="flex items-center gap-2 text-sm text-gray-400 hover:text-accent-blue">
            <Plus size={16} /> Add question
          </button>
          <div className="flex gap-3 pt-4">
            <button onClick={() => setStep(1)} className="px-4 py-2 rounded-lg border border-white/20 text-sm">
              Back
            </button>
            <button onClick={() => setStep(3)} disabled={questions.length === 0} className="px-6 py-2 rounded-lg gradient-btn text-white text-sm disabled:opacity-50">
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="max-w-2xl space-y-8">
          <div>
            <h3 className="font-display font-semibold mb-4">AI Persona</h3>
            <div className="grid grid-cols-3 gap-4">
              {PERSONAS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPersona(p.id)}
                  className={`glass rounded-xl p-4 text-center transition-all ${
                    persona === p.id ? 'border-accent-blue shadow-[0_0_20px_rgba(0,212,255,0.3)]' : ''
                  }`}
                >
                  <span className="text-3xl block mb-2">{p.emoji}</span>
                  <p className="font-medium text-sm">{p.label}</p>
                  <p className="text-gray-500 text-xs mt-1">{p.desc}</p>
                  {persona === p.id && <Check size={16} className="text-accent-blue mx-auto mt-2" />}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-2">Time limit per question: {timeLimit}s</label>
            <input type="range" min={60} max={300} value={timeLimit} onChange={(e) => setTimeLimit(Number(e.target.value))} className="w-full accent-accent-blue" />
          </div>

          <div>
            <h3 className="font-display font-semibold mb-4">Proctoring</h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(proctoring).map(([key, val]) => (
                <label key={key} className="flex items-center justify-between glass rounded-lg px-4 py-3 cursor-pointer">
                  <span className="text-sm capitalize">{key} detection</span>
                  <input type="checkbox" checked={val} onChange={(e) => setProctoring({ ...proctoring, [key]: e.target.checked })} className="accent-accent-blue" />
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="px-4 py-2 rounded-lg border border-white/20 text-sm">
              Back
            </button>
            <button onClick={() => setStep(4)} className="px-6 py-2 rounded-lg gradient-btn text-white text-sm">
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="max-w-2xl">
          {!launched ? (
            <>
              <div className="glass rounded-xl p-6 mb-6">
                <h3 className="font-display font-semibold mb-4">Preview</h3>
                <div className="bg-black rounded-lg p-4 border border-white/10">
                  <p className="text-xs text-gray-500 mb-2">Candidate will see:</p>
                  <p className="text-sm">{questions[0]?.text}</p>
                  <div className="mt-4 h-32 rounded-lg bg-white/5 flex items-center justify-center text-gray-600 text-xs">Camera preview area</div>
                </div>
              </div>

              <div className="glass rounded-xl p-4 mb-4">
                <label className="text-sm text-gray-400 block mb-2">
                  Invite candidates by email <span className="text-gray-600">(optional)</span>
                </label>
                <textarea
                  placeholder={'candidate1@email.com\ncandidate2@email.com'}
                  value={inviteEmailsText}
                  onChange={(e) => setInviteEmailsText(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-accent-blue resize-none font-mono"
                />
                <p className="text-xs text-gray-600 mt-2">
                  Invited candidates can login at <strong>/candidate</strong> and see this interview. Link below works for anyone.
                </p>
              </div>

              <button
                onClick={launchInterview}
                disabled={launching || questions.length === 0}
                className="w-full py-4 rounded-xl gradient-btn text-white font-semibold text-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {launching ? <Loader2 size={20} className="animate-spin" /> : '🚀 Launch Interview'}
              </button>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="font-display text-2xl font-bold mb-2">Interview Launched!</h2>
              <p className="text-gray-400 mb-2">Share this link with candidates — no login needed:</p>
              <div className="glass rounded-xl p-4 mb-4 flex items-center gap-3 text-left">
                <input readOnly value={inviteLink} className="flex-1 bg-transparent text-sm text-gray-300 font-mono truncate" />
                <button onClick={copyLink} className="px-3 py-1.5 rounded-lg border border-white/20 text-xs hover:border-accent-blue flex items-center gap-1 shrink-0">
                  <Copy size={14} />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-xs text-gray-600 mb-4">
                Candidates open the link, enter their name, and start. Or send them to{' '}
                <Link href="/join" className="text-accent-blue hover:underline">/join</Link> with the code above.
              </p>
              <a href={`/interview/${interviewId}`} className="text-accent-blue text-sm hover:underline">
                Preview candidate experience →
              </a>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
