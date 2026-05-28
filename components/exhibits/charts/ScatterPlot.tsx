import type { ScatterData } from '@/types/exhibit'

export function ScatterPlot({ data }: { data: ScatterData }) {
  const xs = data.points.map(p => p.x)
  const ys = data.points.map(p => p.y)
  const xMin = Math.min(...xs), xMax = Math.max(...xs)
  const yMin = Math.min(...ys), yMax = Math.max(...ys)
  const xRange = (xMax - xMin) || 1
  const yRange = (yMax - yMin) || 1
  const W = 260, H = 110
  const PAD_L = 30, PAD_R = 10, PAD_T = 14, PAD_B = 26

  function px(x: number) { return PAD_L + ((x - xMin) / xRange) * (W - PAD_L - PAD_R) }
  function py(y: number) { return PAD_T + ((yMax - y) / yRange) * H }

  return (
    <svg viewBox={`0 0 ${W} ${H + PAD_T + PAD_B}`} className="w-full max-h-48">
      {/* Axes */}
      <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={PAD_T + H} stroke="#cbd5e1" strokeWidth="1" />
      <line x1={PAD_L} y1={PAD_T + H} x2={W - PAD_R} y2={PAD_T + H} stroke="#cbd5e1" strokeWidth="1" />
      {/* Axis labels */}
      <text x={(W - PAD_R + PAD_L) / 2} y={H + PAD_T + PAD_B - 2} textAnchor="middle" fontSize="9" fill="#64748b">
        {data.xLabel}
      </text>
      <text
        x={8} y={PAD_T + H / 2}
        textAnchor="middle" fontSize="9" fill="#64748b"
        transform={`rotate(-90, 8, ${PAD_T + H / 2})`}
      >
        {data.yLabel}
      </text>
      {/* Points */}
      {data.points.map((p, i) => (
        <g key={i}>
          <circle cx={px(p.x)} cy={py(p.y)} r="5" fill="#3b82f6" fillOpacity="0.7" />
          <text x={px(p.x) + 8} y={py(p.y) + 3} fontSize="9" fill="#1e293b">{p.label}</text>
        </g>
      ))}
    </svg>
  )
}
