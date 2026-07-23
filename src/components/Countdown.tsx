import { useState, useEffect } from 'react';

interface CountdownParts { months: number; days: number; hours: number; minutes: number; seconds: number; expired: boolean }

function computeCountdown(target: Date, now: Date): CountdownParts {
  if (target <= now) return { months: 0, days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };

  let months = (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
  let cursor = new Date(now);
  cursor.setMonth(cursor.getMonth() + months);
  if (cursor > target) { months--; cursor = new Date(now); cursor.setMonth(cursor.getMonth() + months); }

  const remainderMs = target.getTime() - cursor.getTime();
  const days = Math.floor(remainderMs / 86400000);
  const hours = Math.floor((remainderMs % 86400000) / 3600000);
  const minutes = Math.floor((remainderMs % 3600000) / 60000);
  const seconds = Math.floor((remainderMs % 60000) / 1000);
  return { months, days, hours, minutes, seconds, expired: false };
}

interface Props { icon: string; title: string; subtitle: string; target: Date; accent?: string }

export default function Countdown({ icon, title, subtitle, target, accent = 'text-purple-700' }: Props) {
  const [parts, setParts] = useState<CountdownParts>(() => computeCountdown(target, new Date()));

  useEffect(() => {
    const id = setInterval(() => setParts(computeCountdown(target, new Date())), 1000);
    return () => clearInterval(id);
  }, [target]);

  const units: { label: string; value: number }[] = [
    { label: 'Ay', value: parts.months },
    { label: 'Gün', value: parts.days },
    { label: 'Saat', value: parts.hours },
    { label: 'Dk', value: parts.minutes },
    { label: 'Sn', value: parts.seconds },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{icon}</span>
        <div>
          <div className="text-sm font-semibold text-slate-700">{title}</div>
          <div className="text-xs text-slate-400">{subtitle}</div>
        </div>
      </div>
      {parts.expired ? (
        <p className="text-sm text-slate-500 text-center py-2">Süre doldu.</p>
      ) : (
        <div className="grid grid-cols-5 gap-1.5">
          {units.map(u => (
            <div key={u.label} className="bg-slate-50 rounded-xl py-2 text-center">
              <div className={`text-lg font-black tabular-nums ${accent}`}>{u.value}</div>
              <div className="text-[10px] text-slate-400">{u.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
