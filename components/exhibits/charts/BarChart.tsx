import type { BarChartData } from '@/types/exhibit'

export function BarChart({ data }: { data: BarChartData }) {
  const max = Math.max(...data.values)
  const W = 280
  const H = 110
  const PAD_TOP = 22
  const PAD_BOT = 22
  const count = data.labels.length
  const barW = Math.max(20, Math.floor((W - 16) / count) - 6)
  const colW = (W - 16) / count

  return (
    <svg viewBox={`0 0 ${W} ${H + PAD_TOP + PAD_BOT}`} className="w-full max-h-48">
      <text x={W / 2} y={13} textAnchor="middle" fontSize="10" fill="#64748b">{data.unit}</text>
      {data.values.map((v, i) => {
        const barH = Math.max(2, (v / max) * H)
        const x = 8 + i * colW + (colW - barW) / 2
        const y = PAD_TOP + (H - barH)
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} fill="#3b82f6" rx="2" />
            <text x={x + barW / 2} y={PAD_TOP + H + 14} textAnchor="middle" fontSize="9" fill="#64748b">
              {data.labels[i]}
            </text>
            <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize="9" fill="#1e293b" fontWeight="600">
              {v}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
