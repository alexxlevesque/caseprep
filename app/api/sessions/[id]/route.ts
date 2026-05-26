import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { overallRating } = await req.json() as { overallRating: number }
  const db = await getDb()
  await db.execute({
    sql: 'UPDATE practice_sessions SET overall_rating = ?, completed_at = ? WHERE id = ?',
    args: [overallRating, Date.now(), id],
  })
  return NextResponse.json({ ok: true })
}
