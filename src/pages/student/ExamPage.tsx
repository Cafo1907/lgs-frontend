import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import axios from 'axios';

interface Question {
  id: number; topicId: number; orderIndex: number;
  text: string; optionA: string; optionB: string; optionC: string; optionD: string; difficulty: string;
}

function formatTime(s: number) {
  const m = Math.floor(s / 60), sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export default function ExamPage() {
  const { examId } = useParams<{ examId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { questions: Question[]; timeLimit: number; subjectName: string; subjectIcon: string } | null;

  const [answers, setAnswers] = useState<Record<number, string | null>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(state?.timeLimit ?? 1200);
  const [timeUp, setTimeUp] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submitted = useRef(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSent, setReportSent] = useState<Record<number, boolean>>({});
  const [reportSending, setReportSending] = useState(false);

  const questions = state?.questions ?? [];

  // Soru başına harcanan süreyi ölçer: ileri/geri gidişlerde biriktirir.
  const timeAccum = useRef<Record<number, number>>({});
  const enterTimeRef = useRef<number>(Date.now());
  const flushCurrentQuestionTime = useCallback(() => {
    const q = questions[currentIdx];
    if (q) {
      const elapsed = Date.now() - enterTimeRef.current;
      timeAccum.current[q.id] = (timeAccum.current[q.id] ?? 0) + elapsed;
    }
    enterTimeRef.current = Date.now();
  }, [questions, currentIdx]);
  const goToIndex = (i: number) => { flushCurrentQuestionTime(); setCurrentIdx(i); };

  const doSubmit = useCallback(async () => {
    if (submitted.current || !examId) return;
    submitted.current = true;
    flushCurrentQuestionTime();
    setSubmitting(true);
    try {
      const { data } = await axios.post(`/api/exam/${examId}/submit`, {
        answers: questions.map(q => ({ questionId: q.id, answer: answers[q.id] ?? null, timeSpentMs: timeAccum.current[q.id] ?? 0 })),
      });
      navigate(`/result/${examId}`, { state: { result: data } });
    } catch {
      submitted.current = false;
      setSubmitting(false);
      alert('Gönderilemedi, tekrar deneyin.');
    }
  }, [examId, questions, answers, navigate, flushCurrentQuestionTime]);

  useEffect(() => {
    if (submitting || submitted.current) return;
    if (timeLeft <= 0) { setTimeUp(true); return; }
    const t = setTimeout(() => setTimeLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, submitting]);

  useEffect(() => { if (timeUp && !submitted.current) setTimeout(() => doSubmit(), 1500); }, [timeUp, doSubmit]);

  useEffect(() => { setReportOpen(false); setReportReason(''); }, [currentIdx]);

  if (!state) return <div className="flex items-center justify-center min-h-screen text-slate-500">Sınav verisi bulunamadı.</div>;

  const q = questions[currentIdx];
  const sendReport = async () => {
    if (!q) return;
    setReportSending(true);
    try {
      await axios.post('/api/exam/report-question', { questionType: 'exam', questionId: q.id, questionText: q.text, reason: reportReason || null });
      setReportSent(p => ({ ...p, [q.id]: true }));
      setReportOpen(false);
      setReportReason('');
    } catch {
      alert('Bildirim gönderilemedi, tekrar deneyin.');
    } finally {
      setReportSending(false);
    }
  };
  const sel = answers[q?.id];
  const answered = Object.values(answers).filter(v => v != null).length;
  const timerColor = timeLeft < 120 ? 'text-red-500' : timeLeft < 300 ? 'text-orange-500' : 'text-slate-800';

  return (
    <div className="max-w-2xl mx-auto min-h-screen flex flex-col bg-slate-50">
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
            <p className="text-slate-500 text-sm mb-4">{answered}/{questions.length} soru cevaplandı. Boş bırakılan sorular yanlış sayılır.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 font-semibold text-sm">Devam Et</button>
              <button onClick={() => { setShowConfirm(false); doSubmit(); }} disabled={submitting} className="flex-1 py-3 rounded-xl bg-purple-500 text-white font-semibold text-sm">Bitir</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40 px-4 pt-3 pb-2 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{state.subjectIcon}</span>
            <div>
              <div className="text-xs font-semibold text-slate-700">{state.subjectName}</div>
              <div className="text-xs text-slate-400">{currentIdx + 1}/{questions.length}</div>
            </div>
          </div>
          <div className={`text-2xl font-black tabular-nums ${timerColor}`}>{formatTime(timeLeft)}</div>
          <button onClick={() => setShowConfirm(true)} className="bg-purple-500 text-white text-xs px-3 py-2 rounded-xl font-semibold">Bitir</button>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-1.5">
          <div className="h-1.5 rounded-full bg-purple-500 transition-all" style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }} />
        </div>
      </div>

      {/* Soru */}
      <div className="flex-1 px-4 py-4">
        {q && (
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
            <div className="flex items-start gap-2 mb-4">
              <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0">{currentIdx + 1}</span>
              <p className="text-slate-800 text-sm leading-relaxed">{q.text}</p>
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

            <div className="mt-3 pt-3 border-t border-slate-100">
              {reportSent[q.id] ? (
                <p className="text-xs text-green-600">✓ Bildiriminiz alındı, teşekkürler.</p>
              ) : reportOpen ? (
                <div className="space-y-2">
                  <textarea value={reportReason} onChange={e => setReportReason(e.target.value)} placeholder="Neyin yanlış/belirsiz olduğunu kısaca yazabilirsin (opsiyonel)"
                    rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-300" />
                  <div className="flex gap-2">
                    <button onClick={() => setReportOpen(false)} className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold">Vazgeç</button>
                    <button onClick={sendReport} disabled={reportSending} className="flex-1 py-2 bg-red-500 text-white rounded-xl text-xs font-semibold disabled:opacity-50">
                      {reportSending ? 'Gönderiliyor...' : 'Bildir'}
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setReportOpen(true)} className="text-xs text-slate-400 hover:text-red-500">🚩 Bu soruda hata var mı?</button>
              )}
            </div>
          </div>
        )}

        {/* Navigasyon */}
        <div className="flex items-center justify-between gap-2">
          <button onClick={() => goToIndex(Math.max(0, currentIdx - 1))} disabled={currentIdx === 0}
            className="flex-1 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 disabled:opacity-30">← Önceki</button>
          {currentIdx < questions.length - 1 ? (
            <button onClick={() => goToIndex(currentIdx + 1)} className="flex-1 py-3 bg-purple-500 text-white rounded-xl text-sm font-semibold">Sonraki →</button>
          ) : (
            <button onClick={() => setShowConfirm(true)} className="flex-1 py-3 bg-green-500 text-white rounded-xl text-sm font-semibold">✓ Bitir</button>
          )}
        </div>

        {/* Soru grid */}
        <div className="mt-4 grid grid-cols-10 gap-1">
          {questions.map((question, i) => (
            <button key={question.id} onClick={() => goToIndex(i)}
              className={`h-7 rounded-lg text-xs font-bold transition-all ${i === currentIdx ? 'bg-purple-600 text-white' : answers[question.id] ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-400'}`}>
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
