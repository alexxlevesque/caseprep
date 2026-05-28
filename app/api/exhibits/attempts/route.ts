import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

interface AttemptPayload {
  exhibitId: string
  exhibitType: string
  result: 'correct' | 'incorrect'
}

export async function POST(req: Request) {
  const body = await req.json() as AttemptPayload
  const db = await getDb()
  const r = await db.execute({
    sql: `INSERT INTO exhibit_attempts (exhibit_id, exhibit_type, result, attempted_at)
          VALUES (?, ?, ?, ?)`,
    args: [body.exhibitId, body.exhibitType, body.result, Date.now()],
  })
  return NextResponse.json({ id: Number(r.lastInsertRowid) }, { status: 201 })
}
