import { useState } from 'react';
import axios from 'axios';

interface Props { onDone: () => void }

async function saveTarget(schoolName: string, requiredScore: string, requiredNet: string) {
  await axios.post('/api/target-school', {
    schoolName: schoolName.trim() || undefined,
    requiredScore: requiredScore ? parseFloat(requiredScore) : undefined,
    requiredNet: requiredNet ? parseFloat(requiredNet) : undefined,
  });
}

export default function TargetSchoolSetup({ onDone }: Props) {
  const [schoolName, setSchoolName] = useState('');
  const [requiredScore, setRequiredScore] = useState('');
  const [requiredNet, setRequiredNet] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await saveTarget(schoolName, requiredScore, requiredNet);
      onDone();
    } catch { setError('Kaydedilemedi, tekrar deneyin.'); setSaving(false); }
  };

  const handleSkip = async () => {
    try { await saveTarget('', '', ''); } catch { /* hata olsa da geç */ }
    onDone();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-purple-600 to-purple-800">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🎯</div>
          <h1 className="text-2xl font-bold text-white">Hedef Okul Belirle</h1>
          <p className="text-purple-100 text-sm mt-1">Öğrencinizin hedef lisesini girin</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-slate-500 font-medium">Hedef Lise</label>
              <input value={schoolName} onChange={e => setSchoolName(e.target.value)}
                placeholder="örn: Beykoz Fen Lisesi"
                className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium">Gereken LGS Puanı</label>
              <input type="number" step="0.01" value={requiredScore} onChange={e => setRequiredScore(e.target.value)}
                placeholder="örn: 440"
                className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium">Gereken Net (90 üzerinden)</label>
              <input type="number" step="0.1" value={requiredNet} onChange={e => setRequiredNet(e.target.value)}
                placeholder="örn: 76.5"
                className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
            </div>
            {error && <p className="text-red-500 text-xs text-center">{error}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={handleSkip}
                className="flex-1 py-3 bg-slate-100 text-slate-600 font-semibold rounded-xl hover:bg-slate-200 active:scale-95 transition-all text-sm">
                Sonra Dolduracağım
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 py-3 bg-purple-600 text-white font-semibold rounded-xl disabled:opacity-40 hover:bg-purple-700 active:scale-95 transition-all text-sm">
                {saving ? 'Kaydediliyor...' : 'Kaydet →'}
              </button>
            </div>
          </form>
        </div>
        <p className="text-purple-200 text-xs text-center mt-3">Bu bilgileri daha sonra değiştirebilirsiniz.</p>
      </div>
    </div>
  );
}
