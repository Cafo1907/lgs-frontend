import { useState, useEffect } from 'react';
import axios from 'axios';

interface Usage { id: number; action: string; subjectName?: string; costTry: number; createdAt: string }
interface SubjectCost { name: string; costTry: number }
interface CostData {
  thisMonth: { costTry: number; itemCount: number };
  byExam: Usage[];
  bySubject: SubjectCost[];
  allTimeCostTry: number;
}

function actionLabel(action: string, subjectName?: string) {
  if (action === 'exam_generate' && subjectName) return `📝 ${subjectName} Sınavı`;
  if (action === 'mock_generate') return '🏆 Aylık Deneme';
  if (action === 'placement_generate' && subjectName) return `📊 Seviye Tespiti (${subjectName})`;
  if (action === 'placement_generate') return '📊 Seviye Tespiti';
  if (action === 'explanation') return '💬 Soru Açıklaması';
  return subjectName || action;
}

export default function CostView() {
  const [data, setData] = useState<CostData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/parent/costs').then(r => {
      const raw = r.data;
      setData({
        thisMonth: { costTry: raw.thisMonth.costTry, itemCount: raw.thisMonth.itemCount },
        byExam: raw.byExam.map((e: any) => ({ id: e.id, action: e.action, subjectName: e.subjectName, costTry: e.costTry, createdAt: e.createdAt })),
        bySubject: raw.bySubject.map((s: any) => ({ name: s.name, costTry: s.costTry })),
        allTimeCostTry: raw.allTimeCostTry,
      });
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center pt-16"><div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent" /></div>;
  if (!data) return <div className="text-center pt-16 text-slate-400">Veri yüklenemedi.</div>;

  return (
    <div className="space-y-4">
      {/* Bu ay özet */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-5 text-white">
        <div className="text-sm text-purple-100 mb-1">Bu Ay Toplam Kullanım</div>
        <div className="text-3xl font-black">₺{data.thisMonth.costTry.toFixed(2)}</div>
        <div className="text-purple-200 text-xs mt-1">{data.thisMonth.itemCount} işlem</div>
      </div>

      {/* Tüm zamanlar */}
      <div className="bg-white rounded-2xl shadow-sm p-4 flex justify-between items-center">
        <span className="text-sm text-slate-500">Toplam Kullanım</span>
        <span className="font-bold text-slate-800 text-lg">₺{data.allTimeCostTry.toFixed(2)}</span>
      </div>

      {/* Kaynak bazlı */}
      {data.bySubject.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h3 className="font-semibold text-slate-700 text-sm mb-3">Kaynak Bazlı</h3>
          <div className="space-y-2">
            {data.bySubject.map(s => (
              <div key={s.name} className="flex items-center justify-between">
                <span className="text-sm text-slate-600">{s.name}</span>
                <span className="text-sm font-bold text-purple-700">₺{s.costTry.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* İşlem detayları */}
      {data.byExam.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h3 className="font-semibold text-slate-700 text-sm mb-3">Bu Ay İşlemler</h3>
          <div className="space-y-2">
            {data.byExam.map(e => (
              <div key={e.id} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                <div>
                  <div className="text-sm text-slate-700">{actionLabel(e.action, e.subjectName)}</div>
                  <div className="text-xs text-slate-400">{new Date(e.createdAt).toLocaleDateString('tr-TR')}</div>
                </div>
                <span className="text-sm font-bold text-purple-700">₺{e.costTry.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.byExam.length === 0 && (
        <div className="text-center text-slate-400 text-sm py-8">Bu ay henüz kullanım yok.</div>
      )}
    </div>
  );
}
