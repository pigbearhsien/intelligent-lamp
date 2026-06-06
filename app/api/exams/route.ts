import { NextRequest, NextResponse } from 'next/server';
import { getExams, addExam } from '@/lib/excel';

export async function GET(req: NextRequest) {
  try {
    const studentId = req.nextUrl.searchParams.get('studentId') ?? undefined;
    const exams = await getExams(studentId);
    return NextResponse.json(exams);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const exam = await addExam(body);
    return NextResponse.json(exam, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
