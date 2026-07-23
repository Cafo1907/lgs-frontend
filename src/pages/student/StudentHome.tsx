import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Explanation from '../../components/Explanation';
import GeneratingOverlay from '../../components/GeneratingOverlay';
import Countdown from '../../components/Countdown';
import PlacementSummaryCard from '../../components/PlacementSummaryCard';

const LGS_EXAM_DATE = new Date('2027-06-01T00:00:00+03:00');

interface Subject { id: number; name: string; code: string; color: string; icon: string }
interface ExamSummary { id: number; subjectName: string; subjectIcon: string; finishedAt: string; isRetry: boolean; result?: { correct: number; wrong: number; net: number; percentage: number } }
interface MockStatus { isAvailable: boolean; windowOpen: boolean; windowStartHour: number; windowEndHour: number; periodKey: string; nextExamDate: string; existingExam: { id: number; started: boolean; finished: boolean } | null }
interface WeakTopic { topicId: number; topicName: string; kazanimCode: string; subjectName: string; subjectIcon: string; weaknessScore: number }
interface Badge { id: string; icon: string; title: string; description: string; earned: boolean }
interface Gamification { studentId: number; currentStreak: number; longestStreak: number; totalExamsCompleted: number; totalQuestionsAnswered: number; badges: Badge[]; earnedCount: number; totalCount: number }
interface Leaderboard { available: boolean; rank: number | null; poolSize: number; percentile: number | null; scope: 'branch' | 'all' }
interface DailyGoal { target: number; answered: number; completed: boolean }
interface TargetProgress {
  hasTarget: boolean; schoolName?: string; requiredScore?: number; requiredNet?: number;
  currentScore?: number | null; currentNet?: number | null; source?: 'mock' | 'placement' | 'manual' | null;
  scoreGap?: number | null; netGap?: number | null;
}
interface Props { user: { name: string; branding?: { logoUrl: string | null; slogan: string | null; brandColor: string | null } | null }; onLogout: () => void }

const TIME_LIMITS: Record<string, number> = { TUR: 1500, MAT: 1500, FEN: 1200, SOS: 1200, DIN: 900, ING: 900 };

function seenBadgesKey(studentId: number) { return `hedefimlgs_seenBadges_${studentId}`; }

