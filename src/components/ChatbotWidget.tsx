import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface Message {
  from: 'user' | 'bot';
  text: string;
}

type LeadStatus = 'none' | 'prompt' | 'form' | 'sent' | 'dismissed';

const WELCOME = 'Merhaba! Ben Hedo, Hedefim LGS sanal asistanıyım. Sorunu buraya yazabilirsin. 🙂';
const LEAD_STATUS_KEY = 'chatbotLeadStatus';
const USER_MSG_COUNT_TRIGGER = 3;

function randomTypingDelay(): number {
  return 900 + Math.random() * 900; // 0.9 - 1.8 sn, gerçekçi bir "yazıyor" hissi için
}

function getSessionId(): string {
  const key = 'chatbotSessionId';
  let id = localStorage.getItem(key);
  if (!id) {
    id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(key, id);
  }
  return id;
}

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{ from: 'bot', text: WELCOME }]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [userMsgCount, setUserMsgCount] = useState(0);
  const [lastQuestion, setLastQuestion] = useState('');
  // localStorage'dan sadece kesin sonuçlar (gönderildi/vazgeçildi) geri yüklenir —
  // "prompt"/"form" gibi ara durumlar hiç kalıcı olmaz, aksi halde sayfa yenilenince
  // konuşma hiç başlamadan form açık kalır.
  const [leadStatus, setLeadStatus] = useState<LeadStatus>(() => {
    const saved = localStorage.getItem(LEAD_STATUS_KEY);
    return saved === 'sent' || saved === 'dismissed' ? saved : 'none';
  });
  const [leadName, setLeadName] = useState('');
  const [leadContact, setLeadContact] = useState('');
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open, leadStatus]);

  // Sadece kesin/final durumlar ("sent", "dismissed") kalıcı olarak saklanır.
  function setFinalLeadStatus(status: 'sent' | 'dismissed') {
    setLeadStatus(status);
    localStorage.setItem(LEAD_STATUS_KEY, status);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    setMessages(prev => [...prev, { from: 'user', text }]);
    setInput('');
    setLastQuestion(text);
    const nextCount = userMsgCount + 1;
    setUserMsgCount(nextCount);
    setSending(true);
    try {
      const [{ data }] = await Promise.all([
        axios.post('/api/chatbot/ask', { message: text, sessionId: getSessionId() }),
        new Promise(resolve => setTimeout(resolve, randomTypingDelay())),
      ]);
      setMessages(prev => [...prev, { from: 'bot', text: data.answer }]);
      if (leadStatus === 'none' && (data.hotLead || nextCount >= USER_MSG_COUNT_TRIGGER)) {
        setLeadStatus('prompt');
      }
    } catch {
      await new Promise(resolve => setTimeout(resolve, randomTypingDelay()));
      setMessages(prev => [...prev, { from: 'bot', text: 'Bir sorun oluştu, lütfen tekrar deneyin.' }]);
    } finally {
      setSending(false);
    }
  }

  async function submitLead(e: React.FormEvent) {
    e.preventDefault();
    if (!leadName.trim() || !leadContact.trim() || leadSubmitting) return;
    setLeadSubmitting(true);
    try {
      await axios.post('/api/chatbot/lead', {
        sessionId: getSessionId(),
        name: leadName.trim(),
        contact: leadContact.trim(),
        lastQuestion,
      });
      setFinalLeadStatus('sent');
    } catch {
      setLeadSubmitting(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open && (
        <div className="mb-3 w-80 max-w-[90vw] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden" style={{ height: 420 }}>
          <div className="bg-purple-600 text-white px-4 py-3 flex justify-between items-center">
            <span className="text-sm font-semibold">💬 Hedo · Hedefim LGS Sanal Asistanı</span>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white text-lg leading-none">×</button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-slate-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.from === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`text-xs rounded-xl px-3 py-2 max-w-[85%] ${m.from === 'user' ? 'bg-purple-600 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>
                  {m.text}
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex justify-start">
                <div className="text-xs rounded-xl px-3 py-2 bg-white border border-slate-200 text-slate-400 flex items-center gap-1">
                  <span>Hedo yazıyor</span>
                  <span className="flex gap-0.5">
                    <span className="w-1 h-1 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1 h-1 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1 h-1 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            )}

            {leadStatus === 'prompt' && (
              <div className="flex justify-start">
                <div className="bg-gradient-to-br from-purple-50 to-white border border-purple-200 rounded-2xl px-3 py-2.5 max-w-[90%] shadow-sm">
                  <p className="text-xs text-slate-600 mb-2">📞 İstersen size özel dönüş yapabilmemiz için iletişim bilgini bırakabilirsin <span className="text-slate-400">(opsiyonel)</span></p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setLeadStatus('form')}
                      className="flex-1 bg-purple-600 text-white text-[11px] font-semibold rounded-lg py-1.5 hover:bg-purple-700 active:scale-95 transition-all"
                    >
                      Bilgi Bırak
                    </button>
                    <button
                      onClick={() => setFinalLeadStatus('dismissed')}
                      className="flex-1 bg-white border border-slate-200 text-slate-500 text-[11px] font-semibold rounded-lg py-1.5 hover:bg-slate-50 active:scale-95 transition-all"
                    >
                      Şimdi Değil
                    </button>
                  </div>
                </div>
              </div>
            )}

            {leadStatus === 'form' && (
              <div className="flex justify-start">
                <form onSubmit={submitLead} className="bg-gradient-to-br from-purple-50 to-white border border-purple-200 rounded-2xl px-3 py-2.5 max-w-[90%] shadow-sm space-y-2 w-64">
                  <input
                    required
                    value={leadName}
                    onChange={e => setLeadName(e.target.value)}
                    placeholder="Ad Soyad"
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                  <input
                    required
                    value={leadContact}
                    onChange={e => setLeadContact(e.target.value)}
                    placeholder="Telefon veya e-posta"
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                  <button
                    type="submit"
                    disabled={leadSubmitting}
                    className="w-full bg-purple-600 text-white text-[11px] font-semibold rounded-lg py-1.5 hover:bg-purple-700 active:scale-95 transition-all disabled:opacity-60"
                  >
                    {leadSubmitting ? 'Gönderiliyor...' : 'Gönder'}
                  </button>
                </form>
              </div>
            )}

            {leadStatus === 'sent' && (
              <div className="flex justify-start">
                <div className="bg-green-50 border border-green-200 rounded-2xl px-3 py-2 text-xs text-green-700 max-w-[85%]">
                  ✅ Teşekkürler! En kısa sürede sizinle iletişime geçeceğiz.
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
          <form onSubmit={handleSend} className="flex gap-2 p-2 border-t border-slate-100">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Sorunuzu yazın..."
              className="flex-1 text-sm px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            <button type="submit" disabled={sending} className="bg-purple-600 text-white text-sm font-semibold rounded-xl px-3 py-2 hover:bg-purple-700 disabled:opacity-60">
              Gönder
            </button>
          </form>
        </div>
      )}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-14 h-14 rounded-full bg-purple-600 text-white text-2xl shadow-2xl hover:bg-purple-700 active:scale-95 transition-all flex items-center justify-center"
        aria-label="Sohbet asistanını aç"
      >
        {open ? '×' : '💬'}
      </button>
    </div>
  );
}
