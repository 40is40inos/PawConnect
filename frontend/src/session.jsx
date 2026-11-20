// Who is logged in, shared by the nav and every page so the session is
// fetched once instead of on each screen.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getMe, logout } from './api/auth';
import { errorMessage } from './api/client';

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  // undefined while loading, null when logged out, otherwise the profile.
  const [me, setMe] = useState(undefined);
  const [error, setError] = useState(null);

  useEffect(() => {
    getMe()
      .then(setMe)
      .catch((err) => {
        setError(errorMessage(err));
        setMe(null);
      });
  }, []);

  // `then` runs (e.g. a redirect) in the same update that clears the session,
  // so "/" never flashes the landing page on the way to /login.
  const signOut = useCallback(
    (then) =>
      logout()
        .catch(() => {})
        .then(() => {
          then?.();
          setMe(null);
        }),
    []
  );

  const value = useMemo(() => ({ me, setMe, signOut, error }), [me, signOut, error]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export const useSession = () => useContext(SessionContext);
