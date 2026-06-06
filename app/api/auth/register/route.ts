import { NextRequest, NextResponse } from 'next/server';
import { getUserByStudentId, addUser } from '@/lib/excel';

const VALID = /^[A-Za-z0-9]+$/;

export async function POST(req: NextRequest) {
  try {
    const { studentId, password, displayName } = await req.json();
    const sid = String(studentId ?? '').trim();
    const pwd = String(password ?? '').trim();
    const name = String(displayName ?? '').trim();
    if (!sid || !pwd || !VALID.test(sid) || !VALID.test(pwd)) {
      return NextResponse.json({ error: '學號與密碼只能包含英文字母與數字，且不可為空' }, { status: 400 });
    }
    if (!name) {
      return NextResponse.json({ error: '名字不可為空' }, { status: 400 });
    }
    const existing = await getUserByStudentId(sid);
    if (existing) {
      return NextResponse.json({ error: '帳號已存在' }, { status: 409 });
    }
    await addUser({ studentId: sid, password: pwd, displayName: name });
    return NextResponse.json({ studentId: sid, displayName: name }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
