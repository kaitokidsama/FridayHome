import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

export interface QueryState<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
  reload(): void;
}

/** Loads data whenever the screen gains focus or the loader changes. */
export function useFocusedQuery<T>(loader: () => Promise<T>): QueryState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const requestId = useRef(0);

  const run = useCallback(() => {
    const id = ++requestId.current;
    setLoading(true);
    loader()
      .then((result) => {
        if (id !== requestId.current) return;
        setData(result);
        setError(null);
      })
      .catch((caught: unknown) => {
        if (id !== requestId.current) return;
        setError(caught instanceof Error ? caught : new Error(String(caught)));
      })
      .finally(() => {
        if (id === requestId.current) setLoading(false);
      });
  }, [loader]);

  useFocusEffect(run);

  return { data, error, loading, reload: run };
}
