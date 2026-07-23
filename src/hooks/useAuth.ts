import { useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  id: number;
  familyId: number;
  name: string;
  email: string;
  role: 'STUDENT' | 'PARENT';
  isFirstLogin: boolean;
  mustChangePassword?: boolean;
  subscriptionExpiresAt?: string | null;
  iban?: string | null;
  branding?: { logoUrl: string | null; slogan: string | null; brandColor: string | null } | null;
}

axios.interceptors.request.use(cfg => {
  const token = localStorage.getItem('lgs_token');
  if (token && cfg.headers && !cfg.headers.Authorization) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('lgs_token');
    if (!token) { setLoading(false); return; }
    axios.get('/api/auth/me')
      .then(r => setUser(r.data))
      .catch(() => localStorage.removeItem('lgs_token'))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await axios.post('/api/auth/login', { email, password });
    localStorage.setItem('lgs_token', data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('lgs_token');
    setUser(null);
  };

  const refreshUser = async () => {
    const { data } = await axios.get('/api/auth/me', { headers: { 'Cache-Control': 'no-cache' } });
    setUser(data);
  };

  return { user, loading, login, logout, refreshUser };
}
