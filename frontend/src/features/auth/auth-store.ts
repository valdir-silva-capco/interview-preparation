import { create } from 'zustand';

export type UserRole = 'user' | 'master' | 'root';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string | null;
  isActive: boolean;
  companyIds: string[];
  specialties: Array<{ id: string; name: string }>;
}

interface StoredSession {
  accessToken: string;
  expiresAt: number;
  user: AuthUser;
}

interface AuthState {
  accessToken: string | null;
  expiresAt: number | null;
  user: AuthUser | null;
  setSession: (accessToken: string, expiresIn: number, user: AuthUser) => void;
  clearSession: () => void;
}

const SESSION_STORAGE_KEY = 'interview-preparation.auth-session';

function readSession(): StoredSession | null {
  try {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!stored) return null;
    const session = JSON.parse(stored) as StoredSession;
    if (
      typeof session.accessToken !== 'string' ||
      typeof session.expiresAt !== 'number' ||
      session.expiresAt <= Date.now() ||
      !session.user
    ) {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
    return session;
  } catch {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

const initialSession = readSession();

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: initialSession?.accessToken ?? null,
  expiresAt: initialSession?.expiresAt ?? null,
  user: initialSession?.user ?? null,
  setSession: (accessToken, expiresIn, user) => {
    const expiresAt = Date.now() + expiresIn * 1000;
    sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ accessToken, expiresAt, user }),
    );
    set({ accessToken, expiresAt, user });
  },
  clearSession: () => {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    set({ accessToken: null, expiresAt: null, user: null });
  },
}));
