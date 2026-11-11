import { useAuthStore } from '../features/auth/auth-store';

const apiBaseUrl =
  import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const headers = new Headers(init?.headers);
  const accessToken = useAuthStore.getState().accessToken;
  if (accessToken) headers.set('authorization', `Bearer ${accessToken}`);
  if (init?.body !== undefined) {
    headers.set('content-type', 'application/json');
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401 && accessToken) {
      if (window.location.pathname !== '/login') {
        window.dispatchEvent(new Event('auth:expired'));
      }
    }
    const body = await response.text();
    let message = `Request failed (${response.status}).`;
    if (body) {
      try {
        const payload = JSON.parse(body) as {
          message?: string | string[];
        };
        if (payload.message) {
          message = Array.isArray(payload.message)
            ? payload.message.join(' ')
            : payload.message;
        }
      } catch {
        message = body;
      }
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}
