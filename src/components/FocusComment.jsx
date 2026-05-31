import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Lightbulb, Loader2 } from "lucide-react";
import PeriodSelector from "./PeriodSelector";
import { startOfDay, startOfWeek, startOfMonth } from "date-fns";

export default function FocusComment() {
  const [period, setPeriod] = useState("day");
  const [sessions, setSessions] = useState([]);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const now = new Date();
      let start;
      if (period === "day") start = startOfDay(now);
      else if (period === "week") start = startOfWeek(now, { weekStartsOn: 1 });
      else start = startOfMonth(now);

      const all = await base44.entities.StudySession.filter({ date: { $gte: start.toISOString() } });
      setSessions(all);
    };
    load();
  }, [period]);

  useEffect(() => {
    if (sessions.length === 0) {
      setComment("尚無學習記錄，開始計時來獲得專注度評語吧！");
      return;
    }
    const generate = async () => {
      setLoading(true);
      const totalMin = sessions.reduce((s, x) => s + (x.duration_minutes || 0), 0);
      const avgFocus = sessions.length > 0
        ? Math.round(sessions.reduce((s, x) => s + (x.focus_score || 50), 0) / sessions.length)
        : 0;
      const subjects = [...new Set(sessions.map((s) => s.subject))];

      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `你是一位學習顧問。以下是學生的學習數據：
- 時間範圍：${period === "day" ? "今天" : period === "week" ? "本週" : "本月"}
- 總讀書時長：${totalMin} 分鐘
- 平均專注度：${avgFocus}/100
- 涵蓋科目：${subjects.join("、")}
- 學習次數：${sessions.length} 次

請給出：
1. 一段簡短的專注度評語（2-3句話）
2. 3個具體的改善建議，幫助學生提升專注力

用繁體中文回答，語氣友善鼓勵。`,
        response_json_schema: {
          type: "object",
          properties: {
            comment: { type: "string" },
            tips: { type: "array", items: { type: "string" } },
          },
        },
      });
      setComment(res);
      setLoading(false);
    };
    generate();
  }, [sessions]);

  return (
    <div className="bg-card rounded-xl border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-secondary" />
          <h3 className="font-semibold">專注度評語與建議</h3>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>
      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">正在分析中...</span>
        </div>
      ) : typeof comment === "string" ? (
        <p className="text-sm text-muted-foreground">{comment}</p>
      ) : (
        <div className="space-y-3">
          <p className="text-sm">{comment.comment}</p>
          <div className="space-y-2">
            {comment.tips?.map((tip, i) => (
              <div key={i} className="flex gap-2 text-sm">
                <span className="text-secondary font-bold">{i + 1}.</span>
                <span className="text-muted-foreground">{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}