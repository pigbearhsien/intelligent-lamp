"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Calendar as BigCalendar,
  dateFnsLocalizer,
  SlotInfo,
  EventProps,
} from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { zhTW } from "date-fns/locale";
import { CalendarIcon, X } from "lucide-react";
import { SUBJECTS } from "@/lib/types";
import type { Exam, Subject } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import "react-big-calendar/lib/css/react-big-calendar.css";

type ExamForm = {
  examDate: string;
  subject: Subject | "";
  examName: string;
  myScore: string;
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales: { "zh-TW": zhTW },
});

const MESSAGES = {
  today: "今天",
  previous: "‹",
  next: "›",
  month: "月",
  week: "週",
  day: "日",
  agenda: "議程",
  date: "日期",
  time: "時間",
  event: "考試",
  noEventsInRange: "這段時間沒有考試",
};

const SUBJECT_COLORS: Record<Subject, string> = {
  國文: "#ef4444",
  英文: "#3b82f6",
  數學: "#8b5cf6",
  物理: "#06b6d4",
  化學: "#10b981",
  生物: "#84cc16",
  歷史: "#f59e0b",
  地理: "#f97316",
  公民: "#ec4899",
  其他: "#6b7280",
};

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Exam;
}

const emptyForm: ExamForm = {
  examDate: "",
  subject: "",
  examName: "",
  myScore: "",
};

function examToForm(exam: Exam): ExamForm {
  return {
    examDate: exam.examDate.slice(0, 10),
    subject: exam.subject,
    examName: exam.examName ?? "",
    myScore: exam.myScore != null ? String(exam.myScore) : "",
  };
}

