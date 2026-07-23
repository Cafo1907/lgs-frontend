import { useState } from 'react';
import axios from 'axios';

interface Props { mode: 'score' | 'nets'; onDone: () => void; onBack: () => void }

const SUBJECTS = [
  { code: 'TUR', name: 'Türkçe', icon: '📖', max: 20 },
  { code: 'MAT', name: 'Matematik', icon: '🔢', max: 20 },
  { code: 'FEN', name: 'Fen Bilimleri', icon: '🔬', max: 20 },
  { code: 'SOS', name: 'Sosyal Bilgiler', icon: '🌍', max: 10 },
  { code: 'DIN', name: 'Din Kültürü', icon: '📿', max: 10 },
  { code: 'ING', name: 'İngilizce', icon: '🌐', max: 10 },
];

export default function ManualPlacementPage({ mode, onDone, onBack }: Props) {
  const [score, setScore] = useState('');
  const [ranking, setRanking] = useState('');
  const [nets, setNets] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ finalScore: number | null; totalNet: number | null } | null>(null);

  const handleSubmit = async () => {
    setSaving(true);
    setError('');
    try {
      let body: any = { mode };
      if (mode === 'score') {
        if (!score) { setError('Lütfen puanını gir.'); setSaving(false); return; }
        body.score = parseFloat(score);
        body.ranking = ranking ? parseInt(ranking) : undefined;
      } else {
        const subjectNets: Record<string, number> = {};
        for (const s of SUBJECTS) {
          const v = nets[s.code];
          subjectNets[s.code] = v !== undefined && v !== '' ? parseFloat(v) : 0;
        }
        body.subjectNets = subjectNets;
      }
      const { data } = await axios.post('/api/placement/manual-finish', body);
      setResult(data);
    } catch {
      setError('Bir hata oluştu, tekrar dene.');
    } finally {
      setSaving(false);
    }
  };

  if (result) {
    return (
      <div className="max-w-2xl mx-auto min-h-screen bg-slate-50 pb-10">
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 pt-12 pb-10 text-white text-center">
          <div className="text-4xl mb-3">🎯</div>
          <h1 className="text-xl font-bold">Seviyen Belirlendi</h1>
          <p className="text-purple-100 text-sm mt-1">
            {mode === 'score' ? 'Girdiğin puan kaydedildi.' : 'Net sayılarına göre tahmini puanın hesaplandı.'}
          </p>
        </div>
        <div className="px-4 mt-5 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
            <div className="text-xs text-slate-500 font-medium mb-1">
              {mode === 'score' ? 'Puanın' : 'Tahmini Puanın'}
            </div>
            <div className="text-5xl font-black text-purple-700">{result.finalScore ?? '–'}</div>
            {result.totalNet !== null && (
              <div className="text-xs text-slate-400 mt-2">Toplam net: {result.totalNet}</div>
            )}
          </div>
          <button onClick={onDone}
            className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl transition-all">
            Ana Sayfaya Git →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto min-h-screen bg-slate-50 pb-10">
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 pt-12 pb-8 text-white">
        <button onClick={onBack} className="text-purple-200 text-sm mb-4 hover:text-white transition-colors">← Geri Dön</button>
        <div className="text-4xl mb-3">{mode === 'score' ? '✍️' : '🧮'}</div>
        <h1 className="text-xl font-bold">
          {mode === 'score' ? 'Son Deneme Sınavı Sonucun' : 'Ders Bazlı Net Sayıların'}
        </h1>
        <p className="text-purple-100 text-sm mt-1">
          {mode === 'score'
            ? 'En son yaptığın deneme sınavının puanını ve varsa sıralamanı gir.'
            : 'Her ders için net sayını gir, tahmini puanını hesaplayalım.'}
        </p>
      </div>

      <div className="px-4 mt-5 space-y-4">
        <div className="bg-blue-50 rounded-2xl p-4 text-sm text-blue-700 leading-relaxed">
          {mode === 'score'
            ? '📌 Bu bilgi, seni sınava sokmadan mevcut seviyeni sisteme tanıtmamızı sağlar. Girdiğin puan, hedef lise mesafeni gösteren ilk referans noktası olarak kaydedilir; sınav çözmeden hemen çalışmaya başlayabilirsin.'
            : '📌 Girdiğin net sayılarından tahmini bir puan hesaplarız ve hangi derslerde daha güçlü/zayıf olduğunu bu bilgiye göre belirleriz. Böylece sınav çözmeden hemen sana özel soru yönlendirmesi başlar.'}
        </div>
        {mode === 'score' ? (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h2 className="font-semibold text-slate-700 mb-3">Sınav Bilgileri</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 font-medium">Sınav Puanı (0–500)</label>
                <input type="number" min="0" max="500" value={score} onChange={e => setScore(e.target.value)}
                  placeholder="Örn: 380"
                  className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium">Sıralaması (opsiyonel)</label>
                <input type="number" min="1" value={ranking} onChange={e => setRanking(e.target.value)}
                  placeholder="Örn: 45000"
                  className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h2 className="font-semibold text-slate-700 mb-1">Ders Bazlı Net Sayıları</h2>
            <p className="text-xs text-slate-400 mb-3">Bilmiyorsan boş bırakabilirsin, 0 kabul edilir.</p>
            <div className="space-y-3">
              {SUBJECTS.map(s => (
                <div key={s.code} className="flex items-center gap-3">
                  <span className="text-xl w-7">{s.icon}</span>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-slate-600">{s.name}</div>
                    <div className="text-xs text-slate-400">Max {s.max} net</div>
                  </div>
                  <input type="number" min="0" max={s.max} step="0.25"
                    value={nets[s.code] ?? ''}
                    onChange={e => setNets(prev => ({ ...prev, [s.code]: e.target.value }))}
                    placeholder="–"
                    className="w-20 px-3 py-2 border border-slate-200 rounded-xl text-sm text-center focus:outline-none focus:ring-2 focus:ring-purple-400" />
                </div>
              ))}
            </div>
          </div>
        )}

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <button onClick={handleSubmit} disabled={saving}
          className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl transition-all disabled:opacity-50">
          {saving ? '⏳ Kaydediliyor...' : (mode === 'score' ? 'Kaydet ve Devam Et' : 'Hesapla ve Devam Et')}
        </button>
      </div>
    </div>
  );
}
