"use client";

import { useState, useEffect, useCallback } from "react";
import TimerClient from "@/components/TimerClient";
import SubjectChart from "@/components/SubjectChart";
import type { StudySession } from "@/lib/types";

export default function TimerPage() {
  const [sessions, setSessions] = useState<StudySession[]>([]);

  const fetchSessions = useCallback(async () => {
    const res = await fetch("/api/sessions");
    if (res.ok) setSessions(await res.json());
  }, []);

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
