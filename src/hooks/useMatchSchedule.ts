import { useState, useEffect } from 'react';

export interface MatchScheduleResult<T> {
  schedule: T | null;
  /** True once the fetch has completed, even if no data was returned. */
  scheduleLoaded: boolean;
  error: Error | null;
}

/**
 * useMatchSchedule
 *
 * Fetches the match schedule for a given team and returns both the data and
 * a `scheduleLoaded` flag so callers can distinguish between
 * "still loading" and "loaded but no schedule released yet" (issue #200).
 *
 * @param fetchFn  - Async function that fetches the schedule data.
 * @param deps     - Dependency array (passed to useEffect).
 */
export function useMatchSchedule<T>(
  fetchFn: () => Promise<T | null>,
  deps: unknown[] = [],
): MatchScheduleResult<T> {
  const [schedule, setSchedule] = useState<T | null>(null);
  const [scheduleLoaded, setScheduleLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setScheduleLoaded(false);
    setError(null);

    fetchFn()
      .then((data) => {
        if (!cancelled) {
          setSchedule(data);
          setScheduleLoaded(true);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setScheduleLoaded(true); // stop spinner even on error
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { schedule, scheduleLoaded, error };
}
