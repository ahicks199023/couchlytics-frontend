// components/LeagueSidebar.tsx

'use client'

import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import clsx from 'clsx'
import { API_BASE } from '@/lib/config'
import { checkCommissionerAccess } from '@/lib/api'

const links = [
  { label: 'Home', path: '' },
  { label: 'Analytics', path: 'analytics' },
  { label: 'Schedule', path: 'schedule' },
  { 
    label: 'Trades', 
    path: 'trades',
    subItems: [
      { label: 'Trade History', path: 'trades' },
      { label: 'Submit Trade', path: 'trades/submit' },
      { label: 'Trade Analyzer', path: 'trade-tool' }
    ]
  },
  { label: 'Stats', path: 'stats', prefetch: false },
  { label: 'Stats Leaders', path: 'stats-leaders', prefetch: false },
  { label: 'Players', path: 'players', prefetch: false }
]

export default function LeagueSidebar() {
  const { leagueId } = useParams()
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [hasCommissionerAccess, setHasCommissionerAccess] = useState(false)
  const [isGlobalCommissioner, setIsGlobalCommissioner] = useState(false)

  useEffect(() => {
    const checkAccess = async () => {
      try {
        // Get current user
        const userRes = await fetch(`${API_BASE}/me`, {
          credentials: 'include'
        })
        
        if (userRes.ok) {
          const userData = await userRes.json()
          setIsGlobalCommissioner(userData.is_commissioner || false)
          
          // Check league-specific commissioner access
          if (userData.id && leagueId) {
            const hasAccess = await checkCommissionerAccess(userData.id, leagueId as string)
            setHasCommissionerAccess(hasAccess)
          }
        }
      } catch (error) {
        console.error('Error checking commissioner access:', error)
      }
    }

    checkAccess()
  }, [leagueId])

  const toggleExpanded = (path: string) => {
    setExpandedItems(prev => 
      prev.includes(path) 
        ? prev.filter(item => item !== path)
        : [...prev, path]
    )
  }

  const isActive = (path: string) => {
    const fullPath = `/leagues/${leagueId}/${path}`
    return pathname === fullPath || (path === '' && pathname === `/leagues/${leagueId}`)
  }

  const isSubItemActive = (path: string) => {
    const fullPath = `/leagues/${leagueId}/${path}`
    return pathname === fullPath
  }

  const isCommissionerHubActive = () => {
    return pathname.includes('/commissioner/league/')
  }

  return (
    <aside className="w-48 bg-gray-900 text-white p-4 space-y-4 min-h-screen">
      <h2 className="text-lg font-bold mb-2">League Menu</h2>
      <nav className="flex flex-col space-y-1">
        {links.map(({ label, path, prefetch, subItems }) => {
          const hasSubItems = subItems && subItems.length > 0
          const isExpanded = expandedItems.includes(path)
          const active = isActive(path) || (hasSubItems && subItems.some(sub => isSubItemActive(sub.path)))

          return (
            <div key={path}>
              <div className="flex items-center justify-between">
                <Link
                  href={hasSubItems ? '#' : `/leagues/${leagueId}/${path}`}
                  prefetch={prefetch !== false}
                  onClick={hasSubItems ? (e) => { e.preventDefault(); toggleExpanded(path) } : undefined}
                  className={clsx(
                    'px-2 py-1 rounded hover:bg-gray-700 flex-1 text-left',
                    active && 'bg-blue-600 text-white'
                  )}
                >
                  {label}
                </Link>
                {hasSubItems && (
                  <button
                    onClick={() => toggleExpanded(path)}
                    className={clsx(
                      'px-1 py-1 text-gray-400 hover:text-white transition-transform duration-200',
                      isExpanded && 'rotate-90'
                    )}
                  >
                    ▶
                  </button>
                )}
              </div>
              
              {/* Sub-items */}
              {hasSubItems && isExpanded && (
                <div className="ml-4 mt-1 space-y-1">
                  {subItems.map((subItem) => (
                    <Link
                      key={subItem.path}
                      href={`/leagues/${leagueId}/${subItem.path}`}
                      className={clsx(
                        'block px-2 py-1 rounded text-sm hover:bg-gray-700',
                        isSubItemActive(subItem.path) && 'bg-blue-600 text-white'
                      )}
                    >
                      {subItem.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        })}
        
        {/* Commissioner's Hub - Show if user has access */}
        {(hasCommissionerAccess || isGlobalCommissioner) && (
          <div className="pt-2 border-t border-gray-700">
            <Link
              href={`/commissioner/league/${leagueId}`}
              className={clsx(
                'block px-2 py-1 rounded hover:bg-gray-700 text-sm font-medium',
                isCommissionerHubActive() && 'bg-blue-600 text-white'
              )}
            >
              🏆 Commissioner&apos;s Hub
            </Link>
          </div>
        )}
      </nav>
    </aside>
  )
}
