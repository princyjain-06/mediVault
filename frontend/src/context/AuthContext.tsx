import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

const TOKEN_KEY = 'mediVault_auth_token_v2';
const USER_KEY  = 'mediVault_user_v2';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored && stored.split('.').length === 3) return stored;
    localStorage.removeItem(TOKEN_KEY);
    return null;
  });

  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem(USER_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return null;
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }, [token]);

  const persist = (data: { token: string; userId: string; name: string; email: string; role: string }) => {
    const authUser: AuthUser = { id: data.userId, name: data.name, email: data.email, role: data.role };
    setToken(data.token);
    setUser(authUser);
    localStorage.setItem(USER_KEY, JSON.stringify(authUser));
  };

  const login = async (email: string, password: string): Promise<void> => {
    const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
    persist(res.data);
  };

  const signup = async (name: string, email: string, password: string): Promise<void> => {
    const res = await axios.post(`${API_BASE}/auth/signup`, { name, email, password });
    persist(res.data);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

