import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  try {
    const { totalMinutes, avgFocus, subjects, sessionCount, period } = await req.json();

    const periodLabel = period === 'day' ? '今天' : period === 'week' ? '本週' : '本月';

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: '你是一位學習顧問，請用繁體中文、友善鼓勵的語氣回答，並以 JSON 格式輸出。',
        },
        {
          role: 'user',
          content: `以下是學生的學習數據：
- 時間範圍：${periodLabel}
- 總讀書時長：${totalMinutes} 分鐘
- 平均專注度：${avgFocus}/10
- 涵蓋科目：${subjects.join('、')}
- 學習次數：${sessionCount} 次

請給出：
1. 一段簡短的專注度評語（2-3句話），放在 "comment" 欄位
2. 3個具體的改善建議，放在 "tips" 陣列`,
        },
      ],
    });

    const result = JSON.parse(completion.choices[0].message.content ?? '{}');
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
