import type { HeatMapCell } from '@/types/analytics'

interface Props {
  cells: HeatMapCell[]
  caseTypes: string[]
  skills: string[]
}

function cellColor(avg: number | null): string {
  if (avg === null) return 'bg-slate-100 text-slate-500'
  if (avg < 1.8) return 'bg-red-100 text-red-800'
  if (avg < 2.4) return 'bg-yellow-100 text-yellow-800'
  return 'bg-green-100 text-green-800'
}

export default function HeatMap({ cells, caseTypes, skills }: Props) {
  function getCell(caseType: string, skill: string): HeatMapCell | undefined {
    return cells.find(c => c.caseType === caseType && c.skill === skill)
  }

  return (
    <div className="overflow-x-auto">
      <table className="border-collapse text-sm w-full">
        <thead>
          <tr>
            <th className="p-2 text-left text-slate-500 font-medium text-xs" />
            {skills.map(s => (
              <th key={s} className="p-2 text-center text-slate-600 font-medium text-xs whitespace-nowrap">{s}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {caseTypes.map(ct => (
            <tr key={ct}>
              <td className="p-2 text-xs font-semibold text-slate-700 whitespace-nowrap pr-4 capitalize">{ct.replace(/-/g, ' ')}</td>
              {skills.map(skill => {
                const cell = getCell(ct, skill)
                return (
                  <td key={skill} className="p-1 text-center">
                    <div className={`rounded-lg py-2 px-3 text-xs font-semibold ${cellColor(cell?.avgRating ?? null)}`}>
                      {cell?.avgRating != null ? cell.avgRating.toFixed(1) : '—'}
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-4 mt-3 text-xs text-slate-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 inline-block" aria-hidden="true" /> <span className="text-slate-600">Below 1.8 — needs work</span></span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-100 inline-block" aria-hidden="true" /> <span className="text-slate-600">1.8–2.4 — developing</span></span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 inline-block" aria-hidden="true" /> <span className="text-slate-600">Above 2.4 — strong</span></span>
      </div>
    </div>
  )
}
