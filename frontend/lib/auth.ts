export type User = {
  id?: string;
  name: string;
  email: string;
  company?: string;
  role?: 'recruiter' | 'candidate' | 'admin';
};

export const DEMO_CREDENTIALS = {
  email: 'admin@test.com',
  password: 'password123',
};

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function getUser(): User | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function setSession(token: string, user: User) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
