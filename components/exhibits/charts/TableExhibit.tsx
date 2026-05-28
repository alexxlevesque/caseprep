import type { TableData } from '@/types/exhibit'

export function TableExhibit({ data }: { data: TableData }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-slate-100">
            {data.headers.map((h, i) => (
              <th
                key={i}
                className={`px-3 py-2 font-semibold text-slate-600 border-b border-slate-200 ${i === 0 ? 'text-left' : 'text-right'}`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, ri) => (
            <tr key={ri} className="border-b border-slate-100 hover:bg-slate-50">
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className={`px-3 py-2 text-slate-700 ${ci === 0 ? 'font-medium' : 'text-right'}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
