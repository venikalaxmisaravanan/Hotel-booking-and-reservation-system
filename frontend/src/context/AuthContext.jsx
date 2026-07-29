import { createContext, useContext, useEffect, useState } from "react";
import { authApi, getToken, setToken } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // Starts true so ProtectedRoute doesn't redirect to /login before we've
  // had a chance to check for an existing (sessionStorage) token.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      if (getToken()) {
        try {
          const data = await authApi.me();
          setUser(data.user);
        } catch {
          // Token expired/invalid -- clear it silently and fall through
          // to the logged-out state.
          setToken(null);
        }
      }
      setLoading(false);
    }
    restoreSession();
  }, []);

  async function login(username, password) {
    const data = await authApi.login(username, password);
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  }

  async function register(payload) {
    return authApi.register(payload);
  }

  async function logout() {
    try {
      await authApi.logout();
    } finally {
      setToken(null);
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth() must be used inside an <AuthProvider>.");
  return ctx;
}
