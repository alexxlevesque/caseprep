import type { TwoByTwoData } from '@/types/exhibit'

const DOT_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#f43f5e', '#8b5cf6']

export function TwoByTwo({ data }: { data: TwoByTwoData }) {
  const W = 240, H = 190
  const CX = W / 2, CY = H / 2

  // Spread items within their quadrant with jitter to avoid overlap
  const quadrantItems: Record<string, { label: string; idx: number }[]> = {
    'high-high': [], 'low-high': [], 'high-low': [], 'low-low': [],
  }
  data.items.forEach((item, idx) => {
    quadrantItems[`${item.x}-${item.y}`].push({ label: item.label, idx })
  })

  function getPos(item: { label: string; idx: number }, key: string, itemIdx: number, total: number) {
    const [xSide, ySide] = key.split('-')
    const baseCX = xSide === 'high' ? CX + CX / 2 : CX / 2
    const baseCY = ySide === 'high' ? CY / 2 : CY + CY / 2
    const offsets = total === 1 ? [[0, 0]] : [[-18, -10], [18, 10], [0, 0], [-18, 10], [18, -10]]
    const [ox, oy] = offsets[itemIdx % offsets.length] as [number, number]
    return { x: baseCX + ox, y: baseCY + oy }
  }

  const positioned: { label: string; x: number; y: number; idx: number }[] = []
  for (const [key, items] of Object.entries(quadrantItems)) {
    items.forEach((item, i) => {
      const pos = getPos(item, key, i, items.length)
      positioned.push({ ...pos, label: item.label, idx: item.idx })
    })
  }

  return (
    <svg viewBox={`0 0 ${W} ${H + 20}`} className="w-full max-h-52">
      {/* Background quadrants */}
      <rect x={0} y={0} width={CX} height={CY} fill="#f0fdf4" />
      <rect x={CX} y={0} width={CX} height={CY} fill="#eff6ff" />
      <rect x={0} y={CY} width={CX} height={CY} fill="#fefce8" />
      <rect x={CX} y={CY} width={CX} height={CY} fill="#fff1f2" />
      {/* Dividers */}
      <line x1={CX} y1={0} x2={CX} y2={H} stroke="#cbd5e1" strokeWidth="1.5" />
      <line x1={0} y1={CY} x2={W} y2={CY} stroke="#cbd5e1" strokeWidth="1.5" />
      {/* Axis labels */}
      <text x={CX / 2} y={H + 14} textAnchor="middle" fontSize="9" fill="#64748b">Low {data.xLabel}</text>
      <text x={CX + CX / 2} y={H + 14} textAnchor="middle" fontSize="9" fill="#64748b">High {data.xLabel}</text>
      {/* Items */}
      {positioned.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="20" fill={DOT_COLORS[p.idx % DOT_COLORS.length]} fillOpacity="0.15"
            stroke={DOT_COLORS[p.idx % DOT_COLORS.length]} strokeWidth="1.5" />
          <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize="9" fill="#1e293b" fontWeight="600">
            {p.label.length > 10 ? p.label.slice(0, 9) + '…' : p.label}
          </text>
        </g>
      ))}
      {/* Y axis label (rotated) */}
      <text x={6} y={CY / 2} textAnchor="middle" fontSize="9" fill="#64748b"
        transform={`rotate(-90, 6, ${CY / 2})`}>High {data.yLabel}</text>
      <text x={6} y={CY + CY / 2} textAnchor="middle" fontSize="9" fill="#64748b"
        transform={`rotate(-90, 6, ${CY + CY / 2})`}>Low {data.yLabel}</text>
    </svg>
  )
}
