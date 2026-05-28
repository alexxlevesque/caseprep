import type { GeographicData } from '@/types/exhibit'

export function GeographicBreakdown({ data }: { data: GeographicData }) {
  const max = Math.max(...data.regions.map(r => r.value))
  return (
    <div className="space-y-1.5 py-1">
      {data.regions.map((r, i) => {
        const pct = (r.value / max) * 100
        return (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-28 text-right text-slate-500 shrink-0 truncate">{r.label}</span>
            <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
              <div
                className="bg-blue-500 h-4 rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-20 text-slate-700 font-semibold shrink-0 text-right">
              {r.value.toLocaleString()}{r.unit}
            </span>
          </div>
        )
      })}
    </div>
  )
}
