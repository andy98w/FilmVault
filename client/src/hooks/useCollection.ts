import { useEffect, useState } from 'react';
import axiosInstance from '../api/config';

/** One page in memory; history stores only opaque cursors. */
export function useCollection(path: string, sort: string, direction: string, q: string) {
  const criteria = JSON.stringify([path, sort, direction, q.trim()]);
  const [position, setPosition] = useState({ criteria, cursors: [''], page: 0 });
  const active = position.criteria === criteria ? position : { criteria, cursors: [''], page: 0 };
  const cursor = active.cursors[active.page];
  const [result, setResult] = useState<{ movies: any[]; nextCursor: string | null; user?: any; requestKey?: string; path?: string }>({ movies: [], nextCursor: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const requestKey = JSON.stringify([criteria, cursor, revision]);
  const pending = loading || result.requestKey !== requestKey;
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    // Debounce typing, and abort obsolete requests when criteria or page changes.
    const timer = window.setTimeout(() => {
      axiosInstance.get(path, { params: { sort, direction, q: q.trim(), cursor, limit: 15 }, signal: controller.signal })
        .then(response => { if (!controller.signal.aborted) setResult({ ...response.data, requestKey, path }); })
        .catch(() => { if (!controller.signal.aborted) { setError('Could not load this collection. Please try again.'); setResult(previous => ({ movies: [], nextCursor: null, user: previous.path === path ? previous.user : undefined, requestKey, path })); } })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 180);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [path, sort, direction, q, cursor, revision, requestKey]);
  return {
    movies: result.requestKey === requestKey ? result.movies : [],
    user: result.path === path ? result.user : undefined,
    nextCursor: result.requestKey === requestKey ? result.nextCursor : null,
    loading: pending, error, page: active.page + 1,
    previous: () => setPosition({ ...active, page: Math.max(0, active.page - 1) }),
    next: () => { if (result.nextCursor && !pending) setPosition({ criteria, cursors: [...active.cursors.slice(0, active.page + 1), result.nextCursor], page: active.page + 1 }); },
    reload: () => { setPosition({ criteria, cursors: [''], page: 0 }); setRevision(value => value + 1); },
  };
}
