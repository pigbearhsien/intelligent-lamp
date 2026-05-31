import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { startOfDay, startOfWeek, startOfMonth, startOfYear } from "date-fns";
import PeriodSelector from "./PeriodSelector";
import { BookOpen } from "lucide-react";

export default function SubjectTimeTable() {
  const [period, setPeriod] = useState("day");
  const [data, setData] = useState({});

  useEffect(() => {
    const load = async () => {
      const now = new Date();
      let start;
      if (period === "day") start = startOfDay(now);
      else if (period === "week") start = startOfWeek(now, { weekStartsOn: 1 });
      else if (period === "month") start = startOfMonth(now);
      else if (period === "year") start = startOfYear(now);
      else start = new Date("2000-01-01");

      const sessions = period === "all"
        ? await base44.entities.StudySession.list('-日期', 500)
        : await base44.entities.StudySession.filter({ 日期: { $gte: start.toISOString() } });
      const grouped = {};
      sessions.forEach((s) => {
        const subj = s["科目"];
        const durStr = s["總時長(分鐘)"] || "0";
        // support HH:MM:SS or plain number
        let mins = 0;
        if (typeof durStr === "string" && durStr.includes(":")) {
          const parts = durStr.split(":");
          mins = parseInt(parts[0]) * 60 + parseInt(parts[1]);
        } else {
          mins = parseFloat(durStr) || 0;
        }
        grouped[subj] = (grouped[subj] || 0) + mins;
      });
      setData(grouped);
    };
    load();
  }, [period]);

  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, v]) => s + v, 0);

  return (
    <div className="bg-card rounded-xl border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">各科讀書時長</h3>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">尚無記錄</p>
      ) : (
        <div className="space-y-2">
          {entries.map(([subject, minutes]) => (
            <div key={subject} className="flex items-center gap-3">
              <span className="text-sm font-medium w-12">{subject}</span>
              <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                <div
                  className="bg-primary/80 h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                  style={{ width: `${Math.max(15, (minutes / Math.max(total, 1)) * 100)}%` }}
                >
                  <span className="text-xs font-medium text-primary-foreground">
                    {minutes >= 60 ? `${Math.floor(minutes / 60)}h${minutes % 60}m` : `${minutes}m`}
                  </span>
                </div>
              </div>
            </div>
          ))}
          <div className="pt-2 border-t text-sm text-muted-foreground text-right">
            總計：{total >= 60 ? `${Math.floor(total / 60)} 小時 ${total % 60} 分鐘` : `${total} 分鐘`}
          </div>
        </div>
      )}
    </div>
  );
}