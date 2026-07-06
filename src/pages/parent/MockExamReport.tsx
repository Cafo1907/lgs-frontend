import { useState, useEffect } from 'react';
import axios from 'axios';

interface SectionResult { subjectId: number; subjectName: string; subjectIcon: string; correct: number; wrong: number; blank: number; net: number; percentage: number }
interface MockResult {
  id: number; monthYear: string; startedAt: string; finishedAt: string;
  result: {
    totalCorrect: number; totalWrong: number; totalBlank: number;
    totalNet: number; estimatedScore: number;
    sectionResults: SectionResult[];
    targetScore?: number; targetNet?: number; gap?: number;
  } | null;
}
interface TargetSchool { schoolName: string; requiredScore: number; requiredNet: number }

export default function MockExamReport() {
  const [history, setHistory] = useState<MockResult[]>([]);
  const [target, setTarget] = useState<TargetSchool | null>(null);
  const [selected, setSelected] = useState<MockResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get('/api/mock-exam/history').then(r => r.data),
      axios.get('/api/target-school').then(r => r.data).catch(() => null),
    ]).then(([h, t]) => {
      setHistory(h);
      setTarget(t);
      if (h.length > 0) setSelected(h[0]);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center pt-16"><div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent" /></div>;
  if (history.length === 0) return <div className="text-center text-slate-400 py-16">Henüz deneme sınavı yapılmadı.</div>;

  const r = selected?.result;
  const sections: SectionResult[] = r ? (typeof r.sectionResults === 'string' ? JSON.parse(r.sectionResults) : r.sectionResults) : [];
  const gap = r && target ? r.estimatedScore - target.requiredScore : null;
  const netGap = r && target ? r.totalNet - target.requiredNet : null;

  return (
    <div className="space-y-4">
      {/* Tarih seçimi */}
      {history.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {history.map(h => (
            <button key={h.id} onClick={() => setSelected(h)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex-shrink-0 ${selected?.id === h.id ? 'bg-purple-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {h.monthYear}
            </button>
          ))}
        </div>
      )}

      {selected && r ? (
        <>
          {/* Puan kartı */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-5 text-white">
            <div className="text-sm text-purple-100 mb-1">{selected.monthYear} Deneme Sınavı</div>
            <div className="text-4xl font-black">{r.estimatedScore.toFixed(0)}</div>
            <div className="text-purple-200 text-sm">Tahmini LGS Puanı · {r.totalNet.toFixed(1)} net</div>
          </div>

          {/* Hedef okul karşılaştırması */}
          {target && gap !== null && netGap !== null && (
            <div className={`rounded-2xl p-4 ${gap >= 0 ? 'bg-green-50 border border-green-200' : 'bg-orange-50 border border-orange-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🎯</span>
                <span className="font-semibold text-sm text-slate-700">{target.schoolName}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-slate-500 mb-1">Hedef Puan</div>
                  <div className="font-bold text-slate-800">{target.requiredScore}</div>
                  <div className={`text-sm font-bold ${gap >= 0 ? 'text-green-600' : 'text-orange-500'}`}>
                    {gap >= 0 ? `+${gap.toFixed(0)} puan üstünde` : `${Math.abs(gap).toFixed(0)} puan eksik`}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Hedef Net</div>
                  <div className="font-bold text-slate-800">{target.requiredNet}</div>
                  <div className={`text-sm font-bold ${netGap >= 0 ? 'text-green-600' : 'text-orange-500'}`}>
                    {netGap >= 0 ? `+${netGap.toFixed(1)} net üstünde` : `${Math.abs(netGap).toFixed(1)} net eksik`}
                  </div>
                </div>
              </div>
              <div className="mt-3 w-full bg-white/60 rounded-full h-3">
                <div className={`h-3 rounded-full ${gap >= 0 ? 'bg-green-500' : 'bg-orange-400'}`}
                  style={{ width: `${Math.min(100, Math.max(5, (r.estimatedScore / (target.requiredScore || 500)) * 100))}%` }} />
              </div>
            </div>
          )}

          {/* Ders tablosu */}
          {sections.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-700 text-sm">Ders Bazlı Sonuçlar</h3>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-4 py-2 text-slate-400 font-medium">Ders</th>
                    <th className="text-center px-2 py-2 text-slate-400 font-medium">D</th>
                    <th className="text-center px-2 py-2 text-slate-400 font-medium">Y</th>
                    <th className="text-center px-2 py-2 text-slate-400 font-medium">Net</th>
                    <th className="text-center px-2 py-2 text-slate-400 font-medium">%</th>
                  </tr>
                </thead>
                <tbody>
                  {sections.map(s => (
                    <tr key={s.subjectId} className="border-b border-slate-50 last:border-0">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <span>{s.subjectIcon}</span>
                          <span className="text-slate-700 font-medium">{s.subjectName}</span>
                        </div>
                      </td>
                      <td className="text-center px-2 py-2.5 text-green-600 font-semibold">{s.correct}</td>
                      <td className="text-center px-2 py-2.5 text-red-500 font-semibold">{s.wrong}</td>
                      <td className="text-center px-2 py-2.5 text-purple-700 font-bold">{s.net.toFixed(1)}</td>
                      <td className="text-center px-2 py-2.5">
                        <span className={`px-2 py-0.5 rounded-lg ${s.percentage >= 70 ? 'bg-green-100 text-green-700' : s.percentage >= 50 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-600'}`}>
                          {s.percentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-purple-50">
                    <td className="px-4 py-2.5 font-bold text-purple-700">Toplam</td>
                    <td className="text-center px-2 py-2.5 font-bold text-green-600">{r.totalCorrect}</td>
                    <td className="text-center px-2 py-2.5 font-bold text-red-500">{r.totalWrong}</td>
                    <td className="text-center px-2 py-2.5 font-bold text-purple-700">{r.totalNet.toFixed(1)}</td>
                    <td className="text-center px-2 py-2.5 font-bold text-purple-700">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <div className="text-center text-slate-400 py-8">Sonuç bulunamadı.</div>
      )}
    </div>
  );
}
