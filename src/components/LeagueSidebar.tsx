// components/LeagueSidebar.tsx

'use client'

import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import clsx from 'clsx'

const links = [
  { label: 'Home', path: '' },
  { label: 'Analytics', path: 'analytics' },
  { label: 'Trades', path: 'trades' },
  { label: 'Stats', path: 'stats' }
]

export default function LeagueSidebar() {
  const { leagueId } = useParams()
  const pathname = usePathname()

  return (
    <aside className="w-48 bg-gray-900 text-white p-4 space-y-4 min-h-screen">
      <h2 className="text-lg font-bold mb-2">League Menu</h2>
      <nav className="flex flex-col space-y-2">
        {links.map(({ label, path }) => {
          const fullPath = `/leagues/${leagueId}/${path}`
          const active = pathname === fullPath || (path === '' && pathname === `/leagues/${leagueId}`)
          return (
            <Link
              key={path}
              href={fullPath}
              className={clsx(
                'px-2 py-1 rounded hover:bg-gray-700',
                active && 'bg-blue-600 text-white'
              )}
            >
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
