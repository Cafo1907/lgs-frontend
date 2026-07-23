import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Topic { topicId: number; name: string; attempted: boolean; mastery: number | null }
interface SubjectTopics { subjectId: number; subjectName: string; subjectIcon: string; subjectColor: string; topics: Topic[] }

function masteryColor(mastery: number | null): string {
  if (mastery === null) return 'bg-slate-200';
  if (mastery >= 70) return 'bg-green-500';
  if (mastery >= 40) return 'bg-amber-500';
  return 'bg-red-500';
}

export default function TopicMapPage() {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<SubjectTopics[]>([]);
  const [loading, setLoading] = useState(true);
  const [openSubjectId, setOpenSubjectId] = useState<number | null>(null);

  useEffect(() => {
    axios.get('/api/student/topic-map').then(r => {
      setSubjects(r.data);
      if (r.data.length > 0) setOpenSubjectId(r.data[0].subjectId);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-purple-500 border-t-transparent" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto min-h-screen bg-slate-50 pb-10">
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 pt-12 pb-8 text-white">
        <button onClick={() => navigate('/')} className="text-purple-200 text-sm mb-4 hover:text-white transition-colors">← Ana Sayfa</button>
        <div className="text-4xl mb-3">🗺️</div>
        <h1 className="text-xl font-bold">Konu Haritan</h1>
        <p className="text-purple-100 text-sm mt-1">Hangi konuda ne durumdasın, tek bakışta gör.</p>
        <div className="flex items-center gap-4 mt-4 text-xs">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /> Güçlü</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Orta</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Zayıf</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-slate-200 inline-block" /> Denenmedi</span>
        </div>
      </div>

      <div className="px-4 mt-5 space-y-3">
        {subjects.map(s => {
          const attemptedTopics = s.topics.filter(t => t.attempted);
          const avgMastery = attemptedTopics.length
            ? Math.round(attemptedTopics.reduce((sum, t) => sum + (t.mastery ?? 0), 0) / attemptedTopics.length)
            : null;
          const isOpen = openSubjectId === s.subjectId;
          return (
            <div key={s.subjectId} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <button onClick={() => setOpenSubjectId(isOpen ? null : s.subjectId)}
                className="w-full p-4 flex items-center gap-3 text-left hover:bg-slate-50 transition-all">
                <span className="text-2xl">{s.subjectIcon}</span>
                <div className="flex-1">
                  <div className="font-semibold text-slate-800 text-sm">{s.subjectName}</div>
                  <div className="text-xs text-slate-400">
                    {avgMastery !== null ? `Ortalama hakimiyet: %${avgMastery}` : 'Henüz hiç soru çözmedin'}
                  </div>
                </div>
                <span className="text-slate-300 text-lg">{isOpen ? '▲' : '▼'}</span>
              </button>
              {isOpen && (
                <div className="px-4 pb-4 space-y-2.5">
                  {s.topics.map(t => (
                    <div key={t.topicId}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-600">{t.name}</span>
                        <span className="text-xs font-semibold text-slate-400">{t.mastery !== null ? `%${t.mastery}` : '–'}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div className={`h-2 rounded-full ${masteryColor(t.mastery)}`} style={{ width: `${t.mastery ?? 8}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
