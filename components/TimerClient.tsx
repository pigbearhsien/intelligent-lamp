"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Square, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { SUBJECTS } from "@/lib/types";
import type { Subject } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthGuard } from "@/lib/useAuthGuard";

type State = "idle" | "running" | "done";

const STORAGE_KEY = "timer_state";

interface PersistedTimer {
  subject: Subject | "";
  focusScore: number;
  state: State;
  startTimestamp: number | null; // ms since epoch
  elapsed: number;
}

function loadTimer(): PersistedTimer | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PersistedTimer) : null;
  } catch {
    return null;
  }
}

function saveTimer(data: PersistedTimer) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

function clearTimer() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {}
}

function initFromStorage(): {
  subject: Subject | "";
  focusScore: number;
  state: State;
  elapsed: number;
  startTime: Date | null;
} {
  const persisted = loadTimer();
  if (!persisted) {
    return {
      subject: "",
      focusScore: 7,
      state: "idle",
      elapsed: 0,
      startTime: null,
    };
  }
  if (persisted.state === "running" && persisted.startTimestamp) {
    const secondsSinceStart = Math.floor(
      (Date.now() - persisted.startTimestamp) / 1000,
    );
    return {
      subject: persisted.subject,
      focusScore: persisted.focusScore,
      state: "running",
      elapsed: secondsSinceStart,
      startTime: new Date(persisted.startTimestamp),
    };
  }
  return {
    subject: persisted.subject,
    focusScore: persisted.focusScore,
    state: persisted.state,
    elapsed: persisted.elapsed,
    startTime: persisted.startTimestamp
      ? new Date(persisted.startTimestamp)
      : null,
  };
}

export default function TimerClient({ onSaved }: { onSaved?: () => void }) {
  const { checked } = useAuthGuard();

  const [subject, setSubject] = useState<Subject | "">(
    () => initFromStorage().subject,
  );
  const [focusScore, setFocusScore] = useState(
    () => initFromStorage().focusScore,
  );
  const [state, setState] = useState<State>(() => initFromStorage().state);
  const [elapsed, setElapsed] = useState(() => initFromStorage().elapsed);
  const [startTime, setStartTime] = useState<Date | null>(
    () => initFromStorage().startTime,
  );
  const [saving, setSaving] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Persist to sessionStorage whenever relevant state changes
  useEffect(() => {
    if (state === "idle" && elapsed === 0) {
      clearTimer();
      return;
    }
    saveTimer({
      subject,
      focusScore,
      state,
      startTimestamp: startTime ? startTime.getTime() : null,
      elapsed,
    });
  }, [subject, focusScore, state, startTime, elapsed]);

  useEffect(() => {
    if (state === "running") {
      intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state]);

  function start() {
    setElapsed(0);
    setStartTime(new Date());
    setState("running");
  }

  function stop() {
    setState("done");
  }

  function reset() {
    setState("idle");
    setElapsed(0);
    setStartTime(null);
    clearTimer();
  }

  async function save() {
    if (!startTime || !subject) return;
    setSaving(true);
    const endTime = new Date();
    const studentId = localStorage.getItem('currentUser') ?? '';
    await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        durationMinutes: Math.round(elapsed / 60),
        focusScore,
        studentId,
      }),
    });
    setSaving(false);
    clearTimer();
    setState("idle");
    setElapsed(0);
    setStartTime(null);
    onSaved?.();
  }

  if (!checked) return null;

  const h = String(Math.floor(elapsed / 3600)).padStart(2, "0");
  const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0");
  const s = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
      <p className="text-sm font-medium text-slate-700">⏱️ 計時器</p>

      {/* Subject */}
      <div className="space-y-2">
        <Select
          value={subject}
          disabled={state !== "idle"}
          onValueChange={(v) => setSubject(v as Subject | "")}
        >
          <SelectTrigger id="subject" className="w-full">
            <SelectValue placeholder="選擇科目" />
          </SelectTrigger>
          <SelectContent>
            {SUBJECTS.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Timer display */}
      <div className="p-8 text-center">
        <div className="text-6xl font-mono font-bold tracking-widest text-slate-900">
          {h}:{m}:{s}
        </div>
        {state === "running" && (
          <p className="text-sm text-slate-400 mt-2">正在計時 · {subject}</p>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-3 justify-center">
        {state === "idle" && (
          <button
            onClick={start}
            disabled={!subject}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Play className="h-4 w-4" /> 開始
          </button>
        )}
        {state === "running" && (
          <button
            onClick={stop}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
          >
            <Square className="h-4 w-4" /> 停止
          </button>
        )}
        {state === "done" && (
          <>
            <div className="flex-1 p-4 space-y-3">
              {elapsed >= 60 && (
                <>
                  <label className="text-sm font-medium text-slate-600">
                    專注度評分（1-10）
                  </label>
                  <div className="flex items-center gap-3">
                    <Slider
                      min={1}
                      max={10}
                      step={1}
                      value={[focusScore]}
                      onValueChange={([v]) => setFocusScore(v)}
                      className="flex-1"
                    />
                    <span className="text-lg font-bold w-6 text-center">
                      {focusScore}
                    </span>
                  </div>
                </>
              )}
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={save}
                  variant={"default"}
                  disabled={saving || elapsed < 60}
                >
                  {saving ? "儲存中..." : "儲存紀錄"}
                </Button>
                <Button variant="outline" onClick={reset}>
                  <RotateCcw /> 重置
                </Button>
              </div>
              {elapsed < 60 && (
                <p className="text-xs text-amber-600 text-start">
                  計時不足 1 分鐘，無法儲存
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
