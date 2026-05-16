interface Props {
  items: string[]
  checked: boolean[]
  onChange: (index: number, value: boolean) => void
}

export default function ChecklistSection({ items, checked, onChange }: Props) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-green-800 mb-2">Did you hit these?</p>
      <div className="space-y-2">
        {items.map((item, i) => (
          <label key={item} className="flex items-start gap-2 cursor-pointer text-sm text-green-900">
            <input
              type="checkbox"
              checked={checked[i] ?? false}
              onChange={e => onChange(i, e.target.checked)}
              className="mt-0.5 accent-green-700"
            />
            <span>{item}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
