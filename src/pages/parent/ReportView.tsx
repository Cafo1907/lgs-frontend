import { useState, useEffect } from 'react';
import axios from 'axios';

interface TopicStat { topicId: number; name: string; correct: number; wrong: number; blank: number; total: number; percentage: number }
interface SubjectReport {
  subject: { id: number; name: string; icon: string; color: string };
  examCount: number;
  totals: { correct: number; wrong: number; blank: number; total: number; percentage: number; net: number };
  topicStats: TopicStat[];
}
interface ReportData {
  period: string; startDate: string; endDate: string;
  overall: { correct: number; wrong: number; blank: number; total: number; percentage: number };
  subjects: SubjectReport[];
}

export default function ReportView() {
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSubject, setExpandedSubject] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    axios.get(`/api/parent/report?period=${period}`)
      .then(r => setReport(r.data))
      .finally(() => setLoading(false));
  }, [period]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['weekly', 'monthly'] as const).map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${period === p ? 'bg-purple-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {p === 'weekly' ? 'Bu Hafta' : 'Bu Ay'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center pt-8"><div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent" /></div>
      ) : !report || report.subjects.length === 0 ? (
        <div className="text-center text-slate-400 py-8">Bu dönemde sınav yapılmadı.</div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white rounded-2xl shadow-sm p-3 text-center">
              <div className="text-2xl font-black text-purple-600">{report.subjects.reduce((a, s) => a + s.examCount, 0)}</div>
              <div className="text-xs text-slate-500 mt-1">Sınav</div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-3 text-center">
              <div className="text-2xl font-black text-green-600">{report.overall.correct}</div>
              <div className="text-xs text-slate-500 mt-1">Doğru</div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-3 text-center">
              <div className="text-2xl font-black text-slate-500">%{report.overall.percentage}</div>
              <div className="text-xs text-slate-500 mt-1">Başarı</div>
            </div>
          </div>

          <div className="space-y-3">
            {report.subjects.map(sub => (
              <div key={sub.subject.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <button onClick={() => setExpandedSubject(expandedSubject === sub.subject.id ? null : sub.subject.id)}
                  className="w-full p-4 text-left flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{sub.subject.icon}</span>
                    <div>
                      <div className="font-semibold text-slate-800 text-sm">{sub.subject.name}</div>
                      <div className="text-xs text-slate-400">{sub.examCount} sınav · %{sub.totals.percentage}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-bold text-purple-600">{sub.totals.net.toFixed(1)}</div>
                      <div className="text-xs text-slate-400">net</div>
                    </div>
                    <span className={`transition-transform ${expandedSubject === sub.subject.id ? 'rotate-180' : ''} text-slate-400`}>▾</span>
                  </div>
                </button>
                <div className="px-4 pb-2">
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="h-2 rounded-full" style={{ width: `${sub.totals.percentage}%`, backgroundColor: sub.subject.color }} />
                  </div>
                </div>

                {expandedSubject === sub.subject.id && sub.topicStats.length > 0 && (
                  <div className="px-4 pb-4 border-t border-slate-50 mt-2 pt-3">
                    <div className="text-xs text-slate-500 font-medium mb-2">Konu Detayları</div>
                    <div className="space-y-2">
                      {sub.topicStats.slice(0, 8).map(t => (
                        <div key={t.topicId}>
                          <div className="flex justify-between text-xs mb-0.5">
                            <span className="text-slate-600">{t.name}</span>
                            <span className={t.percentage < 40 ? 'text-red-500 font-semibold' : t.percentage < 60 ? 'text-orange-500' : 'text-green-600'}>
                              {t.percentage < 40 ? '⚠️ Zayıf' : t.percentage < 60 ? 'Orta' : '✓ İyi'} (%{t.percentage})
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full" style={{ width: `${t.percentage}%`, backgroundColor: sub.subject.color, opacity: 0.7 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
