import type { PieData } from '@/types/exhibit'

const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#f43f5e', '#8b5cf6']

export function PieChart({ data }: { data: PieData }) {
  const total = data.slices.reduce((s, sl) => s + sl.value, 0)
  const CX = 85, CY = 85, R = 68

  let angle = -Math.PI / 2

  return (
    <svg viewBox="0 0 240 190" className="w-full max-h-48">
      {data.slices.map((sl, i) => {
        const sweep = (sl.value / total) * 2 * Math.PI
        const x1 = CX + R * Math.cos(angle)
        const y1 = CY + R * Math.sin(angle)
        angle += sweep
        const x2 = CX + R * Math.cos(angle)
        const y2 = CY + R * Math.sin(angle)
        const midA = angle - sweep / 2
        const lx = CX + R * 0.62 * Math.cos(midA)
        const ly = CY + R * 0.62 * Math.sin(midA)
        const large = sweep > Math.PI ? 1 : 0
        const pct = Math.round((sl.value / total) * 100)
        return (
          <g key={i}>
            <path
              d={`M ${CX} ${CY} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${R} ${R} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`}
              fill={COLORS[i % COLORS.length]}
            />
            {pct >= 7 && (
              <text x={lx} y={ly + 4} textAnchor="middle" fontSize="11" fill="white" fontWeight="700">
                {pct}%
              </text>
            )}
          </g>
        )
      })}
      {/* Legend */}
      {data.slices.map((sl, i) => (
        <g key={i}>
          <rect x={174} y={18 + i * 22} width={10} height={10} fill={COLORS[i % COLORS.length]} rx="2" />
          <text x={188} y={27 + i * 22} fontSize="10" fill="#1e293b">{sl.label}</text>
        </g>
      ))}
    </svg>
  )
}
