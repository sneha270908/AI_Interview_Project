import { getToken } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000/ws';
export const UPLOADS_URL = `${API_URL}/uploads`;

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function isApiError(err: unknown): err is ApiError {
  return (
    err instanceof ApiError ||
    (!!err && typeof err === 'object' && 'status' in err && typeof (err as ApiError).status === 'number')
  );
}

async function parseJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export async function apiRequest<T = unknown>(
  path: string,
  options: RequestInit = {},
  auth = true
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError(
      0,
      'Cannot reach server. Run: cd backend && npm run dev (port 4000 must be up)'
    );
  }
  const data = await parseJson(res);

  if (!res.ok) {
    throw new ApiError(res.status, data.error || data.message || 'Request failed');
  }

  return data as T;
}

export type InterviewQuestion = {
  text: string;
  category: string;
  difficulty: string;
  order: number;
  keywords?: string[];
};

export type InterviewRecord = {
  _id: string;
  title?: string;
  jobDescription?: string;
  questions: InterviewQuestion[];
  persona?: string;
  timeLimitPerQuestion?: number;
  proctoring?: Record<string, boolean>;
  status?: string;
  inviteToken?: string;
  invitedEmails?: string[];
  createdAt?: string;
};

export type AiSession = {
  _id: string;
  interviewId: string;
  candidateName?: string;
  candidateEmail?: string;
  status: string;
  videoUrl?: string | null;
  interviewTitle?: string;
  suspiciousActivityCount?: number;
  scores?: {
    communication?: number;
    technical?: number;
    confidence?: number;
    overall?: number;
    recommendation?: string;
  };
  proctoringEvents?: Array<{
    type: string;
    timestamp: number;
    severity: string;
    details?: unknown;
  }>;
  answers?: Array<{ questionIndex: number; transcript?: string; score?: number; duration?: number; isFollowup?: boolean }>;
};

export type CandidateAssignment = {
  interviewId: string;
  title?: string;
  questionCount: number;
  sessionStatus: string;
  sessionId: string | null;
};

export const api = {
  health: () => apiRequest<{ status: string }>('/health', {}, false),

  login: (email: string, password: string) =>
    apiRequest<{ token: string; user: unknown }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }, false),

  signup: (body: { name: string; email: string; company: string; password: string; role?: string }) =>
    apiRequest<{ token: string; user: unknown }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(body),
    }, false),

  getMe: () => apiRequest<{ user: unknown }>('/api/auth/me'),

  listInterviews: () => apiRequest<{ interviews: InterviewRecord[] }>('/api/interviews'),

  listRecruiterSessions: () => apiRequest<{ sessions: AiSession[] }>('/api/interviews/recruiter/sessions'),

  getRecruiterSession: (sessionId: string) =>
    apiRequest<{ session: AiSession; interview: InterviewRecord }>(`/api/interviews/recruiter/sessions/${sessionId}`),

  getInterview: (id: string) => apiRequest<{ interview: InterviewRecord }>(`/api/interviews/${id}`),

  createInterview: (body: Record<string, unknown>) =>
    apiRequest<{ interview: InterviewRecord }>('/api/interviews', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  generateQuestions: (jobDescription: string) =>
    apiRequest<{ questions: InterviewQuestion[] }>('/api/interviews/generate-questions', {
      method: 'POST',
      body: JSON.stringify({ jobDescription }),
    }),

  listSessions: (interviewId: string) =>
    apiRequest<{ sessions: AiSession[] }>(`/api/interviews/${interviewId}/sessions`),

  getCandidateAssignments: () =>
    apiRequest<{ assignments: CandidateAssignment[] }>('/api/candidate/assignments'),

  getPublicInterview: (identifier: string) =>
    apiRequest<{ interview: { id: string; title?: string; questions: InterviewQuestion[]; timeLimitPerQuestion?: number; proctoring?: Record<string, boolean> } }>(
      `/api/public/interviews/${identifier}`,
      {},
      false
    ),

  startSession: (identifier: string, body: { candidateName?: string; candidateEmail?: string }) =>
    apiRequest<{ session: { id: string; interviewId: string; status: string } }>(
      `/api/public/interviews/${identifier}/sessions`,
      { method: 'POST', body: JSON.stringify(body) },
      false
    ),

  updateSession: (sessionId: string, body: Record<string, unknown>) =>
    apiRequest<{ session: { id: string; status: string } }>(
      `/api/public/sessions/${sessionId}`,
      { method: 'PATCH', body: JSON.stringify(body) },
      false
    ),

  getSession: (sessionId: string) =>
    apiRequest<{ session: AiSession & { id: string; chunkCount?: number; videoUrl?: string } }>(
      `/api/public/sessions/${sessionId}`,
      {},
      false
    ),

  uploadSessionVideo: async (sessionId: string, blob: Blob) => {
    const form = new FormData();
    form.append('video', blob, 'recording.webm');
    return apiRequest<{ videoUrl: string; size: number }>(
      `/api/public/sessions/${sessionId}/video`,
      { method: 'POST', body: form },
      false
    );
  },

  reportProctoringEvent: (sessionId: string, body: { eventType: string; timestamp: number; severity: string; details?: unknown }) =>
    apiRequest<{ ok: boolean }>(
      `/api/public/sessions/${sessionId}/proctoring`,
      { method: 'POST', body: JSON.stringify(body) },
      false
    ),
};

export function videoFullUrl(videoUrl?: string | null) {
  if (!videoUrl) return null;
  if (videoUrl.startsWith('http')) return videoUrl;
  return `${API_URL}${videoUrl}`;
}
