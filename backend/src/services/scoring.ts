type Question = {
  text?: string;
  category?: string;
  difficulty?: string;
  keywords?: string[];
};

type Answer = {
  questionIndex: number;
  transcript?: string;
  score?: number;
  duration?: number;
  isFollowup?: boolean;
};

type ProctorEvent = {
  type?: string;
  severity?: string;
};

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Technical: ['system', 'design', 'architecture', 'scale', 'api', 'database', 'debug', 'performance', 'code'],
  Behavioral: ['team', 'challenge', 'learned', 'feedback', 'conflict', 'communication', 'example', 'situation'],
  Leadership: ['lead', 'priority', 'decision', 'stakeholder', 'mentor', 'delegate', 'goal', 'impact'],
  Culture: ['values', 'growth', 'company', 'mission', 'collaborate', 'passion', 'role', 'fit'],
  Custom: ['experience', 'project', 'solution', 'approach', 'result', 'skill'],
};

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'to', 'of', 'in', 'on', 'for', 'with', 'your', 'you', 'this', 'that', 'is', 'are',
  'was', 'were', 'be', 'about', 'us', 'our', 'how', 'what', 'when', 'where', 'why', 'do', 'does', 'did', 'can',
]);

export function defaultKeywords(question: Question): string[] {
  if (question.keywords?.length) return question.keywords.map((k) => k.toLowerCase().trim()).filter(Boolean);

  const fromCategory = CATEGORY_KEYWORDS[question.category || ''] || CATEGORY_KEYWORDS.Custom;
  const fromText = (question.text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 4 && !STOP_WORDS.has(w))
    .slice(0, 4);

  return [...new Set([...fromCategory.slice(0, 5), ...fromText])].slice(0, 8);
}

function keywordScore(transcript: string, keywords: string[]): number {
  if (!keywords.length) return 55;
  const text = transcript.toLowerCase();
  if (!text.trim()) return 15;

  const matched = keywords.filter((k) => text.includes(k));
  const ratio = matched.length / keywords.length;
  const base = Math.round(ratio * 100);
  const lengthBonus = Math.min(15, Math.floor(text.split(/\s+/).length / 8));
  return Math.min(100, base + lengthBonus);
}

function communicationScore(answers: Answer[]): number {
  const transcripts = answers.map((a) => (a.transcript || '').trim()).filter(Boolean);
  if (!transcripts.length) return 40;
  const avgWords = transcripts.reduce((s, t) => s + t.split(/\s+/).length, 0) / transcripts.length;
  if (avgWords < 15) return 45;
  if (avgWords < 40) return 65;
  if (avgWords < 80) return 78;
  return 88;
}

function confidenceScore(answers: Answer[], proctoringEvents: ProctorEvent[], suspiciousCount = 0): number {
  const durations = answers.map((a) => a.duration || 0).filter((d) => d > 0);
  const avgDuration = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
  let score = avgDuration >= 20 ? 75 : avgDuration >= 10 ? 62 : 48;

  const highFlags = proctoringEvents.filter((e) => e.severity === 'high').length;
  const mediumFlags = proctoringEvents.filter((e) => e.severity === 'medium').length;
  score -= highFlags * 8;
  score -= mediumFlags * 3;
  score -= suspiciousCount * 12;
  return Math.max(15, Math.min(95, score));
}

export function scoreSessionAnswers(
  questions: Question[],
  answers: Answer[],
  proctoringEvents: ProctorEvent[] = [],
  suspiciousActivityCount = 0
) {
  const scoredAnswers = answers.map((answer) => {
    const q = questions[answer.questionIndex];
    const keywords = q ? defaultKeywords(q) : defaultKeywords({ category: 'Custom' });
    const score = keywordScore(answer.transcript || '', keywords);
    return { ...answer, score, matchedKeywords: keywords };
  });

  const technicalScores = scoredAnswers.filter((a) => !a.isFollowup).map((a) => a.score ?? 0);
  const technical = technicalScores.length
    ? Math.round(technicalScores.reduce((a, b) => a + b, 0) / technicalScores.length)
    : 0;

  const communication = communicationScore(scoredAnswers);
  const confidence = confidenceScore(scoredAnswers, proctoringEvents, suspiciousActivityCount);
  let overall = Math.round(technical * 0.45 + communication * 0.3 + confidence * 0.25);
  if (suspiciousActivityCount > 0) overall = Math.max(0, overall - suspiciousActivityCount * 10);

  const recommendation =
    suspiciousActivityCount > 0 ? 'review' : overall >= 70 ? 'recommend' : overall >= 55 ? 'review' : 'reject';

  return {
    answers: scoredAnswers.map(({ matchedKeywords: _, ...rest }) => rest),
    scores: {
      communication,
      technical,
      confidence,
      overall,
      recommendation,
    },
  };
}

export async function finalizeSessionScoring(session: {
  answers?: Answer[];
  proctoringEvents?: ProctorEvent[];
  scores?: Record<string, unknown>;
  status: string;
  suspiciousActivityCount?: number;
  save: () => Promise<unknown>;
}, interview: { questions?: Question[] } | null) {
  const result = scoreSessionAnswers(
    interview?.questions || [],
    session.answers || [],
    session.proctoringEvents || [],
    session.suspiciousActivityCount || 0
  );

  session.answers = result.answers;
  session.scores = result.scores;
  session.status = 'completed';
  await session.save();
  return result;
}
