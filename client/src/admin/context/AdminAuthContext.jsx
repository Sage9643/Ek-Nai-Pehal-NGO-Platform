import { createContext, useState, useCallback } from 'react';
import { adminLogin as loginApi, TOKEN_KEY } from '../services/adminApi';

export const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY));
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!sessionStorage.getItem(TOKEN_KEY));

  const login = useCallback(async (email, password) => {
    const data = await loginApi(email, password);
    const newToken = data.data.token;

    sessionStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setIsAuthenticated(true);

    return data;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setIsAuthenticated(false);
  }, []);

  return (
    <AdminAuthContext.Provider value={{ token, isAuthenticated, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}
