const STORAGE_KEY = 'hireai_candidate';

export type CandidateInfo = {
  name: string;
  email: string;
};

export function getCandidateInfo(): CandidateInfo | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CandidateInfo;
  } catch {
    return null;
  }
}

export function setCandidateInfo(info: CandidateInfo) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(info));
}

export function clearCandidateInfo() {
  sessionStorage.removeItem(STORAGE_KEY);
}

/** Extract interview id or token from pasted link or raw code */
export function parseInviteInput(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';

  try {
    if (trimmed.includes('://') || trimmed.startsWith('/')) {
      const url = trimmed.startsWith('/')
        ? new URL(trimmed, window.location.origin)
        : new URL(trimmed);
      const parts = url.pathname.split('/').filter(Boolean);
      const interviewIdx = parts.indexOf('interview');
      if (interviewIdx >= 0 && parts[interviewIdx + 1]) {
        return parts[interviewIdx + 1];
      }
      const joinIdx = parts.indexOf('join');
      if (joinIdx >= 0 && parts[joinIdx + 1]) {
        return parts[joinIdx + 1];
      }
    }
  } catch {
    /* fall through */
  }

  return trimmed.replace(/^\/+|\/+$/g, '');
}
