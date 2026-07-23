import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface SubjectBreakdown { subjectId: number; name: string; icon: string; correct: number; wrong: number; blank: number; net: number }
interface WeeklySummary {
  examsCompleted: number;
  questionsAnswered: number;
  avgPercentage: number | null;
  studyDays: number;
  subjectBreakdown: SubjectBreakdown[];
  bestSubject: SubjectBreakdown | null;
}

export default function WeeklySummaryPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<WeeklySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/student/weekly-summary').then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-purple-500 border-t-transparent" />
    </div>
  );
  if (!data) return null;

  const noActivity = data.examsCompleted === 0;

  return (
    <div className="max-w-2xl mx-auto min-h-screen bg-slate-50 pb-10">
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 pt-12 pb-8 text-white">
        <button onClick={() => navigate('/')} className="text-purple-200 text-sm mb-4 hover:text-white transition-colors">← Ana Sayfa</button>
        <div className="text-4xl mb-3">📊</div>
        <h1 className="text-xl font-bold">Haftalık Özetin</h1>
        <p className="text-purple-100 text-sm mt-1">Son 7 gün içindeki çalışman.</p>
      </div>

      <div className="px-4 mt-5 space-y-4">
        {noActivity ? (
          <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
            <div className="text-4xl mb-2">🌱</div>
            <p className="text-slate-500 text-sm">Bu hafta henüz sınav tamamlamadın. Bir ders seçip başlamaya ne dersin?</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
                <div className="text-2xl font-black text-purple-700">{data.examsCompleted}</div>
                <div className="text-xs text-slate-500 mt-1">Tamamlanan Sınav</div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
                <div className="text-2xl font-black text-purple-700">{data.questionsAnswered}</div>
                <div className="text-xs text-slate-500 mt-1">Çözülen Soru</div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
                <div className="text-2xl font-black text-purple-700">{data.studyDays}/7</div>
                <div className="text-xs text-slate-500 mt-1">Çalışılan Gün</div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
                <div className="text-2xl font-black text-purple-700">{data.avgPercentage !== null ? `%${data.avgPercentage}` : '–'}</div>
                <div className="text-xs text-slate-500 mt-1">Ortalama Başarı</div>
              </div>
            </div>

            {data.bestSubject && (
              <div className="bg-purple-50 rounded-2xl p-4 flex items-center gap-3">
                <span className="text-3xl">{data.bestSubject.icon}</span>
                <div>
                  <div className="text-xs text-purple-600 font-medium">Bu haftanın en iyi dersi</div>
                  <div className="font-bold text-purple-800">{data.bestSubject.name} — {data.bestSubject.net.toFixed(1)} net</div>
                </div>
              </div>
            )}

            {data.subjectBreakdown.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-4">
                <h2 className="font-semibold text-slate-700 mb-3">Ders Bazlı Kırılım</h2>
                <div className="space-y-3">
                  {data.subjectBreakdown.map(s => (
                    <div key={s.subjectId} className="flex items-center gap-3">
                      <span className="text-xl">{s.icon}</span>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-700">{s.name}</div>
                        <div className="text-xs text-slate-400">{s.correct} doğru · {s.wrong} yanlış · {s.blank} boş</div>
                      </div>
                      <span className="text-sm font-bold text-purple-700">{s.net.toFixed(1)} net</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <button onClick={() => navigate('/')}
          className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl transition-all">
          Ana Sayfaya Dön
        </button>
      </div>
    </div>
  );
}
