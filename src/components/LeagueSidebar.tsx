// components/LeagueSidebar.tsx

'use client'

import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import clsx from 'clsx'
import { API_BASE } from '@/lib/config'
import NotificationBadge from './NotificationBadge'
import TeamLogo from './TeamLogo'
import { getUserTeam } from '@/lib/api'
import { getTeamByName } from '@/lib/team-config'



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
  role: string // 'commissioner', 'co-commissioner', 'trade_committee_member', 'user'
  permissions?: Record<string, boolean>
  created_at: string
  updated_at: string
}

interface UserTeam {
  id: number
  name: string
  abbreviation: string
  city: string
  fullName: string
  record?: string
  overall?: number
  rank?: number
  division?: string
  conference?: string
  member?: string
  coach?: string
  offenseScheme?: string
  defenseScheme?: string
  rosterCount?: number
  injuryCount?: number
  capRoom?: number
  spent?: number
  available?: number
}

const links = [
  { label: 'Home', path: '' },
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
      { label: 'Trade Block', path: 'trade-block' },
      { label: 'Trade Analyzer', path: 'trade-tool' }
    ]
  },
  { label: 'Stats', path: 'stats', prefetch: false },
  { label: 'Stats Leaders', path: 'stats-leaders', prefetch: false },
  { label: 'Players', path: 'players', prefetch: false },
  { label: '💬 Chat', path: 'chat', prefetch: false },
  { label: '🔔 Notifications', path: 'notifications', prefetch: false }
]

// Commissioner-only links - Removed duplicate Commissioner Hub entry
const commissionerLinks: Array<{
  label: string
  path: string
  subItems?: Array<{ label: string; path: string }>
}> = []

// Trade Committee links
const tradeCommitteeLinks: Array<{
  label: string
  path: string
  subItems?: Array<{ label: string; path: string }>
}> = [
  { label: '🏛️ Committee Review', path: 'committee/review' }
]

