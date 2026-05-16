// app/cases/[id]/practice/page.tsx
'use client'
import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import type { Case } from '@/types/case'
import CardFlip, { type CompletePayload } from '@/components/CardFlip'
import ProgressBar from '@/components/ProgressBar'

export default function PracticePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [caseData, setCaseData] = useState<Case | null>(null)
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [cardIndex, setCardIndex] = useState(0)
  const [done, setDone] = useState(false)
  const [overallRating, setOverallRating] = useState<number | null>(null)
  const [cardResults, setCardResults] = useState<CompletePayload[]>([])

  useEffect(() => {
    let cancelled = false
    async function init() {
      const caseRes = await fetch(`/api/cases/${id}`)
      const caseJson = await caseRes.json() as Case
      if (cancelled) return
      setCaseData(caseJson)

      const sessRes = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId: id }),
      })
      const sessJson = await sessRes.json() as { id: number }
      if (cancelled) return
      setSessionId(sessJson.id)
    }
    init()
    return () => { cancelled = true }
  }, [id])

  async function handleCardComplete(payload: CompletePayload) {
    await fetch(`/api/sessions/${sessionId!}/cards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cardIndex,
        cardType: caseData!.cards[cardIndex].type,
        selfRating: payload.selfRating,
        checklist: payload.checklist,
        notes: payload.notes,
      }),
    })
    setCardResults(prev => [...prev, payload])
    if (cardIndex + 1 >= caseData!.cards.length) {
      setDone(true)
    } else {
      setCardIndex(i => i + 1)
    }
  }

  async function handleOverallRating(rating: number) {
    if (!sessionId) return
    setOverallRating(rating)
    await fetch(`/api/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ overallRating: rating }),
    })
  }

  if (!caseData || !sessionId) return <div className="text-slate-400 text-sm">Loading...</div>

  if (done) {
    const avg = cardResults.length
      ? (cardResults.reduce((s, r) => s + r.selfRating, 0) / cardResults.length).toFixed(1)
      : '—'
    return (
      <div className="max-w-xl">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Session Complete</h1>
        <p className="text-slate-500 mb-6">{caseData.title} · Average card rating: {avg}/3</p>
        {!overallRating ? (
          <div>
            <p className="font-semibold text-slate-700 mb-3">Overall session rating:</p>
            <div className="flex gap-3">
              {[1, 2, 3].map(r => (
                <button
                  key={r}
                  onClick={() => handleOverallRating(r)}
                  className={`flex-1 py-3 rounded-xl font-semibold text-sm ${
                    r === 1 ? 'bg-red-100 text-red-800 hover:bg-red-200' :
                    r === 2 ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' :
                    'bg-green-100 text-green-800 hover:bg-green-200'
                  }`}
                >
                  {r === 1 ? 'Poor' : r === 2 ? 'Good' : 'Excellent'}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-green-700 font-medium">Rating saved.</p>
            <button onClick={() => router.push(`/cases/${id}`)} className="w-full bg-slate-800 text-white py-3 rounded-xl font-semibold hover:bg-slate-700 transition-colors">
              Back to Case
            </button>
            <button onClick={() => router.push('/analytics')} className="w-full border border-slate-200 text-slate-700 py-3 rounded-xl font-semibold hover:bg-slate-50 transition-colors">
              View Analytics →
            </button>
          </div>
        )}
      </div>
    )
  }

  const card = caseData.cards[cardIndex]

  return (
    <div className="max-w-2xl">
      <div className="mb-4">
        <p className="text-sm text-slate-500 mb-2">{caseData.title}</p>
        <ProgressBar current={cardIndex + 1} total={caseData.cards.length} />
      </div>
      <CardFlip key={cardIndex} card={card} onComplete={handleCardComplete} />
    </div>
  )
}
