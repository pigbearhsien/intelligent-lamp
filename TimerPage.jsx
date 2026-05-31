import StudyTimer from "../components/StudyTimer";
import SubjectTimeTable from "../components/SubjectTimeTable";

export default function TimerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">學習計時</h1>
        <p className="text-muted-foreground text-sm mt-1">選擇科目開始計時，記錄學習歷程</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StudyTimer />
        <SubjectTimeTable />
      </div>
    </div>
  );
}