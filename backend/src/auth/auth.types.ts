import type { UserRole } from '../users/user.entity.js';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string | null;
  isActive: boolean;
  companyIds: string[];
  specialties: Array<{ id: string; name: string }>;
  tokenVersion: number;
}

export interface TokenPayload {
  sub: string;
  ver: number;
  iat: number;
  exp: number;
}

declare module 'express' {
  interface Request {
    user?: AuthenticatedUser;
  }
}
