import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Subject { id: number; name: string; code: string; color: string; icon: string }
interface ExamSummary { id: number; subjectName: string; subjectIcon: string; finishedAt: string; isRetry: boolean; result?: { correct: number; wrong: number; net: number; percentage: number } }
interface MockStatus { isAvailable: boolean; monthYear: string; nextExamDate: string; existingExam: { id: number; finished: boolean } | null }
interface Props { user: { name: string }; onLogout: () => void }

const TIME_LIMITS: Record<string, number> = { TUR: 1500, MAT: 1500, FEN: 1200, SOS: 1200, DIN: 900, ING: 900 };

export default function StudentHome({ user, onLogout }: Props) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [recentExams, setRecentExams] = useState<ExamSummary[]>([]);
  const [starting, setStarting] = useState<number | null>(null);
  const [mockStatus, setMockStatus] = useState<MockStatus | null>(null);
  const [startingMock, setStartingMock] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/api/subjects').then(r => setSubjects(r.data));
    axios.get('/api/exam/history').then(r => setRecentExams(r.data.slice(0, 6)));
    axios.get('/api/mock-exam/status').then(r => setMockStatus(r.data)).catch(() => {});
  }, []);

  const startExam = async (subject: Subject) => {
    setStarting(subject.id);
    try {
      const { data } = await axios.post('/api/exam/start', { subjectId: subject.id, timeLimit: TIME_LIMITS[subject.code] || 1200 });
      navigate(`/exam/${data.examId}`, { state: { questions: data.questions, timeLimit: data.timeLimit, subjectName: subject.name, subjectIcon: subject.icon } });
    } catch { alert('Sınav başlatılamadı.'); }
    finally { setStarting(null); }
  };

  const startMock = async () => {
    setStartingMock(true);
    try {
      const { data } = await axios.post('/api/mock-exam/generate');
      navigate('/mock-exam', { state: { examId: data.examId, timeLimitSeconds: data.timeLimitSeconds, questions: data.questions } });
    } catch (e: any) { alert(e.response?.data?.error || 'Deneme başlatılamadı.'); }
    finally { setStartingMock(false); }
  };

  const today = new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="max-w-md mx-auto min-h-screen pb-8">
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 pt-12 pb-8 text-white">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-purple-100 text-sm">{today}</p>
            <h1 className="text-2xl font-bold mt-1">Merhaba, {user.name}! 👋</h1>
            <p className="text-purple-100 text-sm mt-1">Bugün hangi dersi çalışıyoruz?</p>
          </div>
          <button onClick={onLogout} className="bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-all">Çıkış →</button>
        </div>
      </div>

      <div className="px-4 -mt-4">
        {/* Aylık deneme kartı */}
        {mockStatus && (
          <div className="mb-4">
            {mockStatus.isAvailable && !mockStatus.existingExam?.finished ? (
              <button onClick={startMock} disabled={startingMock}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-2xl p-4 text-left shadow-md hover:shadow-lg active:scale-95 transition-all disabled:opacity-60">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1"><span className="text-2xl">🏆</span><span className="font-bold text-base">Aylık Deneme Sınavı</span></div>
                    <p className="text-purple-200 text-xs">90 soru · 135 dakika · Tüm dersler</p>
                  </div>
                  {startingMock ? <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full" /> : <span className="text-white text-xl">›</span>}
                </div>
              </button>
            ) : mockStatus.existingExam?.finished ? (
              <div className="w-full bg-green-50 border border-green-200 rounded-2xl p-3 flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <div><p className="font-semibold text-green-800 text-sm">Bu ayın denemesi tamamlandı</p><p className="text-green-600 text-xs">Sonuçlar veli panelinde mevcut</p></div>
              </div>
            ) : (
              <div className="w-full bg-slate-100 rounded-2xl p-3 flex items-center gap-3">
                <span className="text-2xl">📅</span>
                <div><p className="font-semibold text-slate-600 text-sm">Aylık Deneme Sınavı</p>
                  <p className="text-slate-400 text-xs">Sonraki: {new Date(mockStatus.nextExamDate + 'T12:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Ders kartları */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {subjects.map(subject => (
            <button key={subject.id} onClick={() => startExam(subject)} disabled={starting !== null}
              className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-left hover:shadow-md active:scale-95 transition-all disabled:opacity-60">
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl">{subject.icon}</span>
                {starting === subject.id && <div className="animate-spin h-5 w-5 border-2 border-purple-500 border-t-transparent rounded-full" />}
              </div>
              <div className="font-semibold text-slate-800 text-sm">{subject.name}</div>
              <div className="text-xs text-slate-400 mt-1">20 soru</div>
              <div className="mt-2 h-1 rounded-full" style={{ backgroundColor: subject.color, opacity: 0.3 }} />
            </button>
          ))}
        </div>

        {/* Son sınavlar */}
        {recentExams.length > 0 && (
          <div>
            <h2 className="text-slate-600 font-semibold text-sm mb-3">Son Sınavlar</h2>
            <div className="space-y-2">
              {recentExams.map(exam => (
                <button key={exam.id} onClick={() => navigate(`/result/${exam.id}`)}
                  className="w-full bg-white rounded-xl p-3 shadow-sm flex items-center gap-3 hover:shadow-md active:scale-95 transition-all">
                  <span className="text-2xl">{exam.subjectIcon}</span>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-slate-800 text-sm">{exam.subjectName}</div>
                    <div className="text-xs text-slate-400">{new Date(exam.finishedAt).toLocaleDateString('tr-TR')}</div>
                  </div>
                  {exam.result && (
                    <div className="text-right">
                      <div className={`text-sm font-bold ${exam.result.percentage >= 70 ? 'text-green-500' : exam.result.percentage >= 50 ? 'text-orange-500' : 'text-red-500'}`}>%{exam.result.percentage}</div>
                      <div className="text-xs text-slate-400">Net: {exam.result.net.toFixed(1)}</div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
