import { createContext, useState, useCallback, useEffect, useRef } from 'react';
import {
  adminLogin as loginApi,
  adminLogout as logoutApi,
  getCurrentAdmin,
} from '../services/adminApi';

export const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [email, setEmail] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // True while auth state is being established or re-established — on
  // first load (checking the httpOnly session cookie) AND during login.
  // ProtectedRoute must not render children while this is true, or a
  // protected page can mount and fire API calls before auth is settled.
  const [loading, setLoading] = useState(true);

  // Bumped on every login()/logout() so a slow, now-stale mount-time /me
  // check can't land afterwards and silently overwrite fresher auth state
  // (e.g. a background check started before login, resolving after it).
  const authVersionRef = useRef(0);

  useEffect(() => {
    let isMounted = true;
    const versionAtStart = authVersionRef.current;

    getCurrentAdmin()
      .then((res) => {
        if (!isMounted || authVersionRef.current !== versionAtStart) return;
        setEmail(res.data.email);
        setIsAuthenticated(true);
      })
      .catch(() => {
        if (!isMounted || authVersionRef.current !== versionAtStart) return;
        setEmail(null);
        setIsAuthenticated(false);
      })
      .finally(() => {
        if (isMounted && authVersionRef.current === versionAtStart) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (loginEmail, password) => {
    // Invalidate any in-flight session check and re-open the loading gate
    // for the duration of this login, so ProtectedRoute holds off rendering
    // protected children until the new auth state is fully committed.
    authVersionRef.current += 1;
    setLoading(true);

    try {
      const data = await loginApi(loginEmail, password);
      setEmail(data.data.email);
      setIsAuthenticated(true);
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    // Invalidate any in-flight check so it can't re-authenticate us after
    // an intentional logout. Clear local state immediately so the UI
    // reacts without waiting on the network; the server-side cookie clear
    // happens in the background.
    authVersionRef.current += 1;
    setEmail(null);
    setIsAuthenticated(false);

    logoutApi().catch(() => {
      // Already logged out from the client's perspective; nothing further
      // to do if the network call itself fails.
    });
  }, []);

  return (
    <AdminAuthContext.Provider value={{ email, isAuthenticated, loading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}