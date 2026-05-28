import type { WaterfallData } from '@/types/exhibit'

const TYPE_COLOR: Record<string, string> = {
  start: '#3b82f6',
  up: '#22c55e',
  down: '#ef4444',
  total: '#3b82f6',
}

export function WaterfallChart({ data }: { data: WaterfallData }) {
  const W = 320, H = 110, PAD_T = 22, PAD_B = 22
  const count = data.bars.length
  const barW = Math.max(28, Math.floor((W - 16) / count) - 5)
  const colW = (W - 16) / count

  // Compute running base for each bar
  const bases: number[] = []
  let running = 0
  data.bars.forEach(b => {
    if (b.type === 'start' || b.type === 'total') {
      bases.push(0)
      running = b.value
    } else {
      bases.push(b.value < 0 ? running + b.value : running)
      running += b.value
    }
  })

  const peaks = data.bars.map((b, i) => bases[i] + Math.abs(b.value))
  const maxVal = Math.max(...peaks)
  function sh(v: number) { return (v / maxVal) * H }
  function sy(v: number) { return PAD_T + H - sh(v) }

  return (
    <svg viewBox={`0 0 ${W} ${H + PAD_T + PAD_B}`} className="w-full max-h-48">
      <text x={W / 2} y={13} textAnchor="middle" fontSize="9" fill="#64748b">{data.unit}</text>
      {data.bars.map((b, i) => {
        const x = 8 + i * colW + (colW - barW) / 2
        const bh = Math.max(2, sh(Math.abs(b.value)))
        const y = sy(bases[i] + Math.abs(b.value))
        const label = b.type !== 'start' && b.type !== 'total' && b.value !== 0
          ? (b.value > 0 ? `+${b.value}` : `${b.value}`)
          : `${b.value}`
        const truncLabel = b.label.length > 7 ? b.label.slice(0, 6) + '…' : b.label
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={bh} fill={TYPE_COLOR[b.type]} rx="2" opacity="0.9" />
            <text x={x + barW / 2} y={y - 3} textAnchor="middle" fontSize="8" fill="#1e293b" fontWeight="600">
              {label}
            </text>
            <text x={x + barW / 2} y={PAD_T + H + PAD_B - 4} textAnchor="middle" fontSize="8" fill="#64748b">
              {truncLabel}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
