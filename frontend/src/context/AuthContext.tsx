import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import axios from 'axios';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('expense_token');
    if (!savedToken) { setLoading(false); return; }

    setToken(savedToken);
    // Always fetch fresh user data from backend to pick up is_admin changes
    axios.get('/api/auth/me', { headers: { Authorization: `Bearer ${savedToken}` } })
      .then((res) => {
        const freshUser = res.data as User;
        setUser(freshUser);
        localStorage.setItem('expense_user', JSON.stringify(freshUser));
      })
      .catch(() => {
        localStorage.removeItem('expense_token');
        localStorage.removeItem('expense_user');
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('expense_token', newToken);
    localStorage.setItem('expense_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('expense_token');
    localStorage.removeItem('expense_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, isAuthenticated: !!token && !!user, isAdmin: !!user?.is_admin, loading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
