const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiEnvelope<T> {
  success?: boolean;
  data?: T;
  error?: { code?: string; message?: string } | string;
  message?: string;
  code?: string;
}

const parseResponse = async <T>(res: Response): Promise<T> => {
  const text = await res.text();
  const body = text ? (JSON.parse(text) as ApiEnvelope<T>) : {};

  if (!res.ok) {
    const error = body.error;
    const message =
      typeof error === 'string'
        ? error
        : error?.message ?? body.message ?? 'Request failed';
    const code = typeof error === 'object' ? error.code ?? body.code : body.code;
    throw new ApiError(res.status, code ?? 'UNKNOWN', message);
  }

  return body.data as T;
};

export async function request<T>(endpoint: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(options.headers as Record<string, string> | undefined),
  };

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return parseResponse<T>(res);
}

export const api = {
  get: <T>(endpoint: string, token?: string) =>
    request<T>(endpoint, { method: 'GET' }, token),

  post: <T>(endpoint: string, body?: unknown, token?: string) =>
    request<T>(endpoint, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }, token),

  put: <T>(endpoint: string, body: unknown, token?: string) =>
    request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }, token),

  patch: <T>(endpoint: string, body: unknown, token?: string) =>
    request<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body) }, token),

  delete: <T>(endpoint: string, token?: string) =>
    request<T>(endpoint, { method: 'DELETE' }, token),
};

// Re-export for backward compatibility
export const apiClient = api;
