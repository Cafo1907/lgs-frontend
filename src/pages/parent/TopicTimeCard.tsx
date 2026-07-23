import { useState, useEffect } from 'react';
import axios from 'axios';

interface TopicTime { topicName: string; avgMs: number; count: number }

function formatDuration(ms: number): string {
  const totalSec = Math.round(ms / 1000);
  const m = Math.floor(totalSec / 60), s = totalSec % 60;
  return m > 0 ? `${m} dk ${s} sn` : `${s} sn`;
}

export default function TopicTimeCard() {
  const [topics, setTopics] = useState<TopicTime[] | null>(null);

  useEffect(() => {
    axios.get('/api/parent/topic-time-summary').then(r => setTopics(r.data.topics)).catch(() => {});
  }, []);

  if (!topics || topics.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-1">⏱ Yavaş Konular</h3>
      <p className="text-xs text-slate-400 mb-3">Genel ortalamanın belirgin üstünde süre harcadığı konular — çalışma önceliği için bir ipucu.</p>
      <div className="space-y-2">
        {topics.map(t => (
          <div key={t.topicName} className="flex items-center justify-between bg-red-50 rounded-xl px-3 py-2">
            <span className="text-xs text-slate-700">{t.topicName} <span className="text-slate-400">({t.count} soru)</span></span>
            <span className="text-xs font-bold text-red-500">{formatDuration(t.avgMs)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
