import { useCallback, useEffect, useState } from 'react';

// Loads data with loading / error / retry handling.
// Usage: const { data, loading, error, reload } = useAsync(() => api.call(), [dep])
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: '' }));
    fn()
      .then((data) => alive && setState({ data, loading: false, error: '' }))
      .catch((err) => alive && setState({ data: null, loading: false, error: err.message || 'Could not load data.' }));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const setData = useCallback((updater) => setState((s) => ({
    ...s,
    data: typeof updater === 'function' ? updater(s.data) : updater,
  })), []);

  return { ...state, reload, setData };
}
