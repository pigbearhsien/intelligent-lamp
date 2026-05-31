import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Play, Square, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";

const SUBJECTS = ["國文", "英文", "數學", "物理", "化學", "生物", "歷史", "地理", "公民", "其他"];

export default function StudyTimer() {
  const [subject, setSubject] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const handleStart = () => {
    if (!subject) { toast.error("請先選擇科目"); return; }
    setRunning(true);
  };

  const handleStop = async () => {
    setRunning(false);
    clearInterval(intervalRef.current);
    if (seconds < 10) { toast.info("計時太短，未記錄"); return; }
    const minutes = Math.round(seconds / 60);
    const focus = Math.min(100, Math.max(30, 85 - Math.floor(seconds / 600) * 5 + Math.round(Math.random() * 10)));
    const hh = String(Math.floor(minutes / 60)).padStart(2, '0');
    const mm = String(minutes % 60).padStart(2, '0');
    await base44.entities.StudySession.create({
      '科目': subject,
      '總時長(分鐘)': `${hh}:${mm}:00`,
      '專注度(1-10)': Math.round(focus / 10),
      '日期': new Date().toISOString(),
    });
    toast.success(`已記錄 ${subject} ${minutes} 分鐘`);
    setSeconds(0);
  };

  const handleReset = () => {
    setRunning(false);
    clearInterval(intervalRef.current);
    setSeconds(0);
  };

  return (
    <div className="bg-card rounded-xl border p-5 space-y-5">
      <h3 className="font-semibold">學習計時器</h3>
      <Select value={subject} onValueChange={setSubject} disabled={running}>
        <SelectTrigger><SelectValue placeholder="選擇科目" /></SelectTrigger>
        <SelectContent>
          {SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
        </SelectContent>
      </Select>

      <div className="text-center">
        <p className="text-5xl font-mono font-bold tracking-wider text-primary">
          {formatTime(seconds)}
        </p>
        {subject && <p className="text-sm text-muted-foreground mt-2">正在學習：{subject}</p>}
      </div>

      <div className="flex justify-center gap-3">
        {!running ? (
          <Button onClick={handleStart} className="gap-2">
            <Play className="h-4 w-4" /> 開始
          </Button>
        ) : (
          <Button onClick={handleStop} variant="destructive" className="gap-2">
            <Square className="h-4 w-4" /> 停止並記錄
          </Button>
        )}
        <Button onClick={handleReset} variant="outline" size="icon">
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}