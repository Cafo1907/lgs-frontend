import { useState, useEffect } from 'react';
import axios from 'axios';

interface Topic { topicName: string; percentage: number }
interface ExamSection { subjectName: string; subjectIcon: string; percentage: number; topics?: Topic[] }
interface Summary {
  source: 'exam' | 'manual' | null;
  score?: number; net?: number | null;
  sectionResults?: ExamSection[];
  completedAt?: string;
}

function topicColor(pct: number): string {
  if (pct >= 70) return 'text-green-600';
  if (pct >= 40) return 'text-amber-600';
  return 'text-red-500';
}

export default function PlacementSummaryCard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [open, setOpen] = useState(false);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

  useEffect(() => {
    axios.get('/api/placement/summary').then(r => setSummary(r.data)).catch(() => {});
  }, []);

  if (!summary || !summary.source) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center justify-between text-left">
        <div>
          <h3 className="text-sm font-semibold text-slate-700">🎯 İlk Seviye Tespiti</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {summary.completedAt ? new Date(summary.completedAt).toLocaleDateString('tr-TR') : ''}
            {summary.source === 'manual' && ' · kendi girdiği bilgilere göre'}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xl font-black text-purple-700">{summary.score}</div>
          <div className="text-[10px] text-slate-400">puan</div>
        </div>
      </button>
      {open && summary.sectionResults && summary.sectionResults.length > 0 && (
        <div className="mt-3 space-y-1 border-t border-slate-100 pt-3">
          {summary.sectionResults.map(s => {
            const hasTopics = s.topics && s.topics.length > 0;
            const isExpanded = expandedSubject === s.subjectName;
            return (
              <div key={s.subjectName}>
                <button
                  onClick={() => hasTopics && setExpandedSubject(isExpanded ? null : s.subjectName)}
                  className={`w-full flex items-center justify-between text-xs py-1.5 ${hasTopics ? 'cursor-pointer' : ''}`}
                  disabled={!hasTopics}
                >
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <span>{s.subjectIcon}</span>{s.subjectName}
                    {hasTopics && <span className="text-slate-300">{isExpanded ? '▲' : '▼'}</span>}
                  </span>
                  <span className="font-semibold text-slate-700">%{s.percentage}</span>
                </button>
                {isExpanded && hasTopics && (
                  <div className="pl-6 pb-2 space-y-1">
                    {s.topics!.map(t => (
                      <div key={t.topicName} className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">{t.topicName}</span>
                        <span className={`font-semibold ${topicColor(t.percentage)}`}>%{t.percentage}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
