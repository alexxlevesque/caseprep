import { NextResponse } from 'next/server'
import { getAllCaseSummaries } from '@/lib/cases'
import { getDb } from '@/lib/db'

export async function GET() {
  const summaries = getAllCaseSummaries()
  const db = getDb()

  const enriched = summaries.map(c => {
    const row = db.prepare(`
      SELECT MAX(overall_rating) as best_rating, COUNT(*) as attempt_count
      FROM practice_sessions
      WHERE case_id = ? AND overall_rating IS NOT NULL
    `).get(c.id) as { best_rating: number | null; attempt_count: number }

    return { ...c, bestRating: row.best_rating, attemptCount: row.attempt_count }
  })

  return NextResponse.json(enriched)
}
