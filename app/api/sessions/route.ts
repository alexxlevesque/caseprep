import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function POST(req: Request) {
  const { caseId } = await req.json() as { caseId: string }
  const db = getDb()
  const result = db.prepare(
    'INSERT INTO practice_sessions (case_id, started_at) VALUES (?, ?)'
  ).run(caseId, Date.now())
  return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 })
}
