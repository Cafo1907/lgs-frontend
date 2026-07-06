import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Question {
  id: number; subjectId: number; subjectName: string; subjectIcon: string;
  topicId: number; orderIndex: number;
  text: string; optionA: string; optionB: string; optionC: string; optionD: string; difficulty: string;
}

function formatTime(s: number) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export default function PlacementExamPage() {
  const navigate = useNavigate();
  const [examId, setExamId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string | null>>({});
  const [activeSubjectId, setActiveSubjectId] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState(8100);
  const [generating, setGenerating] = useState(true);
  const [timeUp, setTimeUp] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitted = useRef(false);

  useEffect(() => {
    axios.post('/api/placement/generate')
      .then(r => {
        setExamId(r.data.examId);
        setQuestions(r.data.questions);
        setTimeLeft(r.data.timeLimitSeconds);
        setActiveSubjectId(r.data.questions[0]?.subjectId ?? 0);
        setGenerating(false);
      })
      .catch(e => { setError(e.response?.data?.error || 'Oluşturulamadı'); setGenerating(false); });
  }, []);

  const doSubmit = useCallback(async (auto = false) => {
    if (submitted.current || !examId) return;
    submitted.current = true;
    setSubmitting(true);
    try {
      await axios.post(`/api/placement/${examId}/submit`, {
        answers: questions.map(q => ({ questionId: q.id, answer: answers[q.id] ?? null })),
      });
      navigate('/placement-done', { state: { auto, score: null } });
    } catch {
      submitted.current = false;
      setSubmitting(false);
      alert('Gönderilemedi, tekrar deneyin.');
    }
  }, [examId, questions, answers, navigate]);

  useEffect(() => {
    if (!examId || submitting) return;
    if (timeLeft <= 0) { setTimeUp(true); return; }
    const t = setTimeout(() => setTimeLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, examId, submitting]);

  useEffect(() => { if (timeUp && !submitted.current) setTimeout(() => doSubmit(true), 2000); }, [timeUp, doSubmit]);

  const subjects = [...new Map(questions.map(q => [q.subjectId, { id: q.subjectId, name: q.subjectName, icon: q.subjectIcon }])).values()];
  const subQuestions = questions.filter(q => q.subjectId === activeSubjectId);
  const totalAnswered = Object.values(answers).filter(v => v != null).length;
  const timerColor = timeLeft < 600 ? 'text-red-500' : timeLeft < 1800 ? 'text-orange-500' : 'text-slate-800';

  if (generating) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6 text-center">
      <div className="animate-spin rounded-full h-14 w-14 border-4 border-purple-500 border-t-transparent" />
      <h2 className="font-bold text-slate-800 text-lg">Seviye Tespit Sınavı Hazırlanıyor</h2>
      <p className="text-slate-500 text-sm">90 soru yapay zeka tarafından oluşturuluyor...</p>
      <p className="text-slate-400 text-xs">Bu işlem 30–60 saniye sürebilir</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6 text-center">
      <div className="text-5xl">⚠️</div>
      <h2 className="font-bold text-slate-800">Hata</h2>
      <p className="text-red-500 text-sm">{error}</p>
      <button onClick={() => navigate('/')} className="bg-purple-500 text-white px-6 py-3 rounded-xl font-semibold">Geri Dön</button>
    </div>
  );

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col bg-slate-50">
      {timeUp && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl p-6 text-center max-w-xs w-full shadow-2xl">
            <div className="text-5xl mb-3">⏰</div>
            <h2 className="font-black text-xl mb-2">Süre Doldu!</h2>
            <p className="text-slate-500 text-sm">Cevaplarınız gönderiliyor...</p>
            <div className="mt-4 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent" /></div>
          </div>
        </div>
      )}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl p-6 max-w-xs w-full shadow-2xl">
            <h2 className="font-bold text-lg mb-2">Sınavı Bitir?</h2>
            <p className="text-slate-500 text-sm mb-4">{totalAnswered}/{questions.length} soru cevaplandı.</p>
            <p className="text-xs text-slate-400 mb-4">Bu bir seviye tespit sınavıdır. Sonuçlar kişisel çalışma planınızı belirler.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 font-semibold text-sm">Devam Et</button>
              <button onClick={() => { setShowConfirm(false); doSubmit(false); }} disabled={submitting} className="flex-1 py-3 rounded-xl bg-purple-500 text-white font-semibold text-sm disabled:opacity-50">Bitir</button>
            </div>
          </div>
        </div>
      )}

      {/* Timer bar */}
      <div className="bg-white border-b sticky top-0 z-40 px-4 pt-3 pb-2 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div><span className="text-xs text-slate-400 font-medium">SEVİYE TESPİT</span><br/><span className="text-xs text-slate-500">{totalAnswered}/{questions.length}</span></div>
          <div className={`text-2xl font-black tabular-nums ${timerColor}`}>{formatTime(timeLeft)}</div>
          <button onClick={() => setShowConfirm(true)} className="bg-purple-500 text-white text-xs px-3 py-2 rounded-xl font-semibold">Bitir</button>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-1.5">
          <div className="h-1.5 rounded-full bg-purple-500" style={{ width: `${(totalAnswered / questions.length) * 100}%` }} />
        </div>
      </div>

      {/* Ders sekmeleri */}
      <div className="bg-white border-b px-2 py-2 flex gap-1 overflow-x-auto sticky top-[76px] z-30">
        {subjects.map(sub => {
          const sq = questions.filter(q => q.subjectId === sub.id);
          const sa = sq.filter(q => answers[q.id] != null).length;
          const isActive = activeSubjectId === sub.id;
          return (
            <button key={sub.id} onClick={() => setActiveSubjectId(sub.id)}
              className={`flex flex-col items-center px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all ${isActive ? 'bg-purple-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
              <span>{sub.icon}</span>
              <span className={`text-xs mt-0.5 ${isActive ? 'text-white/80' : 'text-slate-400'}`}>{sa}/{sq.length}</span>
            </button>
          );
        })}
      </div>

      {/* Sorular */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {subQuestions.map(q => {
          const globalIdx = questions.findIndex(gq => gq.id === q.id) + 1;
          const sel = answers[q.id];
          return (
            <div key={q.id} className="bg-white rounded-2xl shadow-sm p-4">
              <div className="flex items-start gap-2 mb-3">
                <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0">{globalIdx}</span>
                <p className="text-slate-800 text-sm leading-relaxed flex-1">{q.text}</p>
              </div>
              <div className="space-y-2">
                {(['A', 'B', 'C', 'D'] as const).map(opt => {
                  const text = q[`option${opt}` as keyof Question] as string;
                  const isSelected = sel === opt;
                  return (
                    <button key={opt} onClick={() => setAnswers(p => ({ ...p, [q.id]: isSelected ? null : opt }))}
                      className={`w-full text-left p-3 rounded-xl border text-sm transition-all ${isSelected ? 'bg-purple-500 text-white border-purple-500 font-medium' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}>
                      <span className={`font-bold mr-2 ${isSelected ? 'text-white' : 'text-purple-500'}`}>{opt})</span>{text}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
