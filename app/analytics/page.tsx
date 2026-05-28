import { getDb } from '@/lib/db'
import { getAllCaseSummaries } from '@/lib/cases'
import { computeHeatMap, getWeakestCells, SKILLS } from '@/lib/analytics'
import HeatMap from '@/components/HeatMap'
import Link from 'next/link'

export default async function AnalyticsPage() {
  const db = await getDb()
  const cases = getAllCaseSummaries().map(c => ({ id: c.id, type: c.type }))
  const heatMap = await computeHeatMap(db, cases)
  const weakestCells = getWeakestCells(heatMap, 2)
  const caseTypes = [...new Set(cases.map(c => c.type))]

  const drillResult = await db.execute(`
    SELECT topic, ROUND(AVG(correct) * 100) as accuracy, COUNT(*) as attempt_count
    FROM drill_attempts GROUP BY topic
  `)
  const drillRows = drillResult.rows as unknown as { topic: string; accuracy: number; attempt_count: number }[]

  const exhibitResult = await db.execute(`
    SELECT exhibit_type,
           COUNT(*) as attempt_count,
           ROUND(SUM(CASE WHEN result = 'correct' THEN 1.0 ELSE 0.0 END) * 100 / COUNT(*)) as accuracy
    FROM exhibit_attempts
    GROUP BY exhibit_type
    ORDER BY attempt_count DESC
  `)
  const exhibitRows = exhibitResult.rows as unknown as { exhibit_type: string; attempt_count: number; accuracy: number }[]

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Analytics</h1>

      {weakestCells.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-sm font-semibold text-red-800 mb-2">Focus Areas</p>
          {weakestCells.map(c => (
            <p key={`${c.caseType}-${c.skill}`} className="text-sm text-red-700">
              · <strong>{c.skill}</strong> in <strong>{c.caseType.replace(/-/g, ' ')}</strong> — avg {c.avgRating?.toFixed(1)}/3
            </p>
          ))}
          <Link href="/cases" className="text-xs text-red-700 underline mt-2 block">Browse cases to practice →</Link>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Performance by Case Type × Skill</h2>
        {caseTypes.length === 0 ? (
          <p className="text-sm text-slate-400 italic">Complete a practice session to see your performance data.</p>
        ) : (
          <HeatMap cells={heatMap} caseTypes={caseTypes} skills={SKILLS} />
        )}
      </div>

      {drillRows.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Math Drill Accuracy</h2>
          <div className="space-y-2">
            {drillRows.map(r => (
              <div key={r.topic} className="flex justify-between text-sm">
                <span className="text-slate-600 capitalize">{r.topic.replace(/-/g, ' ')}</span>
                <span className={`font-semibold ${r.accuracy >= 70 ? 'text-green-700' : r.accuracy >= 50 ? 'text-yellow-700' : 'text-red-700'}`}>
                  {r.accuracy}% ({r.attempt_count} attempts)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {exhibitRows.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 mt-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Exhibit Performance</h2>
          <div className="space-y-2">
            {exhibitRows.map(r => (
              <div key={r.exhibit_type} className="flex justify-between text-sm">
                <span className="text-slate-600 capitalize">{r.exhibit_type.replace(/-/g, ' ')}</span>
                <span className={`font-semibold ${r.accuracy >= 70 ? 'text-green-700' : r.accuracy >= 50 ? 'text-yellow-700' : 'text-red-700'}`}>
                  {r.accuracy}% ({r.attempt_count} attempts)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
