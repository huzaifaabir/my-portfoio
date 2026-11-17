import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { publicApi } from '../lib/services.js';

const SiteContext = createContext(null);

// Loads the public profile once and shares it. Admin edits call refresh() to update the site.
export function SiteProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setError('');
    try {
      setProfile(await publicApi.profile());
    } catch (err) {
      setError(err.message || 'Could not load the portfolio content.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(() => ({ profile, loading, error, refresh }), [profile, loading, error, refresh]);
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export const useSite = () => useContext(SiteContext);
