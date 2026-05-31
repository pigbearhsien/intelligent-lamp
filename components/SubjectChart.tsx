"use client";

import { useState } from "react";
import { Bar, BarChart, XAxis, YAxis, LabelList } from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { SUBJECTS } from "@/lib/types";
import type { StudySession } from "@/lib/types";

type Period = "day" | "week" | "month";

const PERIOD_LABELS: Record<Period, string> = {
  day: "今天",
  week: "本週",
  month: "本月",
};

interface SubjectChartProps {
  sessions: StudySession[];
}

const chartConfig = {
  minutes: {
    label: "分鐘",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

function formatMinutes(mins: number) {
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h${mins % 60}m`;
}

export default function SubjectChart({ sessions }: SubjectChartProps) {
  const [period, setPeriod] = useState<Period>("week");

  const now = new Date();
  const filtered = sessions.filter((s) => {
    const d = new Date(s.startTime);
    if (period === "day") return d.toDateString() === now.toDateString();
    if (period === "week") {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      return d >= weekAgo;
    }
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  });

  const bySubject = filtered.reduce<Record<string, number>>((acc, s) => {
    acc[s.subject] = (acc[s.subject] ?? 0) + s.durationMinutes;
    return acc;
  }, {});
  const data = SUBJECTS.map((subject) => ({
    subject,
    minutes: bySubject[subject] ?? 0,
  }));
  const total = data.reduce((sum, d) => sum + d.minutes, 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-700">各科讀書時長</p>
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "px-3 py-1 rounded-md text-sm font-medium transition-colors",
                period === p
                  ? "bg-white shadow text-slate-900"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>
      <ChartContainer config={chartConfig}>
        <BarChart
          accessibilityLayer
          data={data}
          layout="vertical"
          margin={{ left: -15, right: 50 }}
        >
          <XAxis type="number" dataKey="minutes" hide />
          <YAxis
            dataKey="subject"
            type="category"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tick={{ fontSize: 13, fontWeight: 600, fill: "#334155" }}
          />
          <Bar dataKey="minutes" fill="var(--color-minutes)" radius={20}>
            <LabelList
              dataKey="minutes"
              position="insideRight"
              offset={8}
              className="fill-white"
              fontSize={12}
              fontWeight={600}
              formatter={(v) => {
                const mins = Number(v);
                return mins ? formatMinutes(mins) : "";
              }}
            />
          </Bar>
        </BarChart>
      </ChartContainer>
      <div className="border-t border-slate-200 pt-2 flex justify-end text-sm text-slate-500">
        總計：
        <span className="font-semibold text-slate-700 ml-1">
          {formatMinutes(total)}
        </span>
      </div>
    </div>
  );
}