export default function LeagueSidebar() {
  const { leagueId } = useParams()
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [hasCommissionerAccess, setHasCommissionerAccess] = useState(false)
  const [isGlobalCommissioner, setIsGlobalCommissioner] = useState(false)
  const [hasTradeCommitteeAccess, setHasTradeCommitteeAccess] = useState(false)
  const [userTeam, setUserTeam] = useState<UserTeam | null>(null)
  const [teamLoading, setTeamLoading] = useState(false)

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
            setHasTradeCommitteeAccess(true)
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
                const isCoComm = memberData.role === 'co-commissioner'
                const isTradeCommittee = memberData.role === 'trade_committee_member' || isLeagueComm || isCoComm
                console.log('Is league commissioner:', isLeagueComm)
                console.log('Is trade committee member:', isTradeCommittee)
                
                setIsGlobalCommissioner(false)
                setHasCommissionerAccess(isLeagueComm)
                setHasTradeCommitteeAccess(isTradeCommittee)
              } else if (leagueRes.status === 404) {
                // User is not a member of this league
                console.log('User is not a member of this league')
                setIsGlobalCommissioner(false)
                setHasCommissionerAccess(false)
                setHasTradeCommitteeAccess(false)
              } else {
                console.log('Failed to fetch league membership, status:', leagueRes.status)
                // Fallback to global commissioner status for backward compatibility
                setIsGlobalCommissioner(userData.isCommissioner || false)
                setHasCommissionerAccess(userData.isCommissioner || false)
                setHasTradeCommitteeAccess(userData.isCommissioner || false)
              }
            } catch (leagueError) {
              console.error('Error checking league membership:', leagueError)
              // Fallback to global commissioner status for backward compatibility
              setIsGlobalCommissioner(userData.isCommissioner || false)
              setHasCommissionerAccess(userData.isCommissioner || false)
              setHasTradeCommitteeAccess(userData.isCommissioner || false)
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

  // Fetch user's team data
  useEffect(() => {
    const fetchUserTeam = async () => {
      if (!leagueId || typeof leagueId !== 'string') {
        return
      }

      try {
        setTeamLoading(true)
        const teamData = await getUserTeam(leagueId)
        console.log('Raw team data from API:', teamData)
        
        // Handle different response structures
        let userTeamData = null
        if (teamData && teamData.success && teamData.team) {
          // API returns { success: true, team: {...} }
          userTeamData = teamData.team
        } else if (teamData && teamData.id) {
          // API returns team data directly
          userTeamData = teamData
        }
        
        // Ensure we have the required fields for display
        if (userTeamData) {
          // Create a fullName if it doesn't exist
          if (!userTeamData.fullName && userTeamData.city && userTeamData.name) {
            userTeamData.fullName = `${userTeamData.city} ${userTeamData.name}`
          }
          
          // Try to get record from league teams data
          try {
            const leagueResponse = await fetch(`${API_BASE}/leagues/${leagueId}`, {
              credentials: 'include'
            })
            if (leagueResponse.ok) {
              const leagueData = await leagueResponse.json()
              if (leagueData.teams && Array.isArray(leagueData.teams)) {
                const teamWithRecord = leagueData.teams.find(team => 
                  team.id === userTeamData.id || 
                  team.name === userTeamData.name ||
                  team.abbreviation === userTeamData.abbreviation
                )
                if (teamWithRecord && teamWithRecord.record) {
                  userTeamData.record = teamWithRecord.record
                  console.log('Found record from league data:', teamWithRecord.record)
                }
              }
            }
          } catch (recordError) {
            console.log('Could not fetch record from league data:', recordError)
          }
          
          console.log('Processed user team data:', userTeamData)
        }
        
        setUserTeam(userTeamData)
      } catch (error) {
        console.error('Error fetching user team:', error)
        setUserTeam(null)
      } finally {
        setTeamLoading(false)
      }
    }

    fetchUserTeam()
  }, [leagueId])

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
      
      {/* User's Team Link */}
      {userTeam && leagueId && typeof leagueId === 'string' && (() => {
        const teamConfig = getTeamByName(userTeam.name)
        const primaryColor = teamConfig?.colors?.primary || '#00FF00'
        
        // Team panel rendering - team name now in white
        
        return (
          <div className="mb-4 p-2 bg-gray-800 rounded-lg border border-gray-700">
            <Link 
              href={`/leagues/${leagueId}/teams/${userTeam.id}`}
              className="flex items-center gap-3 hover:bg-gray-700 p-2 rounded transition-colors"
              title={`View ${userTeam.fullName} details`}
              onClick={() => {
                console.log('Team link clicked:', {
                  leagueId,
                  teamId: userTeam.id,
                  teamName: userTeam.name,
                  fullName: userTeam.fullName,
                  url: `/leagues/${leagueId}/teams/${userTeam.id}`,
                  userTeamData: userTeam
                })
              }}
            >
              <TeamLogo 
                teamName={userTeam.name}
                size="lg"
                variant="helmet"
                showName={false}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-white truncate">
                  {userTeam.fullName || `${userTeam.city} ${userTeam.name}`}
                </div>
                {userTeam.record && (
                  <div className="text-xs text-gray-400 font-medium">
                    Record: {userTeam.record}
                  </div>
                )}
              </div>
            </Link>
          </div>
        )
      })()}
      
      {/* Loading state for team */}
      {teamLoading && (
        <div className="mb-4 p-2 bg-gray-800 rounded-lg border border-gray-700">
          <div className="flex items-center gap-3 p-2">
            <div className="w-8 h-8 bg-gray-700 rounded-full animate-pulse"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-700 rounded animate-pulse mb-1"></div>
              <div className="h-3 bg-gray-700 rounded animate-pulse w-1/2"></div>
            </div>
          </div>
        </div>
      )}
      
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
                    'px-2 py-1 rounded hover:bg-gray-700 flex-1 text-left flex items-center justify-between',
                    active && 'bg-blue-600 text-white'
                  )}
                >
                  <span>{label}</span>
                  {label === 'Trades' && <NotificationBadge className="ml-2" />}
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
              href={`/leagues/${leagueId}/commissioner`}
              className={clsx(
                'block px-2 py-1 rounded hover:bg-gray-700 text-sm font-medium',
                pathname.includes('/commissioner') && !pathname.includes('/ai-commissioner') && !pathname.includes('/committee') && 'bg-blue-600 text-white'
              )}
            >
              🎯 Commissioner&apos;s Hub
            </Link>
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

        {/* Trade Committee Section */}
        {hasTradeCommitteeAccess && leagueId && typeof leagueId === 'string' && (
          <div className="pt-2 border-t border-gray-700">
            <div className="text-xs text-gray-400 mb-2 px-2">Trade Committee</div>
            {tradeCommitteeLinks.map(({ label, path }) => {
              const active = pathname.includes(`/committee/review`)
              return (
                <Link
                  key={path}
                  href={`/leagues/${leagueId}/${path}`}
                  className={clsx(
                    'block px-2 py-1 rounded hover:bg-gray-700 text-sm font-medium',
                    active && 'bg-blue-600 text-white'
                  )}
                >
                  {label}
                </Link>
              )
            })}
          </div>
        )}
      </nav>
    </aside>
  )
}
