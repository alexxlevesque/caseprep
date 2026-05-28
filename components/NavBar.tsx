import Link from 'next/link'

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/cases', label: 'Case Bank' },
  { href: '/drills', label: 'Math Drills' },
  { href: '/exhibits', label: 'Exhibits' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/fit', label: 'Fit Prep' },
  { href: '/frameworks', label: 'Frameworks' },
]

export default function NavBar() {
  return (
    <nav className="bg-slate-800 text-slate-100 px-6 py-3 flex items-center gap-8">
      <span className="text-blue-400 font-bold text-lg tracking-tight">CasePrep</span>
      <div className="flex gap-6 text-sm">
        {links.map(l => (
          <Link key={l.href} href={l.href} className="hover:text-white transition-colors">
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
