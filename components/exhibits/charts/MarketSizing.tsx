import type { MarketSizingData } from '@/types/exhibit'

const COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899']

export function MarketSizing({ data }: { data: MarketSizingData }) {
  const count = data.levels.length
  const W = 280
  const ROW_H = 36
  const H = count * ROW_H + 8

  // Compute bar widths as funnel (first level = full width)
  const first = data.levels[0].value
  function barW(v: number) {
    // Use log scale for very large ranges, linear otherwise
    const range = first / (data.levels[data.levels.length - 1].value || 1)
    if (range > 1000) {
      return Math.max(60, (Math.log(v + 1) / Math.log(first + 1)) * (W - 32)) + 32
    }
    return Math.max(60, (v / first) * (W - 32)) + 32
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-h-48">
      {data.levels.map((level, i) => {
        const bw = Math.min(W, barW(level.value))
        const x = (W - bw) / 2
        const y = i * ROW_H + 4
        const valStr = level.value >= 1000
          ? `${(level.value / 1000).toFixed(0)}K${level.unit}`
          : `${level.value}${level.unit}`
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw} height={ROW_H - 6} fill={COLORS[i % COLORS.length]} rx="4" opacity="0.9" />
            <text x={W / 2} y={y + 12} textAnchor="middle" fontSize="9" fill="white" fontWeight="600">
              {level.label.length > 24 ? level.label.slice(0, 23) + '…' : level.label}
            </text>
            <text x={W / 2} y={y + 23} textAnchor="middle" fontSize="9" fill="white">
              {valStr}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
