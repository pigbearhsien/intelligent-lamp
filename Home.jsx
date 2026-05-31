import EnvironmentDisplay from "../components/EnvironmentDisplay";
import FocusComment from "../components/FocusComment";
import StudyTimer from "../components/StudyTimer";
import SubjectTimeTable from "../components/SubjectTimeTable";
import PerformanceChart from "../components/PerformanceChart";

export default function Home() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">學習儀表板</h1>
        <p className="text-muted-foreground text-sm mt-1">掌握你的學習狀態，持續進步</p>
      </div>

      <EnvironmentDisplay />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StudyTimer />
        <FocusComment />
      </div>

      <PerformanceChart />
      <SubjectTimeTable />
    </div>
  );
}