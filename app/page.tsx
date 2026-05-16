import Link from 'next/link'
import { getDb } from '@/lib/db'
import { getAllCaseSummaries } from '@/lib/cases'
import { computeHeatMap, getWeakestCells } from '@/lib/analytics'

export default function DashboardPage() {
  const db = getDb()
  const allCases = getAllCaseSummaries()

  const completedCount = (db.prepare(`
    SELECT COUNT(DISTINCT case_id) as n FROM practice_sessions WHERE overall_rating IS NOT NULL
  `).get() as { n: number }).n

  const recentSessions = db.prepare(`
    SELECT ps.id, ps.case_id, ps.started_at, ps.overall_rating
    FROM practice_sessions ps WHERE ps.overall_rating IS NOT NULL
    ORDER BY ps.started_at DESC LIMIT 5
  `).all() as { id: number; case_id: string; started_at: number; overall_rating: number }[]

  const heatMap = computeHeatMap(db, allCases.map(c => ({ id: c.id, type: c.type })))
  const weakest = getWeakestCells(heatMap, 2)

  const pct = allCases.length > 0 ? Math.round((completedCount / allCases.length) * 100) : 0

  const caseMap = Object.fromEntries(allCases.map(c => [c.id, c.title]))

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* Progress ring */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4">
          <div className="relative w-16 h-16 flex-shrink-0">
            <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90" aria-hidden="true">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15.9" fill="none"
                stroke="#3b82f6" strokeWidth="3"
                strokeDasharray={`${pct} ${100 - pct}`}
                strokeDashoffset="0"
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-700">{pct}%</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">Cases Done</p>
            <p className="text-xs text-slate-500">{completedCount} of {allCases.length}</p>
          </div>
        </div>

        {/* Weakest spots */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 sm:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Focus Areas</p>
          {weakest.length === 0 ? (
            <p className="text-sm text-slate-400 italic">Complete a case to see your weak spots.</p>
          ) : weakest.map(c => (
            <p key={`${c.caseType}-${c.skill}`} className="text-sm text-red-700">
              · <strong>{c.skill}</strong> in <strong>{c.caseType.replace(/-/g, ' ')}</strong> — avg {c.avgRating?.toFixed(1)}/3
            </p>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Link href="/cases" className="block bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-5 transition-colors">
          <p className="font-semibold mb-1">Start a Case</p>
          <p className="text-sm text-blue-100">Browse the Wharton 2017 casebook</p>
        </Link>
        <Link href="/drills" className="block bg-slate-800 hover:bg-slate-700 text-white rounded-xl p-5 transition-colors">
          <p className="font-semibold mb-1">Quick Math Drill</p>
          <p className="text-sm text-slate-300">Randomized case-style calculations</p>
        </Link>
      </div>

      {recentSessions.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Recent Sessions</p>
          <div className="space-y-2">
            {recentSessions.map(s => (
              <div key={s.id} className="flex justify-between text-sm">
                <Link href={`/cases/${s.case_id}`} className="text-slate-700 hover:underline">
                  {caseMap[s.case_id] ?? s.case_id}
                </Link>
                <div className="flex items-center gap-3">
                  <span className={`font-medium ${s.overall_rating === 3 ? 'text-green-700' : s.overall_rating === 2 ? 'text-yellow-700' : 'text-red-700'}`}>
                    {s.overall_rating}/3
                  </span>
                  <span className="text-slate-400">{new Date(s.started_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
