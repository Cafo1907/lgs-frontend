import { useState, useEffect } from 'react';
import axios from 'axios';

export default function DifficultyLevelCard() {
  const [level, setLevel] = useState<'STANDARD' | 'HARD' | null>(null);
  const [suggestHarder, setSuggestHarder] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axios.get('/api/parent/difficulty-level').then(r => {
      setLevel(r.data.difficultyLevel);
      setSuggestHarder(r.data.suggestHarder);
    }).catch(() => {});
  }, []);

  const setLevelAndSave = async (next: 'STANDARD' | 'HARD') => {
    if (next === level) return;
    setSaving(true);
    try {
      await axios.post('/api/parent/difficulty-level', { difficultyLevel: next });
      setLevel(next);
      if (next === 'HARD') setSuggestHarder(false);
    } catch {
      alert('Kaydedilemedi, tekrar dene.');
    } finally {
      setSaving(false);
    }
  };

  if (level === null) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-1">🎚️ Soru Zorluk Seviyesi</h3>
      <p className="text-xs text-slate-400 mb-3">Günlük sınavlarda çıkan soruların zorluk oranını belirler. Standart, öğrencinin seviyesine uygun dengeli bir dağılım sunar; Zorlayıcı, daha fazla zor soru içerir.</p>

      {suggestHarder && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3">
          <p className="text-xs text-amber-800">
            💡 Öğrenciniz son sınavlarında yüksek başarı gösteriyor. Zorluk seviyesini artırmakta fayda görüyoruz.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => setLevelAndSave('STANDARD')} disabled={saving}
          className={`py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 ${level === 'STANDARD' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
          Standart
        </button>
        <button onClick={() => setLevelAndSave('HARD')} disabled={saving}
          className={`py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 ${level === 'HARD' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
          Zorlayıcı
        </button>
      </div>
    </div>
  );
}
