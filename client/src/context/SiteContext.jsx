
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { publicApi } from '../lib/services.js';

const SiteContext = createContext(null);

// Updates the browser tab title and favicon.
function updateBrowserIdentity(profile) {
  const siteName = profile?.siteName?.trim() || 'Huzaifa Abir';

  document.title = `${siteName} | Graphic Designer`;

  const favicon = document.getElementById('site-favicon');

  if (favicon) {
    const logoUrl = profile?.logo?.url?.trim();

    favicon.href = logoUrl || '/favicon.svg';
    favicon.type = logoUrl ? 'image/png' : 'image/svg+xml';
  }
}

// Loads the public profile once and shares it.
// Admin edits call refresh() to update the site.
export function SiteProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setError('');

    try {
      const data = await publicApi.profile();

      setProfile(data);
      updateBrowserIdentity(data);
    } catch (err) {
      setError(err.message || 'Could not load the portfolio content.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Keep browser identity synchronized with profile changes.
  useEffect(() => {
    if (profile) {
      updateBrowserIdentity(profile);
    }
  }, [profile]);

  const value = useMemo(
    () => ({
      profile,
      loading,
      error,
      refresh,
    }),
    [profile, loading, error, refresh]
  );

  return (
    <SiteContext.Provider value={value}>
      {children}
    </SiteContext.Provider>
  );
}

export const useSite = () => useContext(SiteContext);
