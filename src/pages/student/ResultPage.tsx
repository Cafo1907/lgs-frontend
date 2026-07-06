import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

interface Props { onLogout: () => void }

interface Question {
  id: number; topicId: number; topicName: string; text: string;
  optionA: string; optionB: string; optionC: string; optionD: string;
  difficulty: string; correctAnswer: string; userAnswer: string | null;
  explanation: string | null;
}
interface ResultData {
  examId: number;
  subjectName: string; subjectIcon: string;
  correct: number; wrong: number; blank: number; net: number; percentage: number;
  questions: Question[];
}

export default function ResultPage({ onLogout }: Props) {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const [result, setResult] = useState<ResultData | null>(null);
  const [showWrongOnly, setShowWrongOnly] = useState(false);
  const [loadingExp, setLoadingExp] = useState<number | null>(null);
  const [openExp, setOpenExp] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!examId) return;
    axios.get(`/api/exam/${examId}/result`).then(r => {
      const d = r.data;
      // Backend: { examId, subject, result, wrongQuestions }
      // wrongQuestions: [{ question, correctAnswer, studentAnswer, explanation }]
      const allQuestions: Question[] = d.wrongQuestions.map((wq: any) => ({
        id: wq.question.id,
        topicId: wq.question.topicId,
        topicName: wq.question.topicName,
        text: wq.question.text,
        optionA: wq.question.optionA,
        optionB: wq.question.optionB,
        optionC: wq.question.optionC,
        optionD: wq.question.optionD,
        difficulty: wq.question.difficulty,
        correctAnswer: wq.correctAnswer,
        userAnswer: wq.studentAnswer,
        explanation: wq.explanation,
      }));
      setResult({
        examId: d.examId,
        subjectName: d.subject.name,
        subjectIcon: d.subject.icon,
        correct: d.result?.correct ?? 0,
        wrong: d.result?.wrong ?? 0,
        blank: d.result?.blank ?? 0,
        net: d.result?.net ?? 0,
        percentage: d.result?.percentage ?? 0,
        questions: allQuestions,
      });
    }).catch(() => navigate('/')).finally(() => setLoading(false));
  }, [examId, navigate]);

  const toggleExplanation = async (questionId: number, hasExp: boolean) => {
    if (openExp.has(questionId)) {
      setOpenExp(prev => { const s = new Set(prev); s.delete(questionId); return s; });
      return;
    }
    if (hasExp) { setOpenExp(prev => new Set(prev).add(questionId)); return; }
    // DB'de yoksa AI'dan üret
    setLoadingExp(questionId);
    try {
      const { data } = await axios.post(`/api/exam/${examId}/explain/${questionId}`);
      setResult(prev => prev ? ({
        ...prev,
        questions: prev.questions.map(q => q.id === questionId ? { ...q, explanation: data.explanation } : q)
      }) : prev);
      setOpenExp(prev => new Set(prev).add(questionId));
    } catch { alert('Çözüm yüklenemedi.'); }
    finally { setLoadingExp(null); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-purple-500 border-t-transparent" />
    </div>
  );
  if (!result) return null;

  const wrongQuestions = result.questions.filter(q => q.userAnswer !== null && q.userAnswer !== q.correctAnswer);
  const blankQuestions = result.questions.filter(q => q.userAnswer === null);
  const allBadQuestions = result.questions; // backend zaten yanlış+boş döndürüyor
  const displayQuestions = showWrongOnly ? wrongQuestions : allBadQuestions;
  const grade = result.percentage >= 80 ? { label: 'Mükemmel!', color: 'text-green-600', bg: 'bg-green-50' }
    : result.percentage >= 60 ? { label: 'İyi!', color: 'text-blue-600', bg: 'bg-blue-50' }
    : result.percentage >= 40 ? { label: 'Gelişiyor', color: 'text-orange-600', bg: 'bg-orange-50' }
    : { label: 'Çalış!', color: 'text-red-600', bg: 'bg-red-50' };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 pb-8">
      {/* Sonuç kartı */}
      <div className="bg-white shadow-sm px-4 pt-6 pb-6">
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => navigate('/')} className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all">← Ana Sayfa</button>
          <button onClick={onLogout} className="bg-red-50 hover:bg-red-100 text-red-500 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all">Çıkış →</button>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl">{result.subjectIcon}</span>
          <div>
            <div className="font-bold text-slate-800">{result.subjectName}</div>
            <div className={`text-sm font-semibold ${grade.color}`}>{grade.label}</div>
          </div>
        </div>
        <div className={`${grade.bg} rounded-2xl p-4 grid grid-cols-4 gap-2 text-center mb-4`}>
          <div><div className="text-2xl font-black text-green-600">{result.correct}</div><div className="text-xs text-slate-500">Doğru</div></div>
          <div><div className="text-2xl font-black text-red-500">{result.wrong}</div><div className="text-xs text-slate-500">Yanlış</div></div>
          <div><div className="text-2xl font-black text-slate-400">{result.blank}</div><div className="text-xs text-slate-500">Boş</div></div>
          <div><div className="text-2xl font-black text-purple-600">{result.net.toFixed(1)}</div><div className="text-xs text-slate-500">Net</div></div>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3 mb-1">
          <div className="h-3 rounded-full bg-purple-500 transition-all" style={{ width: `${result.percentage}%` }} />
        </div>
        <div className="text-center text-sm font-bold text-purple-600">%{result.percentage}</div>
        <div className="flex gap-2 mt-4">
          <button onClick={() => navigate('/')} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold text-sm">📚 Başka Ders</button>
          {wrongQuestions.length > 0 && (
            <button onClick={() => setShowWrongOnly(v => !v)}
              className={`flex-1 py-3 rounded-xl font-semibold text-sm ${showWrongOnly ? 'bg-red-500 text-white' : 'bg-red-50 text-red-600'}`}>
              {showWrongOnly ? 'Tümünü Göster' : `Sadece Yanlış (${wrongQuestions.length})`}
            </button>
          )}
        </div>
      </div>

      {/* Yanlış sorular */}
      {displayQuestions.length > 0 ? (
        <div className="px-4 mt-4 space-y-3">
          <h2 className="text-slate-600 font-semibold text-sm">
            {showWrongOnly ? `Yanlış Sorular (${wrongQuestions.length})` : `Yanlış ve Boş Sorular (${wrongQuestions.length} yanlış · ${blankQuestions.length} boş)`}
          </h2>
          {displayQuestions.map(q => {
            const isBlank = q.userAnswer === null;
            return (
            <div key={q.id} className={`bg-white rounded-2xl shadow-sm p-4 border-l-4 ${isBlank ? 'border-slate-300' : 'border-red-400'}`}>
              <div className="flex items-start justify-between gap-2 mb-3">
                <p className="text-slate-800 text-sm leading-relaxed flex-1">{q.text}</p>
                <span className={`text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0 ${isBlank ? 'bg-slate-100 text-slate-500' : 'bg-red-100 text-red-600'}`}>
                  {isBlank ? 'Boş' : '✗'}
                </span>
              </div>
              <div className="space-y-1.5">
                {(['A', 'B', 'C', 'D'] as const).map(opt => {
                  const text = q[`option${opt}` as keyof Question] as string;
                  const isCorrect = opt === q.correctAnswer;
                  const isUser = opt === q.userAnswer;
                  return (
                    <div key={opt} className={`px-3 py-2 rounded-xl text-xs ${isCorrect ? 'bg-green-100 text-green-800 font-semibold' : isUser ? 'bg-red-100 text-red-700 line-through' : 'text-slate-400'}`}>
                      <span className="font-bold mr-1">{opt})</span>{text}
                      {isCorrect && ' ✓'}{isUser && !isCorrect && ' ✗'}
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-400">{q.topicName}</span>
                {q.explanation && !openExp.has(q.id) ? (
                  <button onClick={() => toggleExplanation(q.id, true)}
                    className="ml-auto text-xs bg-purple-100 text-purple-700 font-semibold px-2 py-1 rounded-lg">
                    📖 Çözümü Gör
                  </button>
                ) : openExp.has(q.id) ? (
                  <button onClick={() => toggleExplanation(q.id, true)}
                    className="ml-auto text-xs text-slate-400 underline">
                    Gizle ▲
                  </button>
                ) : (
                  <button onClick={() => toggleExplanation(q.id, false)} disabled={loadingExp === q.id}
                    className="ml-auto text-xs bg-slate-100 text-slate-600 font-semibold px-2 py-1 rounded-lg disabled:opacity-50">
                    {loadingExp === q.id ? '⏳ Hazırlanıyor...' : '📖 Çözümü Anlat'}
                  </button>
                )}
              </div>
              {openExp.has(q.id) && q.explanation && (
                <div className="mt-2 bg-purple-50 rounded-xl p-3 text-xs text-purple-800 leading-relaxed space-y-2">
                  {q.explanation
                    .replace(/#{1,3}\s*/g, '').replace(/\*\*/g, '').replace(/\*/g, '').replace(/---/g, '')
                    .split(/(?<=[.!?])\s+/)
                    .filter(s => s.trim().length > 0)
                    .map((sentence, i) => <p key={i}>{sentence.trim()}</p>)
                  }
                </div>
              )}
            </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-5xl mb-3">🎉</div>
          <p className="text-slate-600 font-semibold">Tüm soruları doğru yaptın!</p>
        </div>
      )}
    </div>
  );
}
