
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

const SITE_NAME = 'Designed By Huzaifa';
const SITE_LOGO = '/assets/logo.png?v=2';

// Keep website name and favicon fixed.
function updateBrowserIdentity() {
  document.title = `${SITE_NAME} | Graphic Designer`;

  let favicon = document.getElementById('site-favicon');

  if (!favicon) {
    favicon = document.createElement('link');
    favicon.id = 'site-favicon';
    favicon.rel = 'icon';
    document.head.appendChild(favicon);
  }

  // Remove other favicon references that may override this one.
  document
    .querySelectorAll('link[rel~="icon"]:not(#site-favicon)')
    .forEach((icon) => icon.remove());

  favicon.rel = 'icon';
  favicon.type = 'image/png';
  favicon.href = SITE_LOGO;
}

// Loads public portfolio content.
// Website identity is not taken from the API.
export function SiteProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setError('');

    try {
      const data = await publicApi.profile();

      setProfile(data);
    } catch (err) {
      setError(err.message || 'Could not load the portfolio content.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    updateBrowserIdentity();
    refresh();
  }, [refresh]);

  useEffect(() => {
    updateBrowserIdentity();
  }, []);

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
