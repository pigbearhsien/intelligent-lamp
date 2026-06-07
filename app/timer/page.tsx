"use client";

import { useState, useEffect, useCallback } from "react";
import TimerClient from "@/components/TimerClient";
import SubjectChart from "@/components/SubjectChart";
import { useAuthGuard } from "@/lib/useAuthGuard";
import type { StudySession } from "@/lib/types";

export default function TimerPage() {
  const { studentId } = useAuthGuard();
  const [sessions, setSessions] = useState<StudySession[]>([]);

  const fetchSessions = useCallback(async () => {
    if (!studentId) return;
    const res = await fetch(`/api/sessions?studentId=${encodeURIComponent(studentId)}`);
    if (res.ok) setSessions(await res.json());
  }, [studentId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <TimerClient onSaved={fetchSessions} />
      <SubjectChart sessions={sessions} />
    </div>
  );
}
