import { useState } from 'react';
import axios from 'axios';

interface Props {
  onDone: () => void;
}

const RULES = [
  { key: 'length', label: 'En az 6 karakter', test: (p: string) => p.length >= 6 },
  { key: 'upper', label: 'En az bir büyük harf (A-Z)', test: (p: string) => /[A-Z]/.test(p) },
  { key: 'lower', label: 'En az bir küçük harf (a-z)', test: (p: string) => /[a-z]/.test(p) },
  { key: 'digit', label: 'En az bir rakam (0-9)', test: (p: string) => /[0-9]/.test(p) },
];

export default function ChangePasswordPage({ onDone }: Props) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const allValid = RULES.every(r => r.test(newPassword));
  const matches = newPassword.length > 0 && newPassword === confirmPassword;

  const submit = async () => {
    setError('');
    if (!allValid) { setError('Şifre gerekli kriterleri karşılamıyor.'); return; }
    if (!matches) { setError('Şifreler eşleşmiyor.'); return; }
    setLoading(true);
    try {
      await axios.post('/api/auth/change-password', { newPassword });
      onDone();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Şifre güncellenemedi, tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full">
        <div className="text-4xl mb-3 text-center">🔑</div>
        <h1 className="text-lg font-bold text-slate-800 text-center mb-1">Şifreni Güncelle</h1>
        <p className="text-sm text-slate-400 text-center mb-6">Hesabına size otomatik bir şifre atanmıştı. Devam etmeden önce kendi şifrenizi belirleyin.</p>

        <div className="space-y-3">
          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
            placeholder="Yeni şifre" autoFocus
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
          <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Yeni şifre (tekrar)" onKeyDown={e => { if (e.key === 'Enter') submit(); }}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />

          <ul className="space-y-1 pt-1">
            {RULES.map(r => {
              const ok = r.test(newPassword);
              return (
                <li key={r.key} className={`text-xs flex items-center gap-1.5 ${ok ? 'text-green-600' : 'text-slate-400'}`}>
                  <span>{ok ? '✓' : '○'}</span> {r.label}
                </li>
              );
            })}
          </ul>

          {error && <div className="text-xs text-red-600 text-center">{error}</div>}

          <button onClick={submit} disabled={loading || !allValid || !matches}
            className="w-full py-3 bg-purple-600 text-white font-bold rounded-xl disabled:opacity-50">
            {loading ? 'Kaydediliyor...' : 'Şifreyi Kaydet ve Devam Et'}
          </button>
        </div>
      </div>
    </div>
  );
}
