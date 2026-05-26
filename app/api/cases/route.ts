import { NextResponse } from 'next/server'
import { getAllCaseSummaries } from '@/lib/cases'
import { getDb } from '@/lib/db'

export async function GET() {
  const summaries = getAllCaseSummaries()
  const db = await getDb()

  const enriched = await Promise.all(summaries.map(async c => {
    const result = await db.execute({
      sql: `SELECT MAX(overall_rating) as best_rating, COUNT(*) as attempt_count
            FROM practice_sessions
            WHERE case_id = ? AND overall_rating IS NOT NULL`,
      args: [c.id],
    })
    const row = result.rows[0]
    return {
      ...c,
      bestRating: (row?.best_rating as number | null) ?? null,
      attemptCount: (row?.attempt_count as number) ?? 0,
    }
  }))

  return NextResponse.json(enriched)
}
