import type { CustomerSegmentationData } from '@/types/exhibit'

export function CustomerSegmentation({ data }: { data: CustomerSegmentationData }) {
  const headers = data.segments[0]?.metrics.map(m => m.key) ?? []
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-slate-100">
            <th className="text-left px-2 py-2 font-semibold text-slate-600 border-b border-slate-200">Segment</th>
            {headers.map((h, i) => (
              <th key={i} className="text-right px-2 py-2 font-semibold text-slate-600 border-b border-slate-200">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.segments.map((seg, i) => (
            <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="px-2 py-2 font-medium text-slate-700">{seg.label}</td>
              {seg.metrics.map((m, j) => (
                <td key={j} className="px-2 py-2 text-right text-slate-600">{m.value}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
