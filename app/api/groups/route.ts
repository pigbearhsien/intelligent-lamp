import { NextRequest, NextResponse } from 'next/server';
import { getGroups, addGroup } from '@/lib/excel';

export async function GET(req: NextRequest) {
  try {
    const studentId = req.nextUrl.searchParams.get('studentId') ?? '';
    const all = await getGroups();
    const filtered = studentId
      ? all.filter((g) => g.members.includes(studentId))
      : all;
    return NextResponse.json(filtered);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, studentId } = await req.json();
    if (!name?.trim() || !studentId?.trim()) {
      return NextResponse.json({ error: '缺少 name 或 studentId' }, { status: 400 });
    }
    const group = await addGroup({ name: name.trim(), createdBy: studentId.trim() });
    return NextResponse.json(group, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
