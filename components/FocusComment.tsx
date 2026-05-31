'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { StudySession } from '@/lib/types';

type Period = 'day' | 'week' | 'month';

const PERIOD_LABELS: Record<Period, string> = { day: '今天', week: '本週', month: '本月' };

interface FocusResult {
  comment: string;
  tips: string[];
}

interface FocusCommentProps {
  sessions: StudySession[];
}

export default function FocusComment({ sessions }: FocusCommentProps) {
  const [period, setPeriod] = useState<Period>('week');
  const [focus, setFocus] = useState<FocusResult | null>(null);
  const [loading, setLoading] = useState(false);

  const now = new Date();
  const focusSessions = sessions.filter((s) => {
    const d = new Date(s.startTime);
    if (period === 'day') return d.toDateString() === now.toDateString();
    if (period === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      return d >= weekAgo;
    }
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  async function generate() {
    if (!focusSessions.length) return;
    setLoading(true);
    setFocus(null);
    const focusBySubject = focusSessions.reduce<Record<string, number>>((acc, s) => {
      acc[s.subject] = (acc[s.subject] ?? 0) + s.durationMinutes;
      return acc;
    }, {});
    const res = await fetch('/api/ai/focus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        totalMinutes: focusSessions.reduce((sum, x) => sum + x.durationMinutes, 0),
        avgFocus: Math.round(focusSessions.reduce((s, x) => s + x.focusScore, 0) / focusSessions.length),
        subjects: Object.keys(focusBySubject),
        sessionCount: focusSessions.length,
        period,
      }),
    });
    const data = await res.json();
    setFocus(data);
    setLoading(false);
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-700">✨ 專注度評語</p>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => { setPeriod(p); setFocus(null); }}
                className={cn(
                  'px-3 py-1 rounded-md text-sm font-medium transition-colors',
                  period === p ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
          <button
            onClick={generate}
            disabled={loading || focusSessions.length === 0}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 text-white disabled:opacity-40 hover:bg-slate-700 transition-colors"
          >
            {loading ? '分析中...' : '產生評語'}
          </button>
        </div>
      </div>
      {focusSessions.length === 0 && (
        <p className="text-sm text-slate-400">尚無{PERIOD_LABELS[period]}的學習記錄，先去計時器記錄一筆吧！</p>
      )}
      {focus && (
        <div className="space-y-2">
          <p className="text-sm text-slate-700">{focus.comment}</p>
          <ul className="space-y-1">
            {focus.tips?.map((tip, i) => (
              <li key={i} className="text-sm text-slate-600 flex gap-2">
                <span className="text-slate-400">{i + 1}.</span>{tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
