import { NextRequest, NextResponse } from 'next/server';
import { getStudySessions, addStudySession } from '@/lib/excel';

export async function GET() {
  try {
    const sessions = await getStudySessions();
    return NextResponse.json(sessions);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const session = await addStudySession(body);
    return NextResponse.json(session, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
