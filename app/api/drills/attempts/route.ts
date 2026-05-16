import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

interface AttemptPayload {
  drillId: string
  drillType: 'real' | 'randomized'
  caseId?: string
  topic: string
  correct: boolean
  durationMs: number
}

export async function POST(req: Request) {
  const body = await req.json() as AttemptPayload
  const db = getDb()
  db.prepare(`
    INSERT INTO drill_attempts (drill_id, drill_type, case_id, topic, correct, duration_ms, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(body.drillId, body.drillType, body.caseId ?? null, body.topic, body.correct ? 1 : 0, body.durationMs, Date.now())
  return NextResponse.json({ ok: true })
}
