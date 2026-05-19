// Typed API client for Omega
import type { ApiResponse } from '@omega/shared';

interface RequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

interface ApiClientConfig {
  baseUrl: string;
  defaultHeaders?: Record<string, string>;
}

const DEFAULT_TIMEOUT = 30_000; // 30 seconds
const DEFAULT_RETRIES = 0;

class ApiClientError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

function buildUrl(
  baseUrl: string,
  path: string,
  params?: Record<string, string>,
): string {
  const url = new URL(path, baseUrl);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  return url.toString();
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function createApiClient(config: ApiClientConfig) {
  async function request<T>(
    method: string,
    path: string,
    body?: unknown,
    config_?: RequestConfig,
  ): Promise<T> {
    const {
      headers = {},
      params,
      timeout = DEFAULT_TIMEOUT,
      retries = DEFAULT_RETRIES,
    } = config_ || {};

    const url = buildUrl(config.baseUrl, path, params);

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...config.defaultHeaders,
      ...headers,
    };

  // Add auth token from localStorage if available
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const token = window.localStorage.getItem('omega-auth-token');
      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
      }
    } catch {
      // localStorage not available
    }
  }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetchWithTimeout(
          url,
          {
            method,
            headers: requestHeaders,
            body: body ? JSON.stringify(body) : undefined,
          },
          timeout,
        );

        const data = (await response.json()) as ApiResponse<T>;

        if (!response.ok) {
          throw new ApiClientError(
            response.status,
            data.error?.code || 'UNKNOWN_ERROR',
            data.error?.message || `Request failed with status ${response.status}`,
            data.error?.details,
          );
        }

        return data.data as T;
      } catch (error) {
        lastError = error as Error;

        if (error instanceof ApiClientError) {
          throw error; // Don't retry client errors
        }

        // Don't retry if it's the last attempt
        if (attempt === retries) {
          break;
        }

        // Wait before retrying (exponential backoff)
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 200),
        );
      }
    }

    throw lastError || new Error('Request failed');
  }

  return {
    get: <T>(path: string, config?: RequestConfig) =>
      request<T>('GET', path, undefined, config),

    post: <T>(path: string, body?: unknown, config?: RequestConfig) =>
      request<T>('POST', path, body, config),

    put: <T>(path: string, body?: unknown, config?: RequestConfig) =>
      request<T>('PUT', path, body, config),

    patch: <T>(path: string, body?: unknown, config?: RequestConfig) =>
      request<T>('PATCH', path, body, config),

    delete: <T>(path: string, config?: RequestConfig) =>
      request<T>('DELETE', path, undefined, config),
  };
}

// Default API client instance
export const api = createApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
});

export { ApiClientError };
