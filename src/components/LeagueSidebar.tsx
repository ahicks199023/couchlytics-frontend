// components/LeagueSidebar.tsx

'use client'

import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import clsx from 'clsx'

const links = [
  { label: 'Home', path: '' },
  { label: 'Analytics', path: 'analytics' },
  { label: 'Schedule', path: 'schedule' },
  { label: 'Trades', path: 'trades' },
  { label: 'Trade Tool', path: 'trade-tool' },
  { label: 'Stats', path: 'stats', prefetch: false },
  { label: 'Stats Leaders', path: 'stats-leaders', prefetch: false },
  { label: 'Players', path: 'players', prefetch: false }
]

export default function LeagueSidebar() {
  const { leagueId } = useParams()
  const pathname = usePathname()

  return (
    <aside className="w-48 bg-gray-900 text-white p-4 space-y-4 min-h-screen">
      <h2 className="text-lg font-bold mb-2">League Menu</h2>
      <nav className="flex flex-col space-y-2">
        {links.map(({ label, path, prefetch }) => {
          const fullPath = `/leagues/${leagueId}/${path}`
          const active = pathname === fullPath || (path === '' && pathname === `/leagues/${leagueId}`)
          return (
            <Link
              key={path}
              href={fullPath}
              prefetch={prefetch !== false}
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
