import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, isAfter } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const SUBJECTS = ["國文", "英文", "數學", "物理", "化學", "生物", "歷史", "地理", "公民", "其他"];
const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];

export default function ExamCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [exams, setExams] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showScore, setShowScore] = useState(null);
  const [form, setForm] = useState({ name: "", subject: "", my_score: "", school_average: "", my_rank: "" });

  const loadExams = async () => {
    const all = await base44.entities.Exam.list("-exam_date", 100);
    setExams(all);
  };

  useEffect(() => { loadExams(); }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = (monthStart.getDay() + 6) % 7;

  const handleAddExam = async () => {
    if (!form.name || !form.subject) { toast.error("請填寫考試名稱和科目"); return; }
    await base44.entities.Exam.create({
      name: form.name,
      subject: form.subject,
      exam_date: selectedDate.toISOString(),
      is_completed: false,
    });
    setShowAdd(false);
    setForm({ name: "", subject: "", my_score: "", school_average: "", my_rank: "" });
    loadExams();
    toast.success("已新增考試");
  };

  const handleSaveScore = async () => {
    await base44.entities.Exam.update(showScore.id, {
      my_score: parseFloat(form.my_score) || 0,
      school_average: parseFloat(form.school_average) || 0,
      my_rank: parseInt(form.my_rank) || 0,
      is_completed: true,
    });
    setShowScore(null);
    setForm({ name: "", subject: "", my_score: "", school_average: "", my_rank: "" });
    loadExams();
    toast.success("成績已儲存");
  };

  const getExamsForDay = (day) => exams.filter((e) => isSameDay(new Date(e.exam_date), day));

  const pendingScoreExams = exams.filter(
    (e) => !e.is_completed && isAfter(new Date(), new Date(e.exam_date))
  );

  const openScoreDialog = (exam) => {
    setForm({ name: "", subject: "", my_score: "", school_average: "", my_rank: "" });
    setShowScore(exam);
  };

  return (
    <div className="bg-card rounded-xl border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">考試行事曆</h3>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[100px] text-center">
            {format(currentMonth, "yyyy 年 MM 月")}
          </span>
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
        {WEEKDAYS.map((d) => (
          <div key={d} className="bg-muted text-center text-xs font-medium py-2 text-muted-foreground">{d}</div>
        ))}
        {Array.from({ length: startPad }).map((_, i) => (
          <div key={`pad-${i}`} className="bg-card p-1 min-h-[60px]" />
        ))}
        {days.map((day) => {
          const dayExams = getExamsForDay(day);
          const isToday = isSameDay(day, new Date());
          return (
            <div
              key={day.toISOString()}
              className={`bg-card p-1 min-h-[60px] cursor-pointer hover:bg-accent/50 transition-colors ${isToday ? "ring-2 ring-primary ring-inset" : ""}`}
              onClick={() => { setSelectedDate(day); setShowAdd(true); }}
            >
              <span className={`text-xs ${isToday ? "font-bold text-primary" : "text-muted-foreground"}`}>
                {format(day, "d")}
              </span>
              {dayExams.map((e) => (
                <div
                  key={e.id}
                  className={`text-[10px] mt-0.5 px-1 rounded truncate cursor-pointer ${
                    e.is_completed ? "bg-green-100 text-green-700" : isAfter(new Date(), new Date(e.exam_date)) ? "bg-amber-100 text-amber-700" : "bg-primary/10 text-primary"
                  }`}
                  onClick={(ev) => {
                    ev.stopPropagation();
                    if (!e.is_completed && isAfter(new Date(), new Date(e.exam_date))) {
                      setForm({ ...form, my_score: "", school_average: "", my_rank: "" });
                      setShowScore(e);
                    }
                  }}
                >
                  {e.name}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Pending scores section */}
      {pendingScoreExams.length > 0 && (
        <div className="border rounded-xl p-4 bg-amber-50 border-amber-200 space-y-3">
          <h4 className="text-sm font-semibold text-amber-800 flex items-center gap-2">
            ✏️ 待輸入成績
            <Badge variant="secondary" className="bg-amber-200 text-amber-800">{pendingScoreExams.length}</Badge>
          </h4>
          <div className="space-y-2">
            {pendingScoreExams.map((exam) => (
              <div key={exam.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-amber-100">
                <div>
                  <span className="text-sm font-medium">{exam.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">{exam.subject} · {format(new Date(exam.exam_date), "MM/dd")}</span>
                </div>
                <Button size="sm" variant="outline" onClick={() => openScoreDialog(exam)} className="text-xs">
                  輸入成績
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add exam dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增考試 — {selectedDate && format(selectedDate, "yyyy/MM/dd")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>考試名稱</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="例：期中考" />
            </div>
            <div>
              <Label>科目</Label>
              <Select value={form.subject} onValueChange={(v) => setForm({ ...form, subject: v })}>
                <SelectTrigger><SelectValue placeholder="選擇科目" /></SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAddExam} className="w-full">新增</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Score input dialog */}
      <Dialog open={!!showScore} onOpenChange={() => setShowScore(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>輸入成績 — {showScore?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>我的成績</Label>
              <Input type="number" value={form.my_score} onChange={(e) => setForm({ ...form, my_score: e.target.value })} />
            </div>
            <div>
              <Label>全校平均成績</Label>
              <Input type="number" value={form.school_average} onChange={(e) => setForm({ ...form, school_average: e.target.value })} />
            </div>
            <div>
              <Label>我的排名</Label>
              <Input type="number" value={form.my_rank} onChange={(e) => setForm({ ...form, my_rank: e.target.value })} />
            </div>
            <Button onClick={handleSaveScore} className="w-full">儲存成績</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}