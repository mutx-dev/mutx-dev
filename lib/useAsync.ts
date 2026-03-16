"use client";

import { useState, useCallback } from "react";

interface UseAsyncOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

interface UseAsyncReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  execute: () => Promise<void>;
  reset: () => void;
}

export function useAsync<T>(
  asyncFn: () => Promise<T>,
  options: UseAsyncOptions<T> = {}
): UseAsyncReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await asyncFn();
      setData(result);
      options.onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("An error occurred");
      setError(error);
      options.onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [asyncFn, options]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { data, isLoading, error, execute, reset };
}
