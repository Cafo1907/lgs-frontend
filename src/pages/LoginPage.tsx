import { useState } from 'react';

interface Props {
  onLogin: (email: string, password: string) => Promise<void>;
}

export default function LoginPage({ onLogin }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError('');
    try {
      await onLogin(email.trim(), password);
    } catch {
      setError('E-posta veya şifre hatalı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-purple-600 to-purple-800">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">📚</div>
          <h1 className="text-2xl font-bold text-white">LGS Hazırlık</h1>
          <p className="text-purple-100 text-sm mt-1">Kişisel LGS çalışma sistemi</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          <p className="text-slate-600 text-sm font-medium mb-4 text-center">Giriş Yap</p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs text-slate-500 font-medium">E-posta</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ornek@email.com"
                className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium">Şifre</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                autoComplete="current-password"
              />
            </div>

            {error && <p className="text-red-500 text-xs text-center">{error}</p>}

            <button
              type="submit"
              disabled={!email || !password || loading}
              className="w-full py-3 bg-purple-600 text-white font-semibold rounded-xl disabled:opacity-40 hover:bg-purple-700 active:scale-95 transition-all"
            >
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>
        </div>

        <p className="text-purple-200 text-xs text-center mt-4">
          Hesabınız yok mu? Yöneticinize başvurun.
        </p>
      </div>
    </div>
  );
}
