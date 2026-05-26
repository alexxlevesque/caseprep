'use client'
import { useState, useEffect } from 'react'
import type { GeneratedDrill } from '@/types/drill'

const TOPICS: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'percentages', label: 'Percentages' },
  { key: 'margins', label: 'Margins' },
  { key: 'growth', label: 'Growth & CAGR' },
  { key: 'market-sizing', label: 'Market Sizing' },
  { key: 'break-even', label: 'Break-Even' },
  { key: 'unit-economics', label: 'Unit Economics' },
  { key: 'valuation', label: 'Valuation' },
  { key: 'cost-structure', label: 'Cost Structure' },
  { key: 'capacity', label: 'Capacity' },
  { key: 'revenue', label: 'Revenue' },
]

const DIFFICULTIES: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'easy', label: 'Easy' },
  { key: 'medium', label: 'Medium' },
  { key: 'hard', label: 'Hard' },
]

export default function DrillsPage() {
  const [topic, setTopic] = useState('all')
  const [difficulty, setDifficulty] = useState('all')
  const [drill, setDrill] = useState<GeneratedDrill | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [startTime, setStartTime] = useState<number>(0)
  const [loading, setLoading] = useState(false)

  async function fetchDrill(nextTopic = topic, nextDifficulty = difficulty) {
    setLoading(true)
    setRevealed(false)
    const params = new URLSearchParams()
    if (nextTopic !== 'all') params.set('topic', nextTopic)
    if (nextDifficulty !== 'all') params.set('difficulty', nextDifficulty)
    const r = await fetch(`/api/drills?${params}`)
    const d = await r.json() as GeneratedDrill
    setDrill(d)
    setStartTime(Date.now())
    setLoading(false)
  }

  useEffect(() => { fetchDrill() }, [])

  function handleTopicChange(next: string) {
    setTopic(next)
    fetchDrill(next, difficulty)
  }

  function handleDifficultyChange(next: string) {
    setDifficulty(next)
    fetchDrill(topic, next)
  }

  async function handleReveal(correct: boolean) {
    if (!drill) return
    const durationMs = Date.now() - startTime
    setRevealed(true)
    await fetch('/api/drills/attempts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        drillId: drill.drillId,
        drillType: 'randomized',
        topic: drill.topic,
        correct,
        durationMs,
      }),
    })
  }

  const difficultyColor: Record<string, string> = {
    easy: 'text-green-600',
    medium: 'text-yellow-600',
    hard: 'text-red-600',
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-4">Math Drills</h1>

      {/* Topic filter */}
      <div className="flex flex-wrap gap-2 mb-3">
        {TOPICS.map(t => (
          <button
            key={t.key}
            onClick={() => handleTopicChange(t.key)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              topic === t.key
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Difficulty filter */}
      <div className="flex gap-2 mb-6">
        {DIFFICULTIES.map(d => (
          <button
            key={d.key}
            onClick={() => handleDifficultyChange(d.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              difficulty === d.key
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {loading || !drill ? (
        <div className="text-slate-400 text-sm" role="status">Loading drill...</div>
      ) : (
        <div className="space-y-4">
          <div className="bg-slate-800 text-slate-100 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs uppercase tracking-widest text-slate-400">{drill.title}</p>
              <span className={`text-xs font-semibold capitalize ${difficultyColor[drill.difficulty] ?? 'text-slate-400'}`}>
                {drill.difficulty}
              </span>
            </div>
            <p className="text-base leading-relaxed">{drill.question}</p>
          </div>

          {!revealed ? (
            <div className="flex gap-3">
              <button
                onClick={() => handleReveal(true)}
                className="flex-1 bg-green-100 text-green-800 hover:bg-green-200 font-semibold py-3 rounded-xl transition-colors"
              >
                Got it ✓
              </button>
              <button
                onClick={() => handleReveal(false)}
                className="flex-1 bg-red-100 text-red-800 hover:bg-red-200 font-semibold py-3 rounded-xl transition-colors"
              >
                Show answer
              </button>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5 space-y-3">
              <p className="text-xs uppercase tracking-widest text-green-800">
                Answer: <span className="text-lg font-bold text-green-900">{drill.answerFormatted}</span>
              </p>
              <div className="space-y-1">
                {drill.workingSteps.map((step, i) => (
                  <p key={i} className="text-sm text-green-900">{step}</p>
                ))}
              </div>
              <button
                onClick={() => fetchDrill()}
                className="w-full bg-slate-800 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-700 transition-colors mt-2"
              >
                Next Drill →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
