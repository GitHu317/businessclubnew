import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    const token = localStorage.getItem('bc_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const data = await api.me();
      setUser(data.user);
    } catch {
      localStorage.removeItem('bc_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  const login = async (email, password) => {
    const data = await api.login({ email, password });
    localStorage.setItem('bc_token', data.token);
    setUser(data.user);
    return data.user;
  };

  const signup = async (body) => {
    const data = await api.signup(body);
    localStorage.setItem('bc_token', data.token);
    setUser(data.user);
    return data.user;
  };

  const googleAuth = async (idToken) => {
    const data = await api.googleAuth(idToken);
    localStorage.setItem('bc_token', data.token);
    setUser(data.user);
    return { user: data.user, isNewUser: data.isNewUser };
  };

  const completeOnboarding = async (body) => {
    const data = await api.onboarding(body);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('bc_token');
    setUser(null);
  };

  const refresh = async () => {
    await loadMe();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, googleAuth, completeOnboarding, logout, refresh, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
