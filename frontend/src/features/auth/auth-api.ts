import { apiRequest } from '../../lib/api';
import type { AuthUser } from './auth-store';

export interface LoginResult {
  accessToken: string;
  expiresIn: number;
  user: AuthUser;
}

export function login(email: string, password: string): Promise<LoginResult> {
  return apiRequest<LoginResult>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function logout(): Promise<void> {
  return apiRequest<void>('/auth/logout', { method: 'POST' });
}

export function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  return apiRequest<void>('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export interface ManagedUser extends AuthUser {
  companies: Array<{ id: string; name: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface SaveUserInput {
  name?: string;
  email?: string;
  password?: string;
  role?: 'user' | 'master';
  avatarUrl?: string | null;
  isActive?: boolean;
  companyIds?: string[];
  specialtyIds?: string[];
}

export interface Specialty {
  id: string;
  name: string;
}

export const authKeys = {
  users: ['users'] as const,
  specialties: ['specialties'] as const,
};

export function getUsers(): Promise<ManagedUser[]> {
  return apiRequest<ManagedUser[]>('/users');
}

export function createUser(
  input: SaveUserInput & { name: string; email: string; password: string },
): Promise<ManagedUser> {
  return apiRequest<ManagedUser>('/users', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateUser(
  id: string,
  input: Partial<SaveUserInput>,
): Promise<ManagedUser> {
  return apiRequest<ManagedUser>(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deactivateUser(id: string): Promise<void> {
  return apiRequest<void>(`/users/${id}`, { method: 'DELETE' });
}

export function resetUserPassword(
  id: string,
): Promise<{ password: string }> {
  return apiRequest<{ password: string }>(`/users/${id}/reset-password`, {
    method: 'POST',
  });
}

export function getSpecialties(): Promise<Specialty[]> {
  return apiRequest<Specialty[]>('/specialties');
}

export function saveSpecialty(
  input: { name: string },
  id?: string,
): Promise<Specialty> {
  return apiRequest<Specialty>(id ? `/specialties/${id}` : '/specialties', {
    method: id ? 'PATCH' : 'POST',
    body: JSON.stringify(input),
  });
}

export function deleteSpecialty(id: string): Promise<void> {
  return apiRequest<void>(`/specialties/${id}`, { method: 'DELETE' });
}
