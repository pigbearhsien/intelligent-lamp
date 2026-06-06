import { NextRequest, NextResponse } from 'next/server';
import { getGroupById, joinGroup } from '@/lib/excel';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId: rawGroupId } = await params;
    const groupId = rawGroupId.trim().toUpperCase();
    const { studentId } = await req.json();
    if (!studentId?.trim()) {
      return NextResponse.json({ error: '缺少 studentId' }, { status: 400 });
    }
    const existing = await getGroupById(groupId);
    if (!existing) {
      return NextResponse.json({ error: '小組不存在' }, { status: 404 });
    }
    if (existing.members.includes(studentId.trim())) {
      return NextResponse.json({ error: '已在小組中' }, { status: 409 });
    }
    const updated = await joinGroup(groupId, studentId.trim());
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
