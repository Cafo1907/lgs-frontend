import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface Question {
  id: number; subjectId: number; subjectName: string; subjectIcon: string;
  topicName: string; orderIndex: number; text: string;
  optionA: string; optionB: string; optionC: string; optionD: string; difficulty: string;
}

interface Props { onDone: (result: any) => void }

const TIME_LIMIT = 8100; // 135 dk

export default function StandardExamPage({ onDone }: Props) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string | null>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    axios.get('/api/placement/standard').then(r => {
      setQuestions(r.data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); handleSubmit(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [questions]);

  const handleAnswer = (questionId: number, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: prev[questionId] === answer ? null : answer }));
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    clearInterval(timerRef.current);
    const answerList = questions.map(q => ({ questionId: q.id, answer: answers[q.id] ?? null }));
    try {
      const { data } = await axios.post('/api/placement/standard/submit', { answers: answerList });
      onDone(data);
    } catch {
      alert('Gönderim hatası, tekrar dene.');
      setSubmitting(false);
    }
  };

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-purple-500 border-t-transparent" />
    </div>
  );

  // Ders grupları
  const subjects = [...new Map(questions.map(q => [q.subjectId, { id: q.subjectId, name: q.subjectName, icon: q.subjectIcon }])).values()];
  const currentQ = questions[currentIndex];
  const answeredCount = Object.values(answers).filter(v => v !== null && v !== undefined).length;

  return (
    <div className="max-w-2xl mx-auto min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center gap-2 text-purple-200 text-xs mb-2">
          <span className="bg-purple-200 text-purple-700 rounded-full w-5 h-5 flex items-center justify-center font-bold">1</span>
          <span className="text-slate-400">Geçmiş</span>
          <span className="text-slate-300 mx-1">→</span>
          <span className="bg-purple-600 text-white rounded-full w-5 h-5 flex items-center justify-center font-bold">2</span>
          <span className="text-purple-700 font-semibold">Seviye Sınavı</span>
          <span className="text-slate-300 mx-1">→</span>
          <span className="bg-slate-200 text-slate-500 rounded-full w-5 h-5 flex items-center justify-center font-bold">3</span>
          <span className="text-slate-400">Karşılaştırma</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-slate-700">{currentQ?.subjectIcon} {currentQ?.subjectName}</span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">{answeredCount}/{questions.length}</span>
            <span className={`font-mono text-sm font-bold ${timeLeft < 600 ? 'text-red-500' : 'text-purple-600'}`}>{formatTime(timeLeft)}</span>
          </div>
        </div>
        {/* Konu gezinti */}
        <div className="flex gap-1 mt-2 overflow-x-auto">
          {subjects.map(s => {
            const subjectQs = questions.filter(q => q.subjectId === s.id);
            const firstIdx = questions.indexOf(subjectQs[0]!);
            const answered = subjectQs.filter(q => answers[q.id] != null).length;
            return (
              <button key={s.id} onClick={() => setCurrentIndex(firstIdx)}
                className={`flex-shrink-0 px-2 py-1 rounded-lg text-xs font-semibold ${currentQ?.subjectId === s.id ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {s.icon} {answered}/{subjectQs.length}
              </button>
            );
          })}
        </div>
      </div>

      {/* Soru */}
      {currentQ && (
        <div className="px-4 mt-4">
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-3">
            <div className="text-xs text-slate-400 mb-2">{currentIndex + 1}. Soru · {currentQ.topicName}</div>
            <p className="text-slate-800 text-sm leading-relaxed">{currentQ.text}</p>
          </div>
          <div className="space-y-2">
            {(['A', 'B', 'C', 'D'] as const).map(opt => {
              const text = currentQ[`option${opt}` as keyof Question] as string;
              const selected = answers[currentQ.id] === opt;
              return (
                <button key={opt} onClick={() => handleAnswer(currentQ.id, opt)}
                  className={`w-full px-4 py-3 rounded-2xl text-sm text-left font-medium transition-all ${selected ? 'bg-purple-600 text-white shadow-md' : 'bg-white text-slate-700 shadow-sm hover:bg-purple-50'}`}>
                  <span className="font-bold mr-2">{opt})</span>{text}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => setCurrentIndex(i => Math.max(0, i - 1))} disabled={currentIndex === 0}
              className="flex-1 py-3 bg-white text-slate-600 rounded-2xl font-semibold text-sm shadow-sm disabled:opacity-40">
              ← Önceki
            </button>
            <button onClick={() => setCurrentIndex(i => Math.min(questions.length - 1, i + 1))} disabled={currentIndex === questions.length - 1}
              className="flex-1 py-3 bg-white text-slate-600 rounded-2xl font-semibold text-sm shadow-sm disabled:opacity-40">
              Sonraki →
            </button>
          </div>
        </div>
      )}

      {/* Gönder butonu */}
      <div className="fixed bottom-4 left-0 right-0 px-4 max-w-2xl mx-auto">
        <button onClick={handleSubmit} disabled={submitting}
          className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl shadow-lg transition-all disabled:opacity-50">
          {submitting ? '⏳ Hesaplanıyor...' : `Sınavı Bitir (${answeredCount}/${questions.length} cevaplandı)`}
        </button>
      </div>
    </div>
  );
}
