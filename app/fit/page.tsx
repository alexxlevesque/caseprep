'use client'
import { useState, useEffect } from 'react'

interface FitQuestion {
  id: string
  firm: string
  theme: string
  question: string
  starGuide: string
}

export default function FitPage() {
  const [questions, setQuestions] = useState<FitQuestion[]>([])
  const [seen, setSeen] = useState<Set<string>>(new Set())
  const [activeId, setActiveId] = useState<string | null>(null)
  const [revealed, setRevealed] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/fit-questions.json').then(r => r.json()).then(setQuestions)
    fetch('/api/fit/seen').then(r => r.json()).then((ids: string[]) => setSeen(new Set(ids)))
  }, [])

  async function markSeen(id: string) {
    if (seen.has(id)) return
    setSeen(prev => new Set([...prev, id]))
    await fetch('/api/fit/seen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: id }),
    })
  }

  function toggleReveal(id: string) {
    setRevealed(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
    markSeen(id)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Fit / Behavioral Prep</h1>
      <p className="text-slate-500 mb-6">{seen.size} of {questions.length} questions seen</p>
      <div className="space-y-3">
        {questions.map(q => (
          <div key={q.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <button
              onClick={() => { setActiveId(activeId === q.id ? null : q.id); markSeen(q.id) }}
              className="w-full text-left px-5 py-4 flex justify-between items-center"
            >
              <div>
                <p className="text-xs text-slate-400 mb-1 capitalize">{q.firm} · {q.theme.replace(/-/g, ' ')}</p>
                <p className="text-sm font-medium text-slate-800">{q.question}</p>
              </div>
              <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                {seen.has(q.id) && <span className="text-xs text-green-700 font-medium">Seen</span>}
                <span className="text-slate-400" aria-hidden="true">{activeId === q.id ? '▲' : '▼'}</span>
              </div>
            </button>
            {activeId === q.id && (
              <div className="border-t border-slate-100 px-5 pb-5 pt-4">
                <button
                  onClick={() => toggleReveal(q.id)}
                  className="text-xs text-blue-700 hover:underline mb-3 block"
                >
                  {revealed.has(q.id) ? 'Hide STAR guide' : 'Show STAR guide'}
                </button>
                {revealed.has(q.id) && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <pre className="text-sm text-green-900 whitespace-pre-wrap font-sans leading-relaxed">{q.starGuide}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
