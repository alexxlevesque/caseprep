import type { ValueChainData } from '@/types/exhibit'

export function ValueChain({ data }: { data: ValueChainData }) {
  const maxM = Math.max(...data.stages.map(s => s.margin), 1)
  const W = 320, H = 110
  const count = data.stages.length
  const barW = Math.floor((W - 16) / count) - 4
  const colW = (W - 16) / count

  return (
    <svg viewBox={`0 0 ${W} ${H + 36}`} className="w-full max-h-48">
      {data.stages.map((s, i) => {
        const barH = Math.max(4, (s.margin / maxM) * H)
        const x = 8 + i * colW + (colW - barW) / 2
        const y = H - barH + 8
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} fill="#3b82f6" rx="2" opacity="0.85" />
            <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize="10" fill="#1e293b" fontWeight="700">
              {s.margin > 0 ? `${s.margin}%` : ''}
            </text>
            <text x={x + barW / 2} y={H + 22} textAnchor="middle" fontSize="9" fill="#64748b">
              {s.label.length > 9 ? s.label.slice(0, 8) + '…' : s.label}
            </text>
          </g>
        )
      })}
      {/* Baseline */}
      <line x1={4} y1={H + 8} x2={W - 4} y2={H + 8} stroke="#e2e8f0" strokeWidth="1" />
    </svg>
  )
}
