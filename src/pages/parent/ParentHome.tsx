import { useState, useEffect } from 'react';
import axios from 'axios';
import ReportView from './ReportView';
import MockExamReport from './MockExamReport';
import CostView from './CostView';

interface SubjectStat {
  subject: { id: number; name: string; icon: string; color: string };
  examCount: number;
  lastExamAt?: string;
  totals: { correct: number; wrong: number; blank: number; total: number; percentage: number; net: number } | null;
}
interface CalendarDay { date: string; examCount: number; subjects: string[] }
interface Props { user: { name: string }; onLogout: () => void }

const TABS = ['📊 Özet', '📅 Takvim', '📝 Rapor', '🏆 Deneme', '💰 Maliyet'] as const;
type Tab = typeof TABS[number];

export default function ParentHome({ user, onLogout }: Props) {
  const [tab, setTab] = useState<Tab>('📊 Özet');
  const [stats, setStats] = useState<SubjectStat[]>([]);
  const [calendar, setCalendar] = useState<CalendarDay[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    axios.get('/api/parent/stats').then(r => {
      setStats(r.data);
    }).finally(() => setLoadingStats(false));
  }, []);

  useEffect(() => {
    if (tab === '📅 Takvim') {
      axios.get('/api/parent/results').then(r => {
        const map = new Map<string, { count: number; subjects: Set<string> }>();
        (r.data as Array<{ finishedAt: string; subjectName: string }>).forEach(e => {
          const d = e.finishedAt.slice(0, 10);
          if (!map.has(d)) map.set(d, { count: 0, subjects: new Set() });
          const entry = map.get(d)!;
          entry.count++;
          entry.subjects.add(e.subjectName);
        });
        setCalendar([...map.entries()].map(([date, v]) => ({ date, examCount: v.count, subjects: [...v.subjects] })));
      });
    }
  }, [tab]);

  const totalExams = stats.reduce((a, s) => a + s.examCount, 0);
  const lastExamDate = stats.reduce<string | null>((best, s) => {
    if (!s.lastExamAt) return best;
    if (!best || s.lastExamAt > best) return s.lastExamAt;
    return best;
  }, null);

  const today = new Date();
  const year = today.getFullYear(), month = today.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calMap = new Map(calendar.map(d => [d.date, d]));

  return (
    <div className="max-w-md mx-auto min-h-screen pb-8">
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 pt-12 pb-6 text-white">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-purple-100 text-sm">Veli Paneli</p>
            <h1 className="text-xl font-bold mt-0.5">{user.name}</h1>
          </div>
          <button onClick={onLogout} className="bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-all">Çıkış →</button>
        </div>
      </div>

      <div className="bg-white border-b sticky top-0 z-40 overflow-x-auto">
        <div className="flex gap-1 px-3 py-2 min-w-max">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${tab === t ? 'bg-purple-500 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4">
        {/* ÖZET */}
        {tab === '📊 Özet' && (
          <div className="space-y-4">
            {loadingStats ? (
              <div className="flex justify-center pt-16"><div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent" /></div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
                    <div className="text-3xl font-black text-purple-600">{totalExams}</div>
                    <div className="text-xs text-slate-500 mt-1">Toplam Sınav</div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
                    <div className="text-3xl font-black text-green-600">{stats.filter(s => s.examCount > 0).length}</div>
                    <div className="text-xs text-slate-500 mt-1">Çalışılan Ders</div>
                  </div>
                </div>
                {lastExamDate && (
                  <div className="bg-blue-50 rounded-xl p-3 text-sm text-blue-700 text-center">
                    Son sınav: {new Date(lastExamDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })}
                  </div>
                )}
                {totalExams === 0 && (
                  <div className="text-center text-slate-400 py-8 text-sm">Henüz sınav yapılmadı.</div>
                )}
                <div className="space-y-2">
                  {stats.filter(s => s.examCount > 0).map(s => (
                    <div key={s.subject.id} className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3">
                      <span className="text-3xl">{s.subject.icon}</span>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-semibold text-slate-700">{s.subject.name}</span>
                          <span className="text-xs text-slate-400">{s.examCount} sınav</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 mb-1">
                          <div className="h-2 rounded-full" style={{ width: `${s.totals?.percentage ?? 0}%`, backgroundColor: s.subject.color }} />
                        </div>
                        <div className="flex justify-between text-xs text-slate-400">
                          <span>Ort. Net: <span className="font-semibold text-purple-600">{s.totals?.net.toFixed(1) ?? '0.0'}</span></span>
                          <span>%{s.totals?.percentage ?? 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* TAKVİM */}
        {tab === '📅 Takvim' && (
          <div>
            <h2 className="text-center font-semibold text-slate-700 mb-4">
              {today.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Pz', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct'].map(d => (
                  <div key={d} className="text-center text-xs font-medium text-slate-400 py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const entry = calMap.get(dateStr);
                  const isToday = day === today.getDate();
                  return (
                    <div key={day} title={entry ? entry.subjects.join(', ') : ''}
                      className={`aspect-square flex flex-col items-center justify-center rounded-xl text-xs cursor-default ${isToday ? 'ring-2 ring-purple-500' : ''} ${entry ? 'bg-purple-500 text-white font-bold' : 'text-slate-400'}`}>
                      <span>{day}</span>
                      {entry && <span className="text-white/80" style={{ fontSize: 8 }}>{entry.examCount}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
            {calendar.filter(c => { const d = new Date(c.date); return d.getMonth() === month && d.getFullYear() === year; })
              .sort((a, b) => b.date.localeCompare(a.date)).map(c => (
              <div key={c.date} className="bg-white rounded-xl shadow-sm p-3 mt-2 flex items-center gap-3">
                <div className="bg-purple-100 text-purple-700 font-bold text-sm px-2 py-1 rounded-lg min-w-8 text-center">
                  {new Date(c.date + 'T12:00:00').getDate()}
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-700">{c.subjects.join(', ')}</div>
                  <div className="text-xs text-slate-400">{c.examCount} sınav</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === '📝 Rapor' && <ReportView />}
        {tab === '🏆 Deneme' && <MockExamReport />}
        {tab === '💰 Maliyet' && <CostView />}
      </div>
    </div>
  );
}
