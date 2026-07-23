import { useState, useEffect } from 'react';
import axios from 'axios';

interface TargetSchool { schoolName: string | null; requiredScore: number | null; requiredNet: number | null }

export default function TargetSchoolCard() {
  const [target, setTarget] = useState<TargetSchool | null>(null);
  const [editing, setEditing] = useState(false);
  const [schoolName, setSchoolName] = useState('');
  const [requiredScore, setRequiredScore] = useState('');
  const [requiredNet, setRequiredNet] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => {
    axios.get('/api/target-school').then(r => {
      setTarget(r.data);
      setSchoolName(r.data?.schoolName ?? '');
      setRequiredScore(r.data?.requiredScore != null ? String(r.data.requiredScore) : '');
      setRequiredNet(r.data?.requiredNet != null ? String(r.data.requiredNet) : '');
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    try {
      await axios.post('/api/target-school', {
        schoolName: schoolName.trim() || undefined,
        requiredScore: requiredScore ? parseFloat(requiredScore) : undefined,
        requiredNet: requiredNet ? parseFloat(requiredNet) : undefined,
      });
      load();
      setEditing(false);
    } catch {
      alert('Kaydedilemedi, tekrar dene.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  if (!editing) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-slate-700">🏫 Hedef Okul</h3>
          <button onClick={() => setEditing(true)} className="text-xs text-purple-600 font-semibold hover:text-purple-800">
            {target?.schoolName ? 'Düzenle' : 'Ekle'}
          </button>
        </div>
        <p className="text-xs text-slate-400">Öğrencinizin gidebileceği ve deneme/sınav sonuçlarının kıyaslanacağı okulu belirler.</p>
        {target?.schoolName ? (
          <div className="flex items-center gap-4 mt-2 text-sm">
            <span className="font-medium text-slate-800">{target.schoolName}</span>
            {target.requiredScore != null && <span className="text-slate-400 text-xs">Puan: <span className="font-semibold text-slate-600">{target.requiredScore}</span></span>}
            {target.requiredNet != null && <span className="text-slate-400 text-xs">Net: <span className="font-semibold text-slate-600">{target.requiredNet}</span></span>}
          </div>
        ) : (
          <p className="text-xs text-slate-400 mt-1">Henüz hedef okul belirlenmedi.</p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">🏫 Hedef Okul</h3>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-slate-500 font-medium">Hedef Lise</label>
          <input value={schoolName} onChange={e => setSchoolName(e.target.value)}
            placeholder="örn: Beykoz Fen Lisesi"
            className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-500 font-medium">Gereken Puan</label>
            <input type="number" step="0.01" value={requiredScore} onChange={e => setRequiredScore(e.target.value)}
              placeholder="örn: 440"
              className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
          </div>
          <div>
            <label className="text-xs text-slate-500 font-medium">Gereken Net</label>
            <input type="number" step="0.1" value={requiredNet} onChange={e => setRequiredNet(e.target.value)}
              placeholder="örn: 76.5"
              className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setEditing(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-semibold rounded-xl text-sm hover:bg-slate-200">
            Vazgeç
          </button>
          <button onClick={save} disabled={saving} className="flex-1 py-2.5 bg-purple-600 text-white font-semibold rounded-xl text-sm hover:bg-purple-700 disabled:opacity-50">
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
}
