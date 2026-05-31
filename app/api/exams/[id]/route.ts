import { NextRequest, NextResponse } from 'next/server';
import { updateExam, deleteExam } from '@/lib/excel';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const exam = await updateExam(id, body);
    if (!exam) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(exam);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ok = await deleteExam(id);
    if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