function ExamModal({
  open,
  exam,
  form,
  saving,
  onChange,
  onSubmit,
  onDelete,
  onClose,
}: {
  open: boolean;
  exam: Exam | null;
  form: ExamForm;
  saving: boolean;
  onChange: (patch: Partial<ExamForm>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {exam ? "編輯考試" : "新增考試"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-600">
              考試日期
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  data-empty={!form.examDate}
                  className="w-full justify-start text-left font-normal border-slate-200 rounded-lg px-3 py-2 text-sm shadow-none bg-white hover:bg-slate-50 data-[empty=true]:text-slate-400"
                >
                  <CalendarIcon />
                  {form.examDate || <span>選擇日期</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={
                    form.examDate
                      ? new Date(form.examDate + "T00:00:00")
                      : undefined
                  }
                  onSelect={(d) =>
                    onChange({ examDate: d ? format(d, "yyyy-MM-dd") : "" })
                  }
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-600">
              考試名稱
            </label>
            <Input
              type="text"
              value={form.examName}
              onChange={(e) => onChange({ examName: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-none"
              required
              placeholder="例：期中考"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-600">科目</label>
            <Select
              value={form.subject}
              onValueChange={(v) => onChange({ subject: v as Subject })}
            >
              <SelectTrigger className="w-full shadow-none border-slate-200 rounded-lg">
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

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-600">成績</label>
            <Input
              type="number"
              value={form.myScore}
              onChange={(e) => onChange({ myScore: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-none"
              placeholder="選填"
            />
          </div>

          <div className="flex gap-2 pt-1">
            {exam && (
              <button
                type="button"
                onClick={onDelete}
                disabled={saving}
                className="py-2 px-3 border border-red-200 rounded-lg text-sm text-red-500 hover:bg-red-50 disabled:opacity-50"
              >
                刪除
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={saving || !form.subject || !form.examName}
              className="flex-1 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-700 disabled:opacity-50"
            >
              {saving ? "儲存中..." : "儲存"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EventComponent({ event }: EventProps<CalendarEvent>) {
  const exam = event.resource;
  const color = SUBJECT_COLORS[exam.subject] ?? "#6b7280";
  return (
    <div
      className="flex items-center gap-1 px-1 py-0.5 rounded text-white text-xs font-medium truncate"
      style={{ backgroundColor: color }}
    >
      <span className="opacity-90 shrink-0">{exam.subject} · </span>
      <span className="truncate">{exam.examName}</span>
    </div>
  );
}

export default function CalendarClient() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [form, setForm] = useState<ExamForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    const data = await fetch("/api/exams").then((r) => r.json());
    setExams(data);
  }

  useEffect(() => {
    void (async () => {
      const data = await fetch("/api/exams").then((r) => r.json());
      setExams(data);
    })();
  }, []);

  const events: CalendarEvent[] = exams.map((exam) => {
    const d = new Date(exam.examDate);
    return {
      id: exam.id,
      title: exam.subject,
      start: d,
      end: d,
      resource: exam,
    };
  });

  const handleSelectSlot = useCallback((slot: SlotInfo) => {
    const d = slot.start instanceof Date ? slot.start : new Date(slot.start);
    setSelectedExam(null);
    setForm({ ...emptyForm, examDate: format(d, "yyyy-MM-dd") });
    setModalOpen(true);
  }, []);

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedExam(event.resource);
    setForm(examToForm(event.resource));
    setModalOpen(true);
  }, []);

  function closeModal() {
    setModalOpen(false);
    setSelectedExam(null);
  }

  async function handleDelete() {
    if (!selectedExam) return;
    setSaving(true);
    await fetch(`/api/exams/${selectedExam.id}`, { method: "DELETE" });
    setSaving(false);
    await load();
    closeModal();
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.subject) return;
    setSaving(true);
    const body = {
      examDate: new Date(form.examDate).toISOString(),
      subject: form.subject,
      examName: form.examName,
      myScore: form.myScore !== "" ? Number(form.myScore) : null,
    };
    if (selectedExam) {
      await fetch(`/api/exams/${selectedExam.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }
    setSaving(false);
    await load();
    closeModal();
  }

  return (
    <>
      <style>{`
        .rbc-calendar { font-family: inherit; }
        .rbc-header { padding: 8px 4px; font-size: 0.75rem; font-weight: 600; color: #64748b; border-bottom: 1px solid #e2e8f0; }
        .rbc-month-view { border: none; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
        .rbc-day-bg + .rbc-day-bg { border-left: 1px solid #f1f5f9; }
        .rbc-month-row + .rbc-month-row { border-top: 1px solid #f1f5f9; }
        .rbc-off-range-bg { background: #f8fafc; }
        .rbc-today { background: #eff6ff; }
        .rbc-date-cell { padding: 4px 8px; font-size: 0.8rem; font-weight: 500; color: #334155; }
        .rbc-date-cell.rbc-now { color: #2563eb; font-weight: 700; }
        .rbc-toolbar { margin-bottom: 16px; gap: 8px; }
        .rbc-toolbar-label { font-size: 1.25rem; font-weight: 700; color: #0f172a; }
        .rbc-btn-group button { border: 1px solid #e2e8f0; background: white; color: #334155; font-size: 0.8rem; padding: 6px 12px; cursor: pointer; transition: background 0.15s; }
        .rbc-btn-group button:hover { background: #f1f5f9; }
        .rbc-btn-group button.rbc-active { background: #0f172a; color: white; border-color: #0f172a; }
        .rbc-event { background: transparent; border: none; padding: 0; margin: 1px 2px; }
        .rbc-event.rbc-selected { background: transparent; }
        .rbc-event:focus { outline: none; }
        .rbc-show-more { font-size: 0.7rem; color: #2563eb; padding: 0 4px; }
        .rbc-row-segment { padding: 1px 2px; }
      `}</style>

      <div className="flex flex-col h-[calc(100vh-80px)]">
        <h1 className="text-2xl font-bold mb-4">行事曆 · 考試紀錄</h1>
        <div className="flex-1 bg-white rounded-xl p-4">
          <BigCalendar
            localizer={localizer}
            events={events}
            culture="zh-TW"
            messages={MESSAGES}
            views={["month"]}
            selectable
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            components={{ event: EventComponent }}
            style={{ height: "100%" }}
            popup
          />
        </div>
      </div>

      <ExamModal
        open={modalOpen}
        exam={selectedExam}
        form={form}
        saving={saving}
        onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
        onClose={closeModal}
      />
    </>
  );
}
