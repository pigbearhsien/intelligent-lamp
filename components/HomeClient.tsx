'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Thermometer, Droplets, Sun } from 'lucide-react';
import SubjectChart from '@/components/SubjectChart';
import FocusComment from '@/components/FocusComment';
import TimerClient from '@/components/TimerClient';
import type { StudySession, EnvironmentReading } from '@/lib/types';

export default function HomeClient() {
  const router = useRouter();
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [latest, setLatest] = useState<EnvironmentReading | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const studentId = localStorage.getItem('currentUser');
    if (!studentId) {
      router.push('/login');
      return;
    }
    Promise.all([
      fetch(`/api/sessions?studentId=${studentId}`).then((r) => r.json()),
      fetch('/api/environment').then((r) => r.json()),
    ]).then(([sessionsData, readingsData]) => {
      setSessions(Array.isArray(sessionsData) ? sessionsData : []);
      const readings: EnvironmentReading[] = Array.isArray(readingsData) ? readingsData : [];
      setLatest(readings.length ? readings[readings.length - 1] : null);
      setLoading(false);
    });
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400 text-sm">
        載入中...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">學習儀表板</h1>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Thermometer, label: '溫度', value: latest ? `${latest.temperature}°C` : '--' },
          { icon: Droplets, label: '濕度', value: latest ? `${latest.humidity}%` : '--' },
          { icon: Sun, label: '亮度', value: latest ? `${latest.brightness} lux` : '--' },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Icon className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">{label}</p>
              <p className="text-xl font-bold">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TimerClient />
        <FocusComment sessions={sessions} />
      </div>

      <SubjectChart sessions={sessions} />
    </div>
  );
}
