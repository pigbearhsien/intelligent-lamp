import ExamCalendar from "../components/ExamCalendar";

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">考試行事曆</h1>
        <p className="text-muted-foreground text-sm mt-1">管理考試日期與成績記錄</p>
      </div>
      <ExamCalendar />
    </div>
  );
}