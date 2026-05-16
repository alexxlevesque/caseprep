import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  const db = getDb()
  const rows = db.prepare('SELECT question_id FROM fit_seen').all() as { question_id: string }[]
  return NextResponse.json(rows.map(r => r.question_id))
}

export async function POST(req: Request) {
  const { questionId } = await req.json() as { questionId: string }
  const db = getDb()
  db.prepare('INSERT OR IGNORE INTO fit_seen (question_id, first_seen_at) VALUES (?, ?)').run(questionId, Date.now())
  return NextResponse.json({ ok: true })
}
