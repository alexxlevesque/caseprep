import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

interface CardAttemptPayload {
  cardIndex: number
  cardType: string
  selfRating: number
  checklist: boolean[]
  notes?: string
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json() as CardAttemptPayload
  const db = await getDb()

  const existing = await db.execute({
    sql: 'SELECT id FROM card_attempts WHERE session_id = ? AND card_index = ?',
    args: [id, body.cardIndex],
  })

  if (existing.rows[0]) {
    await db.execute({
      sql: `UPDATE card_attempts SET self_rating = ?, checklist_json = ?, notes = ?, revealed_at = ?
            WHERE session_id = ? AND card_index = ?`,
      args: [body.selfRating, JSON.stringify(body.checklist), body.notes ?? null, Date.now(), id, body.cardIndex],
    })
  } else {
    await db.execute({
      sql: `INSERT INTO card_attempts (session_id, card_index, card_type, self_rating, checklist_json, notes, revealed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [id, body.cardIndex, body.cardType, body.selfRating, JSON.stringify(body.checklist), body.notes ?? null, Date.now()],
    })
  }

  return NextResponse.json({ ok: true })
}
