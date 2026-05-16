'use client'
import { useState, useEffect } from 'react'
import type { CaseCard } from '@/types/case'
import ChecklistSection from './ChecklistSection'

export interface CompletePayload {
  selfRating: number
  checklist: boolean[]
  notes: string
}

interface Props {
  card: CaseCard
  onComplete: (payload: CompletePayload) => void
}

const RATINGS = [
  { value: 1, label: 'Missed it', className: 'bg-red-100 text-red-800 hover:bg-red-200' },
  { value: 2, label: 'Partial', className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' },
  { value: 3, label: 'Nailed it', className: 'bg-green-100 text-green-800 hover:bg-green-200' },
]

export default function CardFlip({ card, onComplete }: Props) {
  const [revealed, setRevealed] = useState(false)
  const [checklist, setChecklist] = useState<boolean[]>(card.checklistItems.map(() => false))
  const [notes, setNotes] = useState('')

  useEffect(() => {
    setRevealed(false)
    setChecklist(card.checklistItems.map(() => false))
    setNotes('')
  }, [card])

  function handleCheck(index: number, value: boolean) {
    setChecklist(prev => prev.map((v, i) => (i === index ? value : v)))
  }

  return (
    <div className="space-y-4">
      <div className="bg-slate-800 text-slate-100 rounded-2xl p-6">
        <p className="text-xs uppercase tracking-widest text-slate-400 mb-3">Interviewer</p>
        <p className="text-base leading-relaxed mb-3">{card.interviewer}</p>
        <p className="text-blue-300 font-medium">{card.question}</p>
      </div>

      {!revealed && (
        <textarea
          aria-label="Notes"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Jot your thinking here (optional)..."
          className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-700 resize-none h-24 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      )}

      {!revealed && (
        <button
          onClick={() => setRevealed(true)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          ↩ Flip — See Model Answer
        </button>
      )}

      {revealed && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 space-y-4">
          <p className="text-xs uppercase tracking-widest text-green-800 mb-1">Model Answer</p>
          <p className="text-sm text-green-900 leading-relaxed whitespace-pre-wrap">{card.modelAnswer}</p>

          <div className="border-t border-green-200 pt-4">
            <ChecklistSection items={card.checklistItems} checked={checklist} onChange={handleCheck} />
          </div>

          <div className="border-t border-green-200 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-green-800 mb-2">Rate this card</p>
            <div className="flex gap-2">
              {RATINGS.map(r => (
                <button
                  key={r.value}
                  onClick={() => onComplete({ selfRating: r.value, checklist, notes })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${r.className}`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
