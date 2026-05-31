import { NextResponse } from 'next/server';
import { getEnvironmentReadings } from '@/lib/excel';

export async function GET() {
  try {
    const readings = await getEnvironmentReadings();
    return NextResponse.json(readings);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
