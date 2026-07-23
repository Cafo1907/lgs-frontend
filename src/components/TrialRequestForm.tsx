import { useState } from 'react';
import axios from 'axios';

const GRADES = ['5. Sınıf', '6. Sınıf', '7. Sınıf', '8. Sınıf'];

export default function TrialRequestForm() {
  const [parentName, setParentName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [studentName, setStudentName] = useState('');
  const [grade, setGrade] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    try {
      await axios.post('/api/trial-request', { parentName, phone, email, studentName, grade, note });
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <div className="text-center py-4">
        <div className="text-3xl mb-2">✅</div>
        <p className="font-semibold text-slate-800">Talebiniz alındı!</p>
        <p className="text-sm text-slate-500 mt-1">En kısa sürede sizinle iletişime geçip hesabınızı açacağız.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 text-left">
      <div>
        <label className="text-xs font-semibold text-slate-600">Veli Adı Soyadı</label>
        <input required value={parentName} onChange={e => setParentName(e.target.value)}
          className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Ayşe Yılmaz" />
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-600">Telefon</label>
        <input required value={phone} onChange={e => setPhone(e.target.value)}
          className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="05XX XXX XX XX" />
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-600">E-posta</label>
        <input required type="email" value={email} onChange={e => setEmail(e.target.value)}
          className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="ornek@mail.com" />
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-600">Öğrenci Adı Soyadı</label>
        <input required value={studentName} onChange={e => setStudentName(e.target.value)}
          className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Ali Yılmaz" />
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-600">Sınıf</label>
        <select required value={grade} onChange={e => setGrade(e.target.value)}
          className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white">
          <option value="" disabled>Seçin</option>
          {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-600">Not <span className="font-normal text-slate-400">(opsiyonel)</span></label>
        <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
          className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Eklemek istediğiniz bir şey var mı?" />
      </div>
      <button type="submit" disabled={status === 'sending'}
        className="w-full bg-purple-600 text-white font-semibold rounded-xl py-2.5 hover:bg-purple-700 active:scale-95 transition-all disabled:opacity-60">
        {status === 'sending' ? 'Gönderiliyor...' : 'Talebi Gönder'}
      </button>
      {status === 'error' && (
        <p className="text-xs text-red-500 text-center">Bir sorun oluştu, lütfen tekrar deneyin.</p>
      )}
    </form>
  );
}
