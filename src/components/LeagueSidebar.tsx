// components/LeagueSidebar.tsx

'use client'

import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import clsx from 'clsx'
import { API_BASE } from '@/lib/config'



interface UserData {
  id: number
  email: string
  isAdmin: boolean
  isCommissioner: boolean
  isPremium: boolean
  isDeveloper?: boolean // Developer flag for universal access
}

interface LeagueMember {
  id: number
  league_id: number
  user_id: number
  role: string // 'commissioner', 'member', 'admin'
  permissions?: Record<string, boolean>
  created_at: string
  updated_at: string
}

const links = [
  { label: 'Home', path: '' },
  { label: 'Analytics', path: 'analytics' },
  { label: 'Schedule', path: 'schedule' },
  { 
    label: 'Standings', 
    path: 'standings',
    subItems: [
      { label: 'Conference', path: 'standings' },
      { label: 'Division', path: 'standings/division' }
    ]
  },
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
  { label: 'Players', path: 'players', prefetch: false },
  { label: '💬 Chat', path: 'chat', prefetch: false },
  { label: '🤖 AI Commissioner', path: 'ai-commissioner', prefetch: false }
]

// Commissioner-only links
const commissionerLinks = [
  { 
    label: '⚖️ Commissioner Hub', 
    path: 'commissioner',
    subItems: [
      { label: 'League Management', path: 'commissioner' },
      { label: 'Draft Pick Values', path: 'commissioner/draft-picks' }
    ]
  }
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
        // Don't check access if leagueId is not available
        if (!leagueId || typeof leagueId !== 'string') {
          return
        }

        // Get current user
        const userRes = await fetch(`${API_BASE}/auth/user`, {
          credentials: 'include'
        })
        
        if (userRes.ok) {
          const userData: UserData = await userRes.json()
          console.log('User data received:', userData)
          
          // Check if user is a developer (universal access)
          const isDeveloper = userData.isDeveloper || userData.email === 'antoinehickssales@gmail.com'
          
          if (isDeveloper) {
            // Developer gets universal access to all leagues
            console.log('User is developer - granting universal access')
            setIsGlobalCommissioner(true)
            setHasCommissionerAccess(true)
          } else {
            // Check league-specific commissioner status
            try {
              console.log('Checking league-specific commissioner status for league:', leagueId)
              const leagueRes = await fetch(`${API_BASE}/leagues/${leagueId}/members/me`, {
                credentials: 'include'
              })
              
              if (leagueRes.ok) {
                const memberData: LeagueMember = await leagueRes.json()
                console.log('League member data:', memberData)
                
                const isLeagueComm = memberData.role === 'commissioner' || memberData.role === 'admin'
                console.log('Is league commissioner:', isLeagueComm)
                
                setIsGlobalCommissioner(false)
                setHasCommissionerAccess(isLeagueComm)
              } else if (leagueRes.status === 404) {
                // User is not a member of this league
                console.log('User is not a member of this league')
                setIsGlobalCommissioner(false)
                setHasCommissionerAccess(false)
              } else {
                console.log('Failed to fetch league membership, status:', leagueRes.status)
                // Fallback to global commissioner status for backward compatibility
                setIsGlobalCommissioner(userData.isCommissioner || false)
                setHasCommissionerAccess(userData.isCommissioner || false)
              }
            } catch (leagueError) {
              console.error('Error checking league membership:', leagueError)
              // Fallback to global commissioner status for backward compatibility
              setIsGlobalCommissioner(userData.isCommissioner || false)
              setHasCommissionerAccess(userData.isCommissioner || false)
            }
          }
          
          console.log('Permission check complete - hasCommissionerAccess:', hasCommissionerAccess)
        }
      } catch (error) {
        console.error('Error checking commissioner access:', error)
      }
    }

    checkAccess()
  }, [leagueId, hasCommissionerAccess])

  const toggleExpanded = (path: string) => {
    setExpandedItems(prev => 
      prev.includes(path) 
        ? prev.filter(item => item !== path)
        : [...prev, path]
    )
  }

  const isActive = (path: string) => {
    if (!leagueId || typeof leagueId !== 'string') return false
    const fullPath = `/leagues/${leagueId}/${path}`
    return pathname === fullPath || (path === '' && pathname === `/leagues/${leagueId}`)
  }

  const isSubItemActive = (path: string) => {
    if (!leagueId || typeof leagueId !== 'string') return false
    const fullPath = `/leagues/${leagueId}/${path}`
    return pathname === fullPath
  }



  return (
    <aside className="w-full h-full bg-gray-900 text-white p-4 flex flex-col">
      <h2 className="text-lg font-bold mb-2">League Menu</h2>
      
             {/* Debug Info - Remove this after testing */}
       {process.env.NODE_ENV === 'development' && (
         <div className="text-xs text-gray-500 mb-2 p-2 bg-gray-800 rounded">
           <div>Developer: {isGlobalCommissioner ? 'Yes' : 'No'}</div>
           <div>League Comm: {hasCommissionerAccess ? 'Yes' : 'No'}</div>
           <div>League ID: {leagueId}</div>
         </div>
       )}
      <nav className="flex flex-col space-y-1 flex-1">
        {/* Regular navigation links */}
        {links && links.map(({ label, path, prefetch, subItems }) => {
          const hasSubItems = subItems && subItems.length > 0
          const isExpanded = expandedItems.includes(path)
          const active = isActive(path) || (hasSubItems && subItems.some(sub => isSubItemActive(sub.path)))

          // Don't render links if leagueId is not available
          if (!leagueId || typeof leagueId !== 'string') {
            return null
          }

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

        {/* Commissioner-only navigation links */}
        {(hasCommissionerAccess || isGlobalCommissioner) && commissionerLinks.map(({ label, path, subItems }) => {
          const hasSubItems = subItems && subItems.length > 0
          const isExpanded = expandedItems.includes(path)
          const active = isActive(path) || (hasSubItems && subItems.some(sub => isSubItemActive(sub.path)))

          return (
            <div key={path}>
              <div className="flex items-center justify-between">
                <Link
                  href={hasSubItems ? '#' : `/leagues/${leagueId}/${path}`}
                  prefetch={true}
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
        
        {/* Commissioner Tools Section */}
        {(hasCommissionerAccess || isGlobalCommissioner) && leagueId && typeof leagueId === 'string' && (
          <div className="pt-2 border-t border-gray-700 mt-auto">
            <div className="text-xs text-gray-400 mb-2 px-2">Commissioner Tools</div>
            <Link
              href={`/leagues/${leagueId}/ai-commissioner`}
              className={clsx(
                'block px-2 py-1 rounded hover:bg-gray-700 text-sm font-medium',
                pathname.includes('/ai-commissioner') && 'bg-blue-600 text-white'
              )}
            >
              🤖 AI Commissioner
            </Link>
          </div>
        )}
      </nav>
    </aside>
  )
}
