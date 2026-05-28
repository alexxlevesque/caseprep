import type { LineChartData } from '@/types/exhibit'

const COLORS = ['#3b82f6', '#f59e0b', '#10b981']

export function LineChart({ data }: { data: LineChartData }) {
  const allPoints = data.series.flatMap(s => s.points)
  const min = Math.min(...allPoints)
  const max = Math.max(...allPoints)
  const range = max - min || 1
  const W = 280, H = 100
  const PAD_L = 28, PAD_R = 8, PAD_T = 18, PAD_B = 20
  const xCount = data.xLabels.length

  function gx(i: number) { return PAD_L + (i / (xCount - 1)) * (W - PAD_L - PAD_R) }
  function gy(v: number) { return PAD_T + ((max - v) / range) * H }

  return (
    <svg viewBox={`0 0 ${W} ${H + PAD_T + PAD_B + (data.series.length > 1 ? 18 : 0)}`} className="w-full max-h-48">
      {/* Unit */}
      <text x={PAD_L - 2} y={PAD_T - 6} fontSize="9" fill="#64748b">{data.unit}</text>
      {/* Grid */}
      {[0, 0.5, 1].map(f => (
        <line key={f} x1={PAD_L} x2={W - PAD_R} y1={PAD_T + f * H} y2={PAD_T + f * H}
          stroke="#e2e8f0" strokeWidth="1" />
      ))}
      {/* Series */}
      {data.series.map((s, si) => {
        const pts = s.points.map((v, i) => `${gx(i)},${gy(v)}`).join(' ')
        const col = COLORS[si % COLORS.length]
        return (
          <g key={si}>
            <polyline points={pts} fill="none" stroke={col} strokeWidth="2" />
            {s.points.map((v, i) => (
              <circle key={i} cx={gx(i)} cy={gy(v)} r="3" fill={col} />
            ))}
          </g>
        )
      })}
      {/* X labels */}
      {data.xLabels.map((l, i) => (
        <text key={i} x={gx(i)} y={PAD_T + H + PAD_B - 4} textAnchor="middle" fontSize="9" fill="#64748b">{l}</text>
      ))}
      {/* Legend */}
      {data.series.length > 1 && data.series.map((s, si) => (
        <g key={si}>
          <rect x={PAD_L + si * 80} y={PAD_T + H + PAD_B + 8} width={8} height={4} fill={COLORS[si % COLORS.length]} rx="1" />
          <text x={PAD_L + si * 80 + 11} y={PAD_T + H + PAD_B + 13} fontSize="9" fill="#475569">{s.label}</text>
        </g>
      ))}
    </svg>
  )
}
