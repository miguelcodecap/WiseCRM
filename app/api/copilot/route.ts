import { NextResponse } from 'next/server';

/**
 * Wise Copilot endpoint. The browser sends a question plus a compact snapshot of
 * the CRM; the server adds the API key (never exposed to the client) and asks Claude.
 * Without ANTHROPIC_API_KEY it answers { configured: false } and the UI falls back to built-in rules.
 */

const MAX_QUESTION = 500;
const MAX_CONTEXT = 24_000;

const SYSTEM = `You are Wise Copilot, the assistant inside WiseCRM, a sales CRM.
Answer using ONLY the CRM snapshot provided. If the data does not contain the answer, say so.
Be concise and practical: 2-5 sentences or a short list. Use US dollar formatting.
When suggesting actions, name the specific deal or task. Never invent clients, numbers or dates.
Metric definitions: weighted forecast = sum of open deal value × stage probability;
win rate = won ÷ (won + lost); sales velocity = open deals × win rate × average deal size ÷ average sales cycle days.`;

export async function POST(req: Request) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return NextResponse.json({ configured: false });

  let body: { question?: unknown; context?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const question = typeof body.question === 'string' ? body.question.trim().slice(0, MAX_QUESTION) : '';
  const context = JSON.stringify(body.context ?? {}).slice(0, MAX_CONTEXT);
  if (!question) return NextResponse.json({ error: 'Missing question' }, { status: 400 });

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5',
        max_tokens: 600,
        system: SYSTEM,
        messages: [{ role: 'user', content: `CRM snapshot (JSON):\n${context}\n\nQuestion: ${question}` }],
      }),
    });
    if (!res.ok) return NextResponse.json({ error: `AI request failed (${res.status})` }, { status: 502 });
    const json = (await res.json()) as { content?: { type: string; text?: string }[] };
    const answer = json.content?.find((b) => b.type === 'text')?.text?.trim();
    if (!answer) return NextResponse.json({ error: 'Empty AI response' }, { status: 502 });
    return NextResponse.json({ answer });
  } catch {
    return NextResponse.json({ error: 'AI service unreachable' }, { status: 502 });
  }
}
