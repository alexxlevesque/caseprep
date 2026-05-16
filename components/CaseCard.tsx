import Link from 'next/link'
import type { CaseSummary } from '@/types/case'

const difficultyColors: Record<string, string> = {
  'easy': 'bg-green-100 text-green-800',
  'medium': 'bg-yellow-100 text-yellow-800',
  'medium-hard': 'bg-orange-100 text-orange-800',
  'hard': 'bg-red-100 text-red-800',
}

interface Props {
  case: CaseSummary
  bestRating?: number | null
  attemptCount?: number
}

export default function CaseCard({ case: c, bestRating, attemptCount }: Props) {
  return (
    <Link href={`/cases/${c.id}`} className="block border border-slate-200 rounded-xl p-5 bg-white hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-slate-500 mb-1">Case {c.number} · {c.casebook}</p>
          <h3 className="font-semibold text-slate-900 text-base">{c.title}</h3>
          <p className="text-xs text-slate-500 mt-1">{c.firm}</p>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${difficultyColors[c.difficulty] ?? 'bg-slate-100 text-slate-700'}`}>
          {c.difficulty}
        </span>
      </div>
      <div className="flex flex-wrap gap-1 mt-3">
        {c.topics.map(t => (
          <span key={t} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{t}</span>
        ))}
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
        <span>{c.cardCount} cards</span>
        {attemptCount ? (
          <span className="text-green-700 font-medium">Best: {bestRating}/3 ({attemptCount} attempts)</span>
        ) : (
          <span className="italic">Not started</span>
        )}
      </div>
    </Link>
  )
}
