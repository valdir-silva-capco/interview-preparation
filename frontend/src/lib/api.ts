const apiBaseUrl =
  import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body !== undefined) {
    headers.set('content-type', 'application/json');
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
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
