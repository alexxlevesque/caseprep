import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getCaseById } from '@/lib/cases'
import { getDb } from '@/lib/db'

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const c = getCaseById(id)
  if (!c) notFound()

  const db = getDb()
  const sessions = db.prepare(`
    SELECT id, started_at, completed_at, overall_rating FROM practice_sessions
    WHERE case_id = ? ORDER BY started_at DESC LIMIT 5
  `).all(id) as { id: number; started_at: number; completed_at: number | null; overall_rating: number | null }[]

  return (
    <div className="max-w-2xl">
      <Link href="/cases" className="text-sm text-blue-600 hover:underline mb-4 block">← Case Bank</Link>

      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
        <p className="text-xs text-slate-400 mb-1">Case {c.number} · {c.casebook}</p>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">{c.title}</h1>
        <p className="text-sm text-slate-500 mb-4">{c.firm}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {c.topics.map(t => (
            <span key={t} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{t}</span>
          ))}
        </div>
        <p className="text-sm text-slate-600">{c.cards.length} cards · {c.difficulty} difficulty</p>
      </div>

      <Link
        href={`/cases/${id}/practice`}
        className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl mb-6 transition-colors"
      >
        Start Practice Session →
      </Link>

      {sessions.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Previous Sessions</h2>
          <div className="space-y-2">
            {sessions.map(s => (
              <div key={s.id} className="flex justify-between text-sm bg-white border border-slate-200 rounded-lg px-4 py-2">
                <span className="text-slate-500">{new Date(s.started_at).toLocaleDateString()}</span>
                <span className="text-slate-700">
                  {s.overall_rating ? `Overall: ${s.overall_rating}/3` : 'Incomplete'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
