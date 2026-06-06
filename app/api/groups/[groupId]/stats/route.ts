import { NextRequest, NextResponse } from 'next/server';
import { getGroupById, getStudySessions } from '@/lib/excel';
import { isInPeriod } from '@/lib/period';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId: rawGroupId } = await params;
    const groupId = rawGroupId.trim().toUpperCase();
    const group = await getGroupById(groupId);
    if (!group) {
      return NextResponse.json({ error: '小組不存在' }, { status: 404 });
    }

    const allSessions = await getStudySessions();
    const now = new Date();
    const byStudent = new Map<string, { day: number; week: number; month: number }>();
    for (const sid of group.members) {
      byStudent.set(sid, { day: 0, week: 0, month: 0 });
    }
    for (const s of allSessions) {
      const acc = s.studentId ? byStudent.get(s.studentId) : undefined;
      if (!acc) continue;
      const d = new Date(s.startTime);
      if (isInPeriod(d, 'day', now)) acc.day += s.durationMinutes;
      if (isInPeriod(d, 'week', now)) acc.week += s.durationMinutes;
      if (isInPeriod(d, 'month', now)) acc.month += s.durationMinutes;
    }

    const stats = group.members.map((studentId) => {
      const acc = byStudent.get(studentId)!;
      return {
        studentId,
        dayMinutes: acc.day,
        weekMinutes: acc.week,
        monthMinutes: acc.month,
      };
    });

    return NextResponse.json(stats);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
