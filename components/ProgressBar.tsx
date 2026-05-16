interface Props {
  current: number
  total: number
}

export default function ProgressBar({ current, total }: Props) {
  const pct = total === 0 ? 0 : Math.round((current / total) * 100)
  return (
    <div className="mb-1">
      <div className="flex justify-between text-xs text-slate-500 mb-1">
        <span>Card {current} of {total}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 bg-slate-200 rounded-full">
        <div className="h-1.5 bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
