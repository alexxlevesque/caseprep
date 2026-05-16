'use client'
import { useState, useEffect } from 'react'

interface Framework {
  id: string
  name: string
  trigger: string
  structure: string
}

export default function FrameworksPage() {
  const [frameworks, setFrameworks] = useState<Framework[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/frameworks.json').then(r => r.json()).then(setFrameworks)
  }, [])

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Framework Reference</h1>
      <p className="text-slate-500 mb-6">Click any framework to see its structure.</p>
      <div className="space-y-3">
        {frameworks.map(f => (
          <div key={f.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setActiveId(activeId === f.id ? null : f.id)}
              className="w-full text-left px-5 py-4 flex justify-between items-center"
            >
              <div>
                <p className="font-semibold text-slate-800 text-sm">{f.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{f.trigger}</p>
              </div>
              <span className="text-slate-400 ml-4 flex-shrink-0" aria-hidden="true">{activeId === f.id ? '▲' : '▼'}</span>
            </button>
            {activeId === f.id && (
              <div className="border-t border-slate-100 px-5 pb-5 pt-4 bg-slate-50">
                <pre className="text-sm text-slate-800 whitespace-pre-wrap font-sans leading-relaxed">{f.structure}</pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
