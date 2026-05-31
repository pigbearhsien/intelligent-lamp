import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import PeriodSelector from "./PeriodSelector";
import { TrendingUp } from "lucide-react";
import { startOfDay, startOfWeek, startOfMonth, startOfYear, format, eachDayOfInterval } from "date-fns";

export default function PerformanceChart() {
  const [period, setPeriod] = useState("week");
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const load = async () => {
      const now = new Date();
      let start;
      if (period === "day") start = startOfDay(now);
      else if (period === "week") start = startOfWeek(now, { weekStartsOn: 1 });
      else if (period === "month") start = startOfMonth(now);
      else if (period === "year") start = startOfYear(now);
      else start = new Date("2000-01-01"); // all

      const [sessions, exams] = await Promise.all([
        period === "all"
          ? base44.entities.StudySession.list('-日期', 500)
          : base44.entities.StudySession.filter({ '日期': { $gte: start.toISOString() } }),
        period === "all"
          ? base44.entities.Exam.list('-考試日期', 500)
          : base44.entities.Exam.filter({ '考試日期': { $gte: start.toISOString() } }),
      ]);

      const parseDuration = (val) => {
        if (!val) return 0;
        if (typeof val === 'number') return val;
        const parts = String(val).split(':');
        if (parts.length === 3) return parseInt(parts[0]) * 60 + parseInt(parts[1]);
        return parseFloat(val) || 0;
      };

      if (period === "day") {
        const hours = Array.from({ length: 24 }, (_, i) => {
          const hourSessions = sessions.filter((s) => new Date(s['日期']).getHours() === i);
          const hourExams = exams.filter((e) => new Date(e['考試日期']).getHours() === i);
          return {
            name: `${i}:00`,
            專注度: hourSessions.length > 0 ? Math.round(hourSessions.reduce((a, b) => a + (b['專注度(1-10)'] || 0), 0) / hourSessions.length * 10) : null,
            成績: hourExams.length > 0 ? Math.round(hourExams.reduce((a, b) => a + (b['我的成績'] || 0), 0) / hourExams.length) : null,
            讀書時長: hourSessions.reduce((a, b) => a + parseDuration(b['總時長(分鐘)']), 0),
          };
        }).filter((d) => d.專注度 !== null || d.讀書時長 > 0 || d.成績 !== null);
        setChartData(hours);
      } else {
        const days = eachDayOfInterval({ start, end: now });
        const data = days.map((day) => {
          const dayStr = format(day, "yyyy-MM-dd");
          const daySessions = sessions.filter((s) => format(new Date(s['日期']), "yyyy-MM-dd") === dayStr);
          const dayExams = exams.filter((e) => format(new Date(e['考試日期']), "yyyy-MM-dd") === dayStr);
          return {
            name: format(day, "MM/dd"),
            專注度: daySessions.length > 0 ? Math.round(daySessions.reduce((a, b) => a + (b['專注度(1-10)'] || 0), 0) / daySessions.length * 10) : null,
            成績: dayExams.length > 0 ? Math.round(dayExams.reduce((a, b) => a + (b['我的成績'] || 0), 0) / dayExams.length) : null,
            讀書時長: daySessions.reduce((a, b) => a + parseDuration(b['總時長(分鐘)']), 0),
          };
        });
        setChartData(data);
      }
    };
    load();
  }, [period]);

  return (
    <div className="bg-card rounded-xl border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-chart-3" />
          <h3 className="font-semibold">學習趨勢</h3>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>
      {chartData.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">尚無數據</p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))" }} />
            <Legend />
            <Line type="monotone" dataKey="專注度" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} connectNulls />
            <Line type="monotone" dataKey="成績" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} connectNulls />
            <Line type="monotone" dataKey="讀書時長" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={false} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}