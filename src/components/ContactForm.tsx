import { useState } from 'react';
import axios from 'axios';

export default function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    try {
      await axios.post('/api/contact', { name, email, phone: phone || undefined, subject, message });
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <div className="text-center py-4">
        <div className="text-3xl mb-2">✅</div>
        <p className="font-semibold text-slate-800">Mesajınız alındı!</p>
        <p className="text-sm text-slate-500 mt-1">En kısa sürede size dönüş yapacağız.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 text-left">
      <div>
        <label className="text-xs font-semibold text-slate-600">Ad Soyad</label>
        <input required value={name} onChange={e => setName(e.target.value)}
          className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Ayşe Yılmaz" />
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-600">E-posta</label>
        <input required type="email" value={email} onChange={e => setEmail(e.target.value)}
          className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="ornek@mail.com" />
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-600">Telefon <span className="font-normal text-slate-400">(opsiyonel)</span></label>
        <input value={phone} onChange={e => setPhone(e.target.value)}
          className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="05XX XXX XX XX" />
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-600">Konu</label>
        <input required value={subject} onChange={e => setSubject(e.target.value)}
          className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Sorunuz veya talebiniz" />
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-600">Mesaj</label>
        <textarea required value={message} onChange={e => setMessage(e.target.value)} rows={4}
          className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Mesajınızı yazın..." />
      </div>
      <button type="submit" disabled={status === 'sending'}
        className="w-full bg-purple-600 text-white font-semibold rounded-xl py-2.5 hover:bg-purple-700 active:scale-95 transition-all disabled:opacity-60">
        {status === 'sending' ? 'Gönderiliyor...' : 'Mesajı Gönder'}
      </button>
      {status === 'error' && (
        <p className="text-xs text-red-500 text-center">Bir sorun oluştu, lütfen tekrar deneyin.</p>
      )}
    </form>
  );
}
