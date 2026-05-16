import type Database from 'better-sqlite3'
import type { HeatMapCell } from '@/types/analytics'

const SKILL_TO_CARD_TYPES: Record<string, string[]> = {
  'Framework': ['framework'],
  'Math': ['math'],
  'Graphical Interpretation': ['exhibit'],
  'Recommendation': ['recommendation'],
  'Clarifying Questions': ['prompt', 'clarifying-qa'],
}

export const SKILLS = Object.keys(SKILL_TO_CARD_TYPES)

export function computeHeatMap(
  db: Database.Database,
  cases: { id: string; type: string }[]
): HeatMapCell[] {
  const caseTypeMap: Record<string, string[]> = {}
  for (const c of cases) {
    if (!caseTypeMap[c.type]) caseTypeMap[c.type] = []
    caseTypeMap[c.type].push(c.id)
  }

  const cells: HeatMapCell[] = []

  for (const [caseType, caseIds] of Object.entries(caseTypeMap)) {
    const placeholders = caseIds.map(() => '?').join(',')
    for (const [skill, cardTypes] of Object.entries(SKILL_TO_CARD_TYPES)) {
      const cardTypePlaceholders = cardTypes.map(() => '?').join(',')
      const row = db.prepare(`
        SELECT AVG(ca.self_rating) as avg_rating, COUNT(*) as attempt_count
        FROM card_attempts ca
        JOIN practice_sessions ps ON ca.session_id = ps.id
        WHERE ps.case_id IN (${placeholders})
          AND ca.card_type IN (${cardTypePlaceholders})
          AND ca.self_rating IS NOT NULL
      `).get([...caseIds, ...cardTypes]) as { avg_rating: number | null; attempt_count: number }

      cells.push({
        caseType,
        skill,
        avgRating: row.avg_rating,
        attemptCount: row.attempt_count,
      })
    }
  }

  return cells
}

export function getWeakestCells(cells: HeatMapCell[], n: number): HeatMapCell[] {
  return cells
    .filter(c => c.avgRating !== null)
    .sort((a, b) => (a.avgRating ?? 99) - (b.avgRating ?? 99))
    .slice(0, n)
}
