import type { ProcessFlowData } from '@/types/exhibit'

export function ProcessFlow({ data }: { data: ProcessFlowData }) {
  const count = data.steps.length
  const W = 480
  const ARROW_W = 14
  const BOX_H = 44
  const boxW = Math.floor((W - 16 - ARROW_W * (count - 1)) / count)

  return (
    <svg viewBox={`0 0 ${W} ${BOX_H + 16}`} className="w-full max-h-24">
      {data.steps.map((step, i) => {
        const x = 8 + i * (boxW + ARROW_W)
        const truncLabel = step.label.length > 11 ? step.label.slice(0, 10) + '…' : step.label
        return (
          <g key={i}>
            <rect x={x} y={8} width={boxW} height={BOX_H} fill="#eff6ff" stroke="#3b82f6" strokeWidth="1.5" rx="4" />
            <text x={x + boxW / 2} y={24} textAnchor="middle" fontSize="9" fill="#1e293b" fontWeight="600">
              {truncLabel}
            </text>
            {step.detail && (
              <text x={x + boxW / 2} y={38} textAnchor="middle" fontSize="8" fill="#3b82f6">
                {step.detail}
              </text>
            )}
            {/* Arrow */}
            {i < count - 1 && (
              <polygon
                points={`${x + boxW + 2},${BOX_H / 2 + 8 - 6} ${x + boxW + ARROW_W - 1},${BOX_H / 2 + 8} ${x + boxW + 2},${BOX_H / 2 + 8 + 6}`}
                fill="#94a3b8"
              />
            )}
          </g>
        )
      })}
    </svg>
  )
}
