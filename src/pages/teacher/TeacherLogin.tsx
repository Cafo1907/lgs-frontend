import { useState } from 'react';
import axios from 'axios';

export default function TeacherLogin({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(''); setLoading(true);
    try {
      const { data } = await axios.post('/api/teacher/login', { email, password });
      localStorage.setItem('teacherToken', data.token);
      localStorage.setItem('teacherInfo', JSON.stringify(data.teacher));
      onLogin();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Giriş başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full">
        <div className="text-3xl mb-2 text-center">🧑‍🏫</div>
        <h1 className="text-xl font-bold text-slate-800 text-center mb-6">Öğretmen Girişi</h1>
        <div className="space-y-3">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="E-posta"
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Şifre"
            onKeyDown={e => { if (e.key === 'Enter') submit(); }}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
          {error && <div className="text-xs text-red-600 text-center">{error}</div>}
          <button onClick={submit} disabled={loading} className="w-full py-3 bg-slate-800 text-white font-bold rounded-xl disabled:opacity-50">
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </div>
      </div>
    </div>
  );
}
