import { useState, useEffect } from 'react';
import axios from 'axios';

interface Prefs {
  emailExamCompleted: boolean;
  emailMockCompleted: boolean;
  emailMockReminder: boolean;
  emailDailySummary: boolean;
  emailWeeklyReport: boolean;
}

const OPTIONS: { key: keyof Prefs; icon: string; title: string; desc: string }[] = [
  { key: 'emailExamCompleted', icon: '📚', title: 'Günlük Sınav Tamamlandı', desc: 'Çocuğunuz her sınavı bitirdiğinde anında bildirim' },
  { key: 'emailMockCompleted', icon: '🏆', title: 'Deneme Sınavı Sonucu', desc: 'Deneme sınavı bitince sonuç maili' },
  { key: 'emailMockReminder', icon: '⏰', title: 'Deneme Sınavı Hatırlatması', desc: 'Sınavdan bir gün önce (Cuma 19:00) hatırlatma' },
  { key: 'emailDailySummary', icon: '📅', title: 'Günlük Özet', desc: 'Her akşam 21:00 o günkü çalışma özeti' },
  { key: 'emailWeeklyReport', icon: '📈', title: 'Haftalık Gelişim Raporu', desc: 'Her Pazar 20:00 haftalık konu analizi' },
];

export default function EmailPreferences() {
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [secondaryEmail, setSecondaryEmail] = useState('');
  const [secondaryName, setSecondaryName] = useState('');
  const [secondarySaved, setSecondarySaved] = useState(false);
  const [secondarySaving, setSecondarySaving] = useState(false);
  const [secondaryError, setSecondaryError] = useState('');

  useEffect(() => {
    axios.get('/api/parent/email-preferences').then(r => setPrefs(r.data));
    axios.get('/api/parent/secondary-email').then(r => {
      setSecondaryEmail(r.data?.secondaryParentEmail || '');
      setSecondaryName(r.data?.secondaryParentName || '');
    });
  }, []);

  const saveSecondaryEmail = async () => {
    setSecondarySaving(true);
    setSecondaryError('');
    setSecondarySaved(false);
    try {
      await axios.post('/api/parent/secondary-email', { secondaryParentEmail: secondaryEmail.trim() || null, secondaryParentName: secondaryName.trim() || null });
      setSecondarySaved(true);
    } catch (e: any) {
      setSecondaryError(e.response?.data?.error || 'Kaydedilemedi.');
    } finally {
      setSecondarySaving(false);
    }
  };

  const toggle = async (key: keyof Prefs) => {
    if (!prefs) return;
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    setSaving(true);
    setSaved(false);
    try {
      await axios.post('/api/parent/email-preferences', updated);
      setSaved(true);
    } catch {
      setPrefs(prefs); // geri al
    } finally {
      setSaving(false);
    }
  };

  if (!prefs) return <div className="flex justify-center pt-16"><div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent" /></div>;

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">👥</span>
          <span className="font-semibold text-slate-800 text-sm">2. Bilgilendirme E-postası</span>
        </div>
        <p className="text-xs text-slate-400 mb-3">Aşağıda seçtiğiniz mailler, girerseniz bu adrese de gönderilir (bu adres sisteme giriş yapamaz, sadece bilgilendirme alır).</p>
        <div className="space-y-2">
          <input type="email" placeholder="ikinci-veli@ornek.com" value={secondaryEmail}
            onChange={e => { setSecondaryEmail(e.target.value); setSecondarySaved(false); }}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
          <input type="text" placeholder="İsim (opsiyonel)" value={secondaryName}
            onChange={e => { setSecondaryName(e.target.value); setSecondarySaved(false); }}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
        </div>
        {secondaryError && <p className="text-xs text-red-500 mt-2">{secondaryError}</p>}
        <button onClick={saveSecondaryEmail} disabled={secondarySaving}
          className="mt-3 w-full bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl py-2 disabled:opacity-60">
          {secondarySaving ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
        {secondarySaved && !secondarySaving && <p className="text-xs text-green-600 text-center mt-2">✅ Kaydedildi</p>}
      </div>

      <p className="text-sm text-slate-500 px-1">Hangi mail bildirimlerini almak istediğinizi seçin. İşaretli olmayan mailler gönderilmeyecek.</p>
      {OPTIONS.map(opt => (
        <div key={opt.key} className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3">
          <span className="text-2xl">{opt.icon}</span>
          <div className="flex-1">
            <div className="font-semibold text-slate-800 text-sm">{opt.title}</div>
            <div className="text-xs text-slate-400 mt-0.5">{opt.desc}</div>
          </div>
          <button onClick={() => toggle(opt.key)}
            className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${prefs[opt.key] ? 'bg-green-500' : 'bg-slate-300'}`}>
            <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${prefs[opt.key] ? 'translate-x-5' : ''}`} />
          </button>
        </div>
      ))}
      {saving && <p className="text-xs text-slate-400 text-center">Kaydediliyor...</p>}
      {saved && !saving && <p className="text-xs text-green-600 text-center">✅ Kaydedildi</p>}
    </div>
  );
}
