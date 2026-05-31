import TimerClient from "@/components/TimerClient";
import SubjectChart from "@/components/SubjectChart";
import { getStudySessions } from "@/lib/excel";

export default async function TimerPage() {
  const sessions = await getStudySessions();

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <TimerClient />
      <SubjectChart sessions={sessions} />
    </div>
  );
}
