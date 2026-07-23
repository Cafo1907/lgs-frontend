import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Explanation from '../../components/Explanation';
import GeneratingOverlay from '../../components/GeneratingOverlay';

interface Props { onLogout: () => void }

interface Question {
  id: number; topicId: number; topicName: string; text: string;
  optionA: string; optionB: string; optionC: string; optionD: string;
  difficulty: string; correctAnswer: string; userAnswer: string | null;
  explanation: string | null;
  timeSpentMs: number | null;
}
interface TimingEntry { orderIndex: number; topicName: string; timeSpentMs: number; status: 'correct' | 'wrong' | 'blank' }
interface ResultData {
  examId: number;
  subjectId: number;
  subjectName: string; subjectIcon: string;
  correct: number; wrong: number; blank: number; net: number; percentage: number;
  questions: Question[];
  personalBest: { isNewRecord: boolean; previousBest: number | null };
  timing: TimingEntry[];
}

function formatDuration(ms: number): string {
  const totalSec = Math.round(ms / 1000);
  const m = Math.floor(totalSec / 60), s = totalSec % 60;
  return m > 0 ? `${m} dk ${s} sn` : `${s} sn`;
}

export default function ResultPage({ onLogout }: Props) {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const [result, setResult] = useState<ResultData | null>(null);
  const [showWrongOnly, setShowWrongOnly] = useState(false);
  const [loadingExp, setLoadingExp] = useState<number | null>(null);
  const [openExp, setOpenExp] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingTopicId, setLoadingTopicId] = useState<number | null>(null);
  const [openTopicId, setOpenTopicId] = useState<number | null>(null);
  const [topicContent, setTopicContent] = useState<Record<number, string>>({});
  const [retrying, setRetrying] = useState(false);
  const [timeMapOpen, setTimeMapOpen] = useState(false);
  const [timeMapView, setTimeMapView] = useState<'question' | 'topic'>('question');

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
        timeSpentMs: wq.timeSpentMs ?? null,
      }));
      setResult({
        examId: d.examId,
        subjectId: d.subject.id,
        subjectName: d.subject.name,
        subjectIcon: d.subject.icon,
        correct: d.result?.correct ?? 0,
        wrong: d.result?.wrong ?? 0,
        blank: d.result?.blank ?? 0,
        net: d.result?.net ?? 0,
        percentage: d.result?.percentage ?? 0,
        questions: allQuestions,
        personalBest: d.personalBest ?? { isNewRecord: false, previousBest: null },
        timing: d.timing ?? [],
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

  const retryWrong = async () => {
    if (!result) return;
    setRetrying(true);
    try {
      const { data } = await axios.post('/api/exam/start', { subjectId: result.subjectId, retryFromExamId: result.examId });
      navigate(`/exam/${data.examId}`, { state: { questions: data.questions, timeLimit: data.timeLimit, subjectName: result.subjectName, subjectIcon: result.subjectIcon } });
    } catch (e: any) {
      alert(e.response?.data?.error || 'Tekrar sınavı başlatılamadı.');
    } finally {
      setRetrying(false);
    }
  };

  const toggleTopic = async (topicId: number) => {
    if (openTopicId === topicId) { setOpenTopicId(null); return; }
    if (topicContent[topicId]) { setOpenTopicId(topicId); return; }
    setLoadingTopicId(topicId);
    try {
      const { data } = await axios.post(`/api/subjects/topic/${topicId}/explain`);
      setTopicContent(prev => ({ ...prev, [topicId]: data.content }));
      setOpenTopicId(topicId);
    } catch { alert('Konu özeti yüklenemedi.'); }
    finally { setLoadingTopicId(null); }
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

  // Süre analizi: eski sınavlarda (bu özellikten önce alınmış) süre kaydı yok, o zaman hiç gösterme.
  const hasTiming = result.timing.some(t => t.timeSpentMs > 0);
  const avgMs = hasTiming ? result.timing.reduce((s, t) => s + t.timeSpentMs, 0) / result.timing.length : 0;
  const totalMs = result.timing.reduce((s, t) => s + t.timeSpentMs, 0);
  const slowest3 = [...result.timing].sort((a, b) => b.timeSpentMs - a.timeSpentMs).slice(0, 3);
  const topicTimeMap = new Map<string, { total: number; count: number; wrong: number }>();
  for (const t of result.timing) {
    const cur = topicTimeMap.get(t.topicName) ?? { total: 0, count: 0, wrong: 0 };
    cur.total += t.timeSpentMs; cur.count++;
    if (t.status !== 'correct') cur.wrong++;
    topicTimeMap.set(t.topicName, cur);
  }
  const topicTimes = [...topicTimeMap.entries()]
    .map(([topicName, v]) => ({ topicName, avgMs: v.total / v.count, count: v.count, wrong: v.wrong }))
    .sort((a, b) => b.avgMs - a.avgMs);
  const maxTiming = Math.max(1, ...result.timing.map(t => t.timeSpentMs));
  const maxTopicAvg = Math.max(1, ...topicTimes.map(t => t.avgMs));
  const grade = result.percentage >= 80 ? { label: 'Mükemmel!', color: 'text-green-600', bg: 'bg-green-50' }
    : result.percentage >= 60 ? { label: 'İyi!', color: 'text-blue-600', bg: 'bg-blue-50' }
    : result.percentage >= 40 ? { label: 'Gelişiyor', color: 'text-orange-600', bg: 'bg-orange-50' }
    : { label: 'Çalış!', color: 'text-red-600', bg: 'bg-red-50' };

  return (
    <div className="max-w-2xl mx-auto min-h-screen bg-slate-50 pb-8">
      {retrying && <GeneratingOverlay icon="🔁" title="Tekrar Sınavı Hazırlanıyor" />}
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
        {result.personalBest.isNewRecord && (
          <div className="bg-gradient-to-r from-amber-400 to-amber-500 rounded-2xl p-3 mb-4 text-center">
            <p className="text-white font-bold text-sm">🏆 Yeni Kişisel Rekor! Önceki en iyi netin: {result.personalBest.previousBest?.toFixed(1)}</p>
          </div>
        )}
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
        {wrongQuestions.length > 0 && (
          <button onClick={retryWrong} disabled={retrying}
            className="w-full mt-2 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-sm disabled:opacity-60">
            🔁 Yanlışlarımı Tekrar Çöz
          </button>
        )}
      </div>

      {/* Süre analizi */}
      {hasTiming && (
        <div className="px-4 mt-4">
          <div className="bg-white rounded-2xl shadow-sm p-4 border-l-4 border-purple-400">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">⏱</span>
              <span className="font-bold text-slate-800 text-sm">Zaman Analizi</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <div className="text-lg font-black text-purple-600">{formatDuration(avgMs)}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Soru Başı Ortalama</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <div className="text-lg font-black text-slate-700">{formatDuration(totalMs)}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Toplam Süre</div>
              </div>
            </div>
            <div className="text-xs font-semibold text-slate-500 mb-1.5">En Çok Zaman Harcanan Sorular</div>
            <div className="space-y-1.5 mb-3">
              {slowest3.map(t => (
                <div key={t.orderIndex} className="flex items-center justify-between text-xs bg-slate-50 rounded-lg px-3 py-2">
                  <span className="text-slate-600">Soru {t.orderIndex} <span className="text-slate-400">— {t.topicName}</span></span>
                  <span className="font-bold text-purple-600">{formatDuration(t.timeSpentMs)}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setTimeMapOpen(v => !v)} className="w-full text-xs font-semibold text-purple-600 py-1">
              {timeMapOpen ? 'Detaylı Zaman Haritasını Gizle ▲' : 'Detaylı Zaman Haritasını Göster ▼'}
            </button>
            {timeMapOpen && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="flex gap-1.5 bg-slate-50 p-1 rounded-lg mb-3">
                  <button onClick={() => setTimeMapView('question')}
                    className={`flex-1 py-1.5 rounded-md text-xs font-bold ${timeMapView === 'question' ? 'bg-purple-600 text-white' : 'text-slate-500'}`}>
                    Soru Bazlı
                  </button>
                  <button onClick={() => setTimeMapView('topic')}
                    className={`flex-1 py-1.5 rounded-md text-xs font-bold ${timeMapView === 'topic' ? 'bg-purple-600 text-white' : 'text-slate-500'}`}>
                    Konu Bazlı
                  </button>
                </div>
                {timeMapView === 'question' ? (
                  <div className="space-y-1.5">
                    {result.timing.map(t => {
                      const pct = Math.round((t.timeSpentMs / maxTiming) * 100);
                      const barColor = t.status === 'correct' ? 'bg-green-500' : t.status === 'wrong' ? 'bg-red-500' : 'bg-slate-300';
                      return (
                        <div key={t.orderIndex} className="flex items-center gap-2">
                          <span className="w-5 text-[10px] text-slate-400 text-right flex-shrink-0">{t.orderIndex}</span>
                          <div className="flex-1 bg-slate-100 rounded h-3 overflow-hidden">
                            <div className={`h-full rounded ${barColor}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-14 text-[10px] text-slate-400 flex-shrink-0">{formatDuration(t.timeSpentMs)}</span>
                        </div>
                      );
                    })}
                    <div className="flex gap-3 mt-2 text-[10px] text-slate-400">
                      <span><span className="inline-block w-2 h-2 rounded-sm bg-green-500 mr-1" />Doğru</span>
                      <span><span className="inline-block w-2 h-2 rounded-sm bg-red-500 mr-1" />Yanlış</span>
                      <span><span className="inline-block w-2 h-2 rounded-sm bg-slate-300 mr-1" />Boş</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {topicTimes.map(t => {
                      const pct = Math.round((t.avgMs / maxTopicAvg) * 100);
                      const overPct = Math.round((avgMs / maxTopicAvg) * 100);
                      const slow = t.avgMs > avgMs * 1.5;
                      return (
                        <div key={t.topicName}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-slate-700">{t.topicName} <span className="text-slate-400">({t.count} soru{t.wrong ? `, ${t.wrong} yanlış/boş` : ''})</span></span>
                            <span className={`font-bold ${slow ? 'text-red-500' : 'text-slate-700'}`}>{formatDuration(t.avgMs)}</span>
                          </div>
                          <div className="bg-slate-100 rounded h-2.5 relative overflow-hidden">
                            <div className={`h-full rounded ${slow ? 'bg-red-500' : 'bg-purple-500'}`} style={{ width: `${pct}%` }} />
                            <div className="absolute top-0 bottom-0 w-0.5 bg-slate-400/50" style={{ left: `${overPct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

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
                {hasTiming && q.timeSpentMs !== null && q.timeSpentMs > 0 && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${q.timeSpentMs > avgMs * 2 ? 'bg-amber-100 text-amber-700' : 'bg-purple-50 text-purple-600'}`}>
                    ⏱ {formatDuration(q.timeSpentMs)}
                  </span>
                )}
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
                <div className="mt-2 bg-purple-50 rounded-xl p-3 text-xs text-purple-800">
                  <Explanation text={q.explanation} />
                </div>
              )}

              <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs text-amber-800 flex-1">
                    📘 <strong>{q.topicName}</strong> konusunda gelişmen gerektiğine inanıyoruz.
                  </p>
                  <button onClick={() => toggleTopic(q.topicId)} disabled={loadingTopicId === q.topicId}
                    className="text-xs bg-amber-200 text-amber-800 font-semibold px-2 py-1 rounded-lg disabled:opacity-50 whitespace-nowrap">
                    {loadingTopicId === q.topicId ? '⏳ Hazırlanıyor...' : openTopicId === q.topicId ? 'Gizle ▲' : 'Konuyu Öğren'}
                  </button>
                </div>
                {openTopicId === q.topicId && topicContent[q.topicId] && (
                  <div className="mt-2 text-xs text-amber-900 border-t border-amber-200 pt-2">
                    <Explanation text={topicContent[q.topicId]} />
                  </div>
                )}
              </div>
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
