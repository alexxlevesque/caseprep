import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getAllCaseSummaries } from '@/lib/cases'
import { computeHeatMap, getWeakestCells, SKILLS } from '@/lib/analytics'

export async function GET() {
  const db = await getDb()
  const cases = getAllCaseSummaries().map(c => ({ id: c.id, type: c.type }))
  const heatMap = await computeHeatMap(db, cases)
  const weakestCells = getWeakestCells(heatMap, 2)
  const caseTypes = [...new Set(cases.map(c => c.type))]

  const drillResult = await db.execute(`
    SELECT topic,
      ROUND(AVG(correct) * 100) as accuracy,
      AVG(duration_ms) as avg_duration_ms,
      COUNT(*) as attempt_count
    FROM drill_attempts GROUP BY topic
  `)

  return NextResponse.json({
    heatMap,
    caseTypes,
    skills: SKILLS,
    weakestCells,
    drillAccuracy: drillResult.rows.map(r => ({
      topic: r.topic as string,
      accuracy: r.accuracy as number,
      avgDurationMs: r.avg_duration_ms as number,
      attemptCount: r.attempt_count as number,
    })),
  })
}
