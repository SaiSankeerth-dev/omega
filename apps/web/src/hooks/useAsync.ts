'use client';

import { useState, useCallback } from 'react';

interface AsyncState<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
}

export function useAsync<T>() {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    error: null,
    isLoading: false,
  });

  const execute = useCallback(async (promise: Promise<T>) => {
    setState({ data: null, error: null, isLoading: true });
    try {
      const data = await promise;
      setState({ data, error: null, isLoading: false });
      return data;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong';
      setState({ data: null, error: message, isLoading: false });
      throw err;
    }
  }, []);

  return { ...state, execute };
}
