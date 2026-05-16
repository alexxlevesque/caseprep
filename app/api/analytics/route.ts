import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getAllCaseSummaries } from '@/lib/cases'
import { computeHeatMap, getWeakestCells, SKILLS } from '@/lib/analytics'

export async function GET() {
  const db = getDb()
  const cases = getAllCaseSummaries().map(c => ({ id: c.id, type: c.type }))
  const heatMap = computeHeatMap(db, cases)
  const weakestCells = getWeakestCells(heatMap, 2)
  const caseTypes = [...new Set(cases.map(c => c.type))]

  const drillRows = db.prepare(`
    SELECT topic,
      ROUND(AVG(correct) * 100) as accuracy,
      AVG(duration_ms) as avg_duration_ms,
      COUNT(*) as attempt_count
    FROM drill_attempts GROUP BY topic
  `).all() as { topic: string; accuracy: number; avg_duration_ms: number; attempt_count: number }[]

  return NextResponse.json({
    heatMap,
    caseTypes,
    skills: SKILLS,
    weakestCells,
    drillAccuracy: drillRows.map(r => ({
      topic: r.topic,
      accuracy: r.accuracy,
      avgDurationMs: r.avg_duration_ms,
      attemptCount: r.attempt_count,
    })),
  })
}
