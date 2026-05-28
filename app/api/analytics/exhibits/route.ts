import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  const db = await getDb()
  const result = await db.execute(`
    SELECT exhibit_type,
           COUNT(*) as attempt_count,
           ROUND(SUM(CASE WHEN result = 'correct' THEN 1.0 ELSE 0.0 END) * 100 / COUNT(*)) as accuracy
    FROM exhibit_attempts
    GROUP BY exhibit_type
    ORDER BY attempt_count DESC
  `)
  const rows = result.rows as unknown as { exhibit_type: string; attempt_count: number; accuracy: number }[]
  return NextResponse.json(rows)
}
