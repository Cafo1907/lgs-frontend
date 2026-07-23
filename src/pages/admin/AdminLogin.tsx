import { useState } from 'react';
import axios from 'axios';

interface Props { onLogin: () => void }

export default function AdminLogin({ onLogin }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(''); setLoading(true);
    try {
      const { data } = await axios.post('/api/admin/login', { email, password });
      localStorage.setItem('superAdminToken', data.token);
      localStorage.setItem('superAdminInfo', JSON.stringify(data.admin));
      onLogin();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Giriş başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm mx-4">
        <div className="text-4xl mb-4 text-center">🔧</div>
        <h1 className="text-xl font-bold text-slate-800 text-center mb-6">Süper Admin Girişi</h1>
        <div className="space-y-4">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="E-posta"
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Şifre"
            onKeyDown={e => { if (e.key === 'Enter') submit(); }}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button onClick={submit} disabled={loading} className="w-full py-3 bg-slate-800 text-white font-bold rounded-xl disabled:opacity-50">
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </div>
      </div>
    </div>
  );
}
