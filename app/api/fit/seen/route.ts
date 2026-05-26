import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  const db = await getDb()
  const result = await db.execute('SELECT question_id FROM fit_seen')
  return NextResponse.json(result.rows.map(r => r.question_id as string))
}

export async function POST(req: Request) {
  const { questionId } = await req.json() as { questionId: string }
  const db = await getDb()
  await db.execute({
    sql: 'INSERT OR IGNORE INTO fit_seen (question_id, first_seen_at) VALUES (?, ?)',
    args: [questionId, Date.now()],
  })
  return NextResponse.json({ ok: true })
}
