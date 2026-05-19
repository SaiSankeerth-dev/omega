const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new ApiError(
      res.status,
      data.code ?? 'UNKNOWN',
      data.error ?? data.message ?? 'Request failed',
    );
  }

  return data.data as T;
}

export const api = {
  get: <T>(endpoint: string, token?: string) =>
    request<T>(endpoint, { method: 'GET' }, token),

  post: <T>(endpoint: string, body: unknown, token?: string) =>
    request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }, token),

  put: <T>(endpoint: string, body: unknown, token?: string) =>
    request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }, token),

  patch: <T>(endpoint: string, body: unknown, token?: string) =>
    request<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body) }, token),

  delete: <T>(endpoint: string, token?: string) =>
    request<T>(endpoint, { method: 'DELETE' }, token),
};

export { ApiError };
