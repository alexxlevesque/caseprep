import { getAllCaseSummaries } from '@/lib/cases'
import { getDb } from '@/lib/db'
import CaseCard from '@/components/CaseCard'

export default async function CasesPage() {
  const summaries = getAllCaseSummaries()
  const db = await getDb()

  const enriched = await Promise.all(summaries.map(async c => {
    const result = await db.execute({
      sql: `SELECT MAX(overall_rating) as best_rating, COUNT(*) as attempt_count
            FROM practice_sessions WHERE case_id = ? AND overall_rating IS NOT NULL`,
      args: [c.id],
    })
    const row = result.rows[0]
    return {
      ...c,
      bestRating: (row?.best_rating as number | null) ?? null,
      attemptCount: (row?.attempt_count as number) ?? 0,
    }
  }))

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Case Bank</h1>
      <p className="text-slate-500 mb-6">Wharton Consulting Club Casebook 2017 · {enriched.length} cases</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {enriched.map(c => (
          <CaseCard key={c.id} case={c} bestRating={c.bestRating} attemptCount={c.attemptCount} />
        ))}
      </div>
    </div>
  )
}
