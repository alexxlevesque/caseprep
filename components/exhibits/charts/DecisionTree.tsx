import type { DecisionTreeData } from '@/types/exhibit'

export function DecisionTree({ data }: { data: DecisionTreeData }) {
  const W = 380

  // BFS layout: assign level and position to each node
  const nodeMap = new Map(data.nodes.map(n => [n.id, n]))
  const levels: string[][] = []
  const visited = new Set<string>()

  function bfs(rootId: string) {
    let queue = [rootId]
    while (queue.length) {
      levels.push([...queue])
      queue.forEach(id => visited.add(id))
      queue = queue.flatMap(id => nodeMap.get(id)?.children?.filter(c => !visited.has(c)) ?? [])
    }
  }
  bfs(data.nodes[0].id)

  const ROW_H = 56
  const H = levels.length * ROW_H + 10
  const positions = new Map<string, { x: number; y: number }>()

  levels.forEach((row, li) => {
    row.forEach((id, i) => {
      positions.set(id, {
        x: (W / (row.length + 1)) * (i + 1),
        y: 20 + li * ROW_H,
      })
    })
  })

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: `${Math.max(200, H + 20)}px` }}>
      {/* Edges */}
      {data.nodes.map(n =>
        (n.children ?? []).map(cid => {
          const from = positions.get(n.id)
          const to = positions.get(cid)
          if (!from || !to) return null
          return (
            <line key={`${n.id}-${cid}`}
              x1={from.x} y1={from.y + 16}
              x2={to.x} y2={to.y - 16}
              stroke="#94a3b8" strokeWidth="1.5" />
          )
        })
      )}
      {/* Nodes */}
      {data.nodes.map(n => {
        const pos = positions.get(n.id)
        if (!pos) return null
        const isLeaf = !n.children?.length
        const nodeW = 110, nodeH = 30
        return (
          <g key={n.id}>
            <rect
              x={pos.x - nodeW / 2} y={pos.y - nodeH / 2}
              width={nodeW} height={nodeH} rx="4"
              fill={isLeaf ? '#f0fdf4' : '#eff6ff'}
              stroke={isLeaf ? '#22c55e' : '#3b82f6'}
              strokeWidth="1.5"
            />
            <text x={pos.x} y={pos.y - 3} textAnchor="middle" fontSize="9" fill="#1e293b" fontWeight="600">
              {n.label.length > 18 ? n.label.slice(0, 17) + '…' : n.label}
            </text>
            {n.value && (
              <text x={pos.x} y={pos.y + 9} textAnchor="middle" fontSize="8" fill="#059669">
                {n.value}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
