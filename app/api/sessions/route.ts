import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function POST(req: Request) {
  const { caseId } = await req.json() as { caseId: string }
  const db = await getDb()
  const result = await db.execute({
    sql: 'INSERT INTO practice_sessions (case_id, started_at) VALUES (?, ?)',
    args: [caseId, Date.now()],
  })
  return NextResponse.json({ id: Number(result.lastInsertRowid) }, { status: 201 })
}
