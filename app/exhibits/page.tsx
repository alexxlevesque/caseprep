'use client'
import { useState, useEffect, useCallback } from 'react'
import type { Exhibit } from '@/types/exhibit'
import { ChartRenderer } from '@/components/exhibits/ChartRenderer'

const TYPES: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'bar-chart', label: 'Bar' },
  { key: 'line-graph', label: 'Line' },
  { key: 'scatter-plot', label: 'Scatter' },
  { key: 'waterfall', label: 'Waterfall' },
  { key: 'pie-chart', label: 'Pie' },
  { key: 'table', label: 'Table' },
  { key: 'two-by-two', label: '2×2' },
  { key: 'decision-tree', label: 'Decision' },
  { key: 'process-flow', label: 'Process' },
  { key: 'value-chain', label: 'Value Chain' },
  { key: 'market-sizing', label: 'Market Sizing' },
  { key: 'customer-segmentation', label: 'Segments' },
  { key: 'geographic', label: 'Geographic' },
]

const DIFFICULTIES = [
  { key: 'all', label: 'All' },
  { key: 'easy', label: 'Easy' },
  { key: 'medium', label: 'Medium' },
  { key: 'hard', label: 'Hard' },
]

const DIFF_COLOR: Record<string, string> = {
  easy: 'text-green-600',
  medium: 'text-yellow-600',
  hard: 'text-red-600',
}

export default function ExhibitsPage() {
  const [type, setType] = useState('all')
  const [difficulty, setDifficulty] = useState('all')
  const [exhibit, setExhibit] = useState<Exhibit | null>(null)
  const [side, setSide] = useState<'front' | 'back'>('front')
  const [loading, setLoading] = useState(false)

  const fetchExhibit = useCallback(async (nextType = type, nextDiff = difficulty) => {
    setLoading(true)
    setSide('front')
    const params = new URLSearchParams()
    if (nextType !== 'all') params.set('type', nextType)
    if (nextDiff !== 'all') params.set('difficulty', nextDiff)
    const r = await fetch(`/api/exhibits?${params}`)
    const data = await r.json() as Exhibit
    setExhibit(data)
    setLoading(false)
  }, [type, difficulty])

  useEffect(() => { fetchExhibit() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleTypeChange(next: string) {
    setType(next)
    fetchExhibit(next, difficulty)
  }

  function handleDiffChange(next: string) {
    setDifficulty(next)
    fetchExhibit(type, next)
  }

  async function handleResult(result: 'correct' | 'incorrect') {
    if (!exhibit) return
    await fetch('/api/exhibits/attempts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exhibitId: exhibit.id, exhibitType: exhibit.type, result }),
    })
    fetchExhibit()
  }

  const pillBase = 'px-3 py-1 rounded-full text-xs font-medium transition-colors'
  const pillActive = 'bg-slate-800 text-white'
  const pillInactive = 'bg-slate-100 text-slate-600 hover:bg-slate-200'

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-4">Exhibit Practice</h1>

      {/* Type filter */}
      <div className="flex flex-wrap gap-2 mb-3">
        {TYPES.map(t => (
          <button key={t.key} onClick={() => handleTypeChange(t.key)}
            className={`${pillBase} ${type === t.key ? pillActive : pillInactive}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Difficulty filter */}
      <div className="flex gap-2 mb-6">
        {DIFFICULTIES.map(d => (
          <button key={d.key} onClick={() => handleDiffChange(d.key)}
            className={`${pillBase} ${difficulty === d.key ? pillActive : pillInactive}`}>
            {d.label}
          </button>
        ))}
      </div>

      {loading || !exhibit ? (
        <div className="text-slate-400 text-sm" role="status">Loading exhibit…</div>
      ) : (
        <div className="space-y-4">
          {/* Card */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <p className="text-sm font-semibold text-slate-700">{exhibit.title}</p>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 capitalize">{exhibit.type.replace(/-/g, ' ')}</span>
                <span className={`text-xs font-semibold capitalize ${DIFF_COLOR[exhibit.difficulty] ?? 'text-slate-400'}`}>
                  {exhibit.difficulty}
                </span>
              </div>
            </div>

            {/* Context */}
            <p className="px-5 text-xs text-slate-500 italic mb-3">{exhibit.context}</p>

            {/* Chart */}
            <div className="px-5 pb-3">
              <ChartRenderer exhibit={exhibit} />
            </div>

            {/* Question */}
            <div className="mx-5 mb-4 bg-blue-50 border border-blue-100 rounded-xl p-3">
              <p className="text-sm text-blue-900 font-medium">❓ {exhibit.question}</p>
            </div>

            {/* Front: flip button */}
            {side === 'front' && (
              <div className="px-5 pb-5">
                <button
                  onClick={() => setSide('back')}
                  className="w-full bg-slate-800 text-white py-3 rounded-xl font-semibold text-sm hover:bg-slate-700 transition-colors"
                >
                  Flip to reveal answer ↓
                </button>
              </div>
            )}

            {/* Back: answer */}
            {side === 'back' && (
              <div className="border-t border-slate-200 bg-slate-50 px-5 py-4 space-y-3">
                {/* Insights */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Key Insights</p>
                  <ul className="space-y-1">
                    {exhibit.answer.insights.map((ins, i) => (
                      <li key={i} className="text-sm text-slate-800 flex gap-2">
                        <span className="text-blue-500 shrink-0">·</span>
                        <span>{ins}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {/* Calculation */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Calculation</p>
                  <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-0.5">
                    {exhibit.answer.calculation.map((step, i) => (
                      <p key={i} className="text-sm text-slate-700 font-mono">{step}</p>
                    ))}
                  </div>
                </div>
                {/* Buttons */}
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => handleResult('correct')}
                    className="flex-1 bg-green-100 text-green-800 hover:bg-green-200 font-semibold py-3 rounded-xl transition-colors text-sm"
                  >
                    ✓ Got it
                  </button>
                  <button
                    onClick={() => handleResult('incorrect')}
                    className="flex-1 bg-red-100 text-red-800 hover:bg-red-200 font-semibold py-3 rounded-xl transition-colors text-sm"
                  >
                    ✗ Missed it
                  </button>
                </div>
                <button
                  onClick={() => fetchExhibit()}
                  className="w-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 py-2.5 rounded-xl text-sm transition-colors"
                >
                  Next Exhibit →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