function BadgeCelebration({ badge, onClose }: { badge: Badge; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 20); return () => clearTimeout(t); }, []);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        className={`relative bg-white rounded-3xl p-8 text-center max-w-xs w-full shadow-2xl transition-all duration-300 ${mounted ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}>
        <span className="absolute -top-2 left-6 text-2xl animate-bounce" style={{ animationDelay: '0ms' }}>🎉</span>
        <span className="absolute -top-4 right-8 text-2xl animate-bounce" style={{ animationDelay: '150ms' }}>✨</span>
        <span className="absolute -top-1 right-1/2 text-xl animate-bounce" style={{ animationDelay: '300ms' }}>🎊</span>
        <p className="text-xs font-bold text-purple-500 uppercase tracking-wide mb-2">Yeni Rozet Kazandın!</p>
        <div className="text-6xl mb-3">{badge.icon}</div>
        <h2 className="font-black text-lg text-slate-800">{badge.title}</h2>
        <p className="text-slate-400 text-sm mt-1">{badge.description}</p>
        <button onClick={onClose} className="mt-5 w-full py-3 bg-purple-500 text-white rounded-xl text-sm font-semibold active:scale-95 transition-all">
          Harika! 🙌
        </button>
      </div>
    </div>
  );
}

export default function StudentHome({ user, onLogout }: Props) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [recentExams, setRecentExams] = useState<ExamSummary[]>([]);
  const [starting, setStarting] = useState<number | null>(null);
  const [mockStatus, setMockStatus] = useState<MockStatus | null>(null);
  const [startingMock, setStartingMock] = useState(false);
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([]);
  const [openTopicId, setOpenTopicId] = useState<number | null>(null);
  const [topicContent, setTopicContent] = useState<Record<number, string>>({});
  const [loadingTopicId, setLoadingTopicId] = useState<number | null>(null);
  const [gamification, setGamification] = useState<Gamification | null>(null);
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [celebrationQueue, setCelebrationQueue] = useState<Badge[]>([]);
  const [dailyGoal, setDailyGoal] = useState<DailyGoal | null>(null);
  const [targetProgress, setTargetProgress] = useState<TargetProgress | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/api/subjects').then(r => setSubjects(r.data));
    axios.get('/api/exam/history').then(r => setRecentExams(r.data.slice(0, 6)));
    axios.get('/api/mock-exam/status').then(r => setMockStatus(r.data)).catch(() => {});
    axios.get('/api/subjects/weak-topics').then(r => setWeakTopics(r.data)).catch(() => {});
    axios.get('/api/student/leaderboard').then(r => setLeaderboard(r.data)).catch(() => {});
    axios.get('/api/student/daily-goal').then(r => setDailyGoal(r.data)).catch(() => {});
    axios.get('/api/student/target-progress').then(r => setTargetProgress(r.data)).catch(() => {});
    axios.get('/api/student/gamification').then(r => {
      const data: Gamification = r.data;
      setGamification(data);

      const key = seenBadgesKey(data.studentId);
      const seen = new Set<string>(JSON.parse(localStorage.getItem(key) || '[]'));
      const earned = data.badges.filter(b => b.earned);
      const newlyEarned = earned.filter(b => !seen.has(b.id));

      localStorage.setItem(key, JSON.stringify(earned.map(b => b.id)));
      if (newlyEarned.length > 0) setCelebrationQueue(newlyEarned);
    }).catch(() => {});
  }, []);

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

  const startExam = async (subject: Subject) => {
    setStarting(subject.id);
    try {
      const { data } = await axios.post('/api/exam/start', { subjectId: subject.id, timeLimit: TIME_LIMITS[subject.code] || 1200 });
      navigate(`/exam/${data.examId}`, { state: { questions: data.questions, timeLimit: data.timeLimit, subjectName: subject.name, subjectIcon: subject.icon } });
    } catch (e: any) { alert(e.response?.data?.error || 'Sınav başlatılamadı.'); }
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
  const startingSubject = subjects.find(s => s.id === starting);

  return (
    <div className="max-w-2xl mx-auto min-h-screen pb-8">
      {startingSubject && <GeneratingOverlay icon={startingSubject.icon} title={`${startingSubject.name} Sınavı Hazırlanıyor`} />}
      {startingMock && <GeneratingOverlay icon="🏆" title="Deneme Sınavı Hazırlanıyor" />}
      <div className={`px-6 pt-12 pb-8 text-white ${user.branding?.brandColor ? '' : 'bg-gradient-to-r from-purple-600 to-purple-700'}`}
        style={user.branding?.brandColor ? { background: `linear-gradient(to right, ${user.branding.brandColor}, ${user.branding.brandColor}dd)` } : undefined}>
        <div className="flex justify-between items-start">
          <div>
            {user.branding?.logoUrl && <img src={user.branding.logoUrl} alt="Kurum logosu" className="h-8 mb-1.5 rounded bg-white/90 px-2 py-1 object-contain" />}
            <p className="text-purple-100 text-sm">{today}</p>
            <h1 className="text-2xl font-bold mt-1">Merhaba, {user.name}! 👋</h1>
            <p className="text-purple-100 text-sm mt-1">{user.branding?.slogan || 'Bugün hangi dersi çalışıyoruz?'}</p>
          </div>
          <button onClick={onLogout} className="bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-all">Çıkış →</button>
        </div>
        {gamification && gamification.currentStreak > 0 && (
          <div className="mt-3 inline-flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1.5">
            <span className="text-lg">🔥</span>
            <span className="text-sm font-bold text-white">{gamification.currentStreak} gün seri</span>
          </div>
        )}
      </div>

      <div className="px-4 -mt-4">
        {/* Günlük hedef */}
        {dailyGoal && (
          <div className="mb-4 bg-white rounded-2xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                🎯 Günlük Hedef {dailyGoal.completed && <span className="text-green-500">✓</span>}
              </span>
              <span className="text-xs text-slate-400">{dailyGoal.answered}/{dailyGoal.target} soru</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5">
              <div className={`h-2.5 rounded-full transition-all ${dailyGoal.completed ? 'bg-green-500' : 'bg-purple-500'}`}
                style={{ width: `${Math.min(100, (dailyGoal.answered / dailyGoal.target) * 100)}%` }} />
            </div>
            {dailyGoal.completed && <p className="text-xs text-green-600 font-medium mt-1.5">Bugünkü hedefini tamamladın, harika! 🎉</p>}
          </div>
        )}

        <div className="mb-4"><PlacementSummaryCard /></div>

        {/* Hızlı erişim */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button onClick={() => navigate('/topic-map')}
            className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100 flex items-center gap-2.5 hover:shadow-md active:scale-95 transition-all">
            <span className="text-2xl">🗺️</span>
            <span className="text-sm font-semibold text-slate-700 text-left">Konu Haritam</span>
          </button>
          <button onClick={() => navigate('/weekly-summary')}
            className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100 flex items-center gap-2.5 hover:shadow-md active:scale-95 transition-all">
            <span className="text-2xl">📊</span>
            <span className="text-sm font-semibold text-slate-700 text-left">Haftalık Özetim</span>
          </button>
        </div>

        {/* Geri sayımlar */}
        <div className="mb-4 space-y-3">
          {mockStatus && !mockStatus.isAvailable && !mockStatus.existingExam?.finished && (
            <Countdown
              icon="🏆"
              title="Sıradaki Deneme Sınavına"
              subtitle={`${new Date(mockStatus.nextExamDate + 'T10:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })}, saat 10:00`}
              target={new Date(mockStatus.nextExamDate + 'T10:00:00')}
              accent="text-purple-700"
            />
          )}
          <Countdown
            icon="🎓"
            title="LGS Sınavına"
            subtitle="Tahmini tarih: 1 Haziran 2027"
            target={LGS_EXAM_DATE}
            accent="text-red-500"
          />
        </div>

        {/* Hedef lise takibi */}
        {targetProgress?.hasTarget && (
          <div className="mb-4 bg-white rounded-2xl shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🏫</span>
              <div>
                <div className="text-sm font-semibold text-slate-700">Hedef Lise</div>
                <div className="text-xs text-slate-400">{targetProgress.schoolName}</div>
              </div>
            </div>
            {targetProgress.currentScore !== null && targetProgress.currentScore !== undefined ? (
              <>
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <div className="text-xs text-slate-400 mb-0.5">Gerekli Puan</div>
                    <div className="font-bold text-slate-700">{targetProgress.requiredScore}</div>
                    <div className={`text-xs font-bold mt-0.5 ${(targetProgress.scoreGap ?? 0) >= 0 ? 'text-green-600' : 'text-orange-500'}`}>
                      {(targetProgress.scoreGap ?? 0) >= 0 ? `+${targetProgress.scoreGap} üstünde` : `${Math.abs(targetProgress.scoreGap ?? 0)} eksik`}
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <div className="text-xs text-slate-400 mb-0.5">Gerekli Net</div>
                    <div className="font-bold text-slate-700">{targetProgress.requiredNet}</div>
                    <div className={`text-xs font-bold mt-0.5 ${(targetProgress.netGap ?? 0) >= 0 ? 'text-green-600' : 'text-orange-500'}`}>
                      {(targetProgress.netGap ?? 0) >= 0 ? `+${targetProgress.netGap} üstünde` : `${Math.abs(targetProgress.netGap ?? 0)} eksik`}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-400 text-center">
                  {targetProgress.source === 'mock' ? 'Son deneme sınavına göre'
                    : targetProgress.source === 'placement' ? 'Seviye tespit sınavına göre'
                    : 'Girdiğin bilgilere göre'}
                </p>
              </>
            ) : (
              <p className="text-xs text-slate-400 text-center py-1">Henüz bir deneme sınavı tamamlamadın, ilerlemen burada görünecek.</p>
            )}
          </div>
        )}

        {/* Aylık deneme kartı */}
        {mockStatus && (mockStatus.isAvailable || mockStatus.existingExam?.finished) && (
          <div className="mb-4">
            {mockStatus.isAvailable && !mockStatus.existingExam?.finished && (mockStatus.windowOpen || mockStatus.existingExam?.started) ? (
              <button onClick={startMock} disabled={startingMock}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-2xl p-4 text-left shadow-md hover:shadow-lg active:scale-95 transition-all disabled:opacity-60">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1"><span className="text-2xl">🏆</span><span className="font-bold text-base">Deneme Sınavı</span></div>
                    <p className="text-purple-200 text-xs">90 soru · 135 dakika · Tüm dersler</p>
                  </div>
                  {startingMock ? <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full" /> : <span className="text-white text-xl">›</span>}
                </div>
              </button>
            ) : mockStatus.isAvailable && !mockStatus.windowOpen && !mockStatus.existingExam?.finished ? (
              <div className="w-full bg-slate-100 border border-slate-200 rounded-2xl p-4 flex items-center gap-3">
                <span className="text-2xl">🕐</span>
                <div>
                  <p className="font-semibold text-slate-700 text-sm">Deneme sınavı şu an kapalı</p>
                  <p className="text-slate-500 text-xs">Bugün saat {mockStatus.windowStartHour}:00–{mockStatus.windowEndHour}:00 arası aktif</p>
                </div>
              </div>
            ) : mockStatus.existingExam?.finished ? (
              <div className="w-full bg-green-50 border border-green-200 rounded-2xl p-3 flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <div><p className="font-semibold text-green-800 text-sm">Bu dönemin denemesi tamamlandı</p><p className="text-green-600 text-xs">Sonuçlar veli panelinde mevcut</p></div>
              </div>
            ) : null}
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

        {/* Başarılarım */}
        {gamification && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-slate-600 font-semibold text-sm">🏆 Başarılarım</h2>
              <span className="text-xs text-slate-400">{gamification.earnedCount}/{gamification.totalCount}</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {gamification.badges.map(b => (
                <div key={b.id} title={b.description}
                  className={`rounded-2xl p-2.5 text-center border ${b.earned ? 'bg-white border-purple-200 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-50'}`}>
                  <div className={`text-2xl ${b.earned ? '' : 'grayscale'}`}>{b.icon}</div>
                  <div className={`text-[10px] font-semibold mt-1 leading-tight ${b.earned ? 'text-slate-700' : 'text-slate-400'}`}>{b.title}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sıralama (isimsiz) */}
        {leaderboard && leaderboard.available && leaderboard.rank !== null && (
          <div className="mb-6 bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3">
            <span className="text-3xl">📊</span>
            <div className="flex-1">
              <div className="font-semibold text-slate-800 text-sm">
                {leaderboard.scope === 'branch' ? 'Şubende' : 'Tüm kullanıcılar arasında'} {leaderboard.rank}. sıradasın
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {leaderboard.poolSize} öğrenci arasında — çözdüğün soru sayısına göre{leaderboard.percentile !== null ? `, öğrencilerin %${leaderboard.percentile}'inden daha çok çalıştın` : ''}.
              </div>
            </div>
          </div>
        )}

        {/* Zayıf konular */}
        {weakTopics.length > 0 && (
          <div className="mb-6">
            <h2 className="text-slate-600 font-semibold text-sm mb-3">📘 Gelişmen Gereken Konular</h2>
            <div className="space-y-2">
              {weakTopics.map(t => (
                <div key={t.topicId} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <button onClick={() => toggleTopic(t.topicId)} disabled={loadingTopicId === t.topicId}
                    className="w-full p-3 flex items-center gap-3 text-left hover:bg-slate-50 transition-all disabled:opacity-60">
                    <span className="text-xl">{t.subjectIcon}</span>
                    <div className="flex-1">
                      <div className="font-medium text-slate-800 text-sm">{t.topicName}</div>
                      <div className="text-xs text-slate-400">{t.subjectName}</div>
                    </div>
                    {loadingTopicId === t.topicId ? (
                      <div className="animate-spin h-4 w-4 border-2 border-purple-500 border-t-transparent rounded-full" />
                    ) : (
                      <span className="text-xs bg-purple-100 text-purple-700 font-semibold px-2 py-1 rounded-lg">
                        {openTopicId === t.topicId ? 'Gizle ▲' : '📖 Konuyu Öğren'}
                      </span>
                    )}
                  </button>
                  {openTopicId === t.topicId && topicContent[t.topicId] && (
                    <div className="px-4 pb-4 bg-purple-50 text-sm text-purple-900">
                      <Explanation text={topicContent[t.topicId]} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

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

      {celebrationQueue.length > 0 && (
        <BadgeCelebration badge={celebrationQueue[0]} onClose={() => setCelebrationQueue(q => q.slice(1))} />
      )}
    </div>
  );
}
