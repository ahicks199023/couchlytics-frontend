'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { API_BASE, authenticatedFetch } from '@/lib/config'
import { TeamDetailResponse } from '@/types/analytics'
import { getTeamByName, getTeamByPartialName } from '@/lib/team-config'
import TeamLogo from '@/components/TeamLogo'

// Schedule item interface
interface ScheduleItem {
  week: number
  weekLabel?: string  // Add weekLabel field for special week labels
  home: string
  away: string
  opponent: string
  isHome: boolean
  score?: string | null
  result?: 'W' | 'L' | 'T' | null
  gameId: number
}

// Helper function to format currency values (values are already in millions)
const formatCurrencyValue = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '$0.00M'
  return `$${value.toFixed(2)}M`
}

// Helper function to format height
const formatHeight = (height: string): string => {
  return height || 'N/A'
}

// Helper function to get team configuration
const getTeamConfig = (teamName: string) => {
  return getTeamByName(teamName) || getTeamByPartialName(teamName)
}

// Mapping from team names to database team IDs (used in URLs)
const TEAM_NAME_TO_DB_ID: Record<string, number> = {
  'Bills': 17,
  'Dolphins': 18,
  'Patriots': 19,
  'Jets': 20,
  'Bengals': 21,
  'Browns': 22,
  'Ravens': 23,
  'Steelers': 24,
  'Colts': 25,
  'Jaguars': 26,
  'Texans': 27,
  'Titans': 28,
  'Broncos': 29,
  'Chiefs': 30,
  'Raiders': 31,
  'Chargers': 32,
  'Giants': 1,
  'Cowboys': 2,
  'Eagles': 3,
  'Commanders': 4,
  'Bears': 5,
  'Lions': 6,
  'Packers': 7,
  'Vikings': 8,
  'Buccaneers': 9,
  'Falcons': 10,
  'Panthers': 11,
  'Saints': 12,
  'Cardinals': 13,
  'Rams': 14,
  '49ers': 15,
  'Seahawks': 16
}

// Helper function to get opponent team ID for linking
const getOpponentTeamId = (game: ScheduleItem): number | null => {
  const opponentName = game.opponent
  const dbTeamId = TEAM_NAME_TO_DB_ID[opponentName]
  
  // Debug logging
  console.log(`Looking up opponent: "${opponentName}"`)
  console.log(`Database team ID:`, dbTeamId)
  
  return dbTeamId || null
}

export default function TeamDetailPage() {
  const { leagueId, id: teamId } = useParams()
  const leagueIdString = leagueId as string
  const teamIdString = teamId as string
  
  // Debug logging for URL parameters
  console.log('TeamDetailPage - URL params:', { leagueId, teamId })
  console.log('TeamDetailPage - Processed strings:', { leagueIdString, teamIdString })
  
  // State for team data
  const [teamData, setTeamData] = useState<TeamDetailResponse | null>(null)
  
  // UI State
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'home' | 'schedule' | 'statistics' | 'roster' | 'depth-chart' | 'transactions' | 'contracts' | 'customization'>('home')
  
  // Schedule sorting state
  const [scheduleSortOrder, setScheduleSortOrder] = useState<'chronological' | 'reverse'>('chronological')

  // Roster sorting state
  const [rosterSortField, setRosterSortField] = useState<keyof TeamDetailResponse['roster'][0]>('overall')
  const [rosterSortDirection, setRosterSortDirection] = useState<'asc' | 'desc'>('desc')

  // Simple cache clearing function
  const clearCache = () => {
    console.log('=== CLEARING CACHE ===')
    try {
      localStorage.clear()
      sessionStorage.clear()
      console.log('Cache cleared successfully')
      // Force page reload
      window.location.reload()
    } catch (e) {
      console.log('Cache clear failed:', e)
    }
  }

  // Debug: Log when component renders
  console.log('TeamDetailPage rendering with teamData:', !!teamData)
  console.log('TeamDetailPage teamData.team:', teamData?.team)
  console.log('Team record:', teamData?.team?.record)
  console.log('Team name:', teamData?.team?.name)
  console.log('Clear Cache button should be visible:', !!teamData)

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch team detail information from the new single endpoint with cache busting
        const timestamp = new Date().getTime()
        const detailResponse = await authenticatedFetch(`${API_BASE}/leagues/${leagueIdString}/teams/${teamIdString}/detail?t=${timestamp}`)
        
        if (detailResponse.ok) {
          const data = await detailResponse.json()
          setTeamData(data)
          console.log('[TeamDetail] Team data loaded:', data)
          console.log('[TeamDetail] Full team object:', data.team)
          console.log('[TeamDetail] Team record field:', data.team?.record)
          console.log('[TeamDetail] Team wins/losses:', data.team?.wins, data.team?.losses, data.team?.ties)
          
          // Debug logging for schedule data
          if (data.schedule) {
            console.log('=== SCHEDULE DATA DEBUG ===')
            console.log('Schedule data received:', data.schedule)
            console.log('Weeks in order:', data.schedule.map((game: ScheduleItem) => game.week))
            const isSorted = data.schedule.every((game: ScheduleItem, index: number) => 
              index === 0 || game.week >= data.schedule[index - 1].week
            )
            console.log('Schedule is sorted:', isSorted)
            
            // Check for week 0 (should not exist)
            const hasWeekZero = data.schedule.some((game: ScheduleItem) => game.week === 0)
            console.log('Has Week 0 (should be false):', hasWeekZero)
            
            // Check for bye weeks
            const maxWeek = Math.max(...data.schedule.map((game: ScheduleItem) => game.week))
            const allWeeks = Array.from({ length: maxWeek }, (_, i) => i + 1)
            const byeWeeks = allWeeks.filter(week => !data.schedule.some((game: ScheduleItem) => game.week === week))
            console.log('Bye weeks detected:', byeWeeks)
            
            // Debug Week 1 specifically
            const week1Game = data.schedule.find((game: ScheduleItem) => game.week === 1)
            console.log('Week 1 game details:', week1Game)
            console.log('Week 1 result:', week1Game?.result)
            console.log('Week 1 score:', week1Game?.score)
            console.log('Week 1 game object keys:', week1Game ? Object.keys(week1Game) : 'No game found')
            console.log('All game fields available:', data.schedule[0] ? Object.keys(data.schedule[0]) : 'No games')
            
            // Debug all games with their opponents
            console.log('All games with opponents:', data.schedule.map((game: ScheduleItem) => ({
              week: game.week,
              opponent: game.opponent,
              home: game.home,
              away: game.away,
              isHome: game.isHome
            })))
          }
          
          // Debug logging for cap and contract data
          console.log('=== CAP DATA DEBUG ===')
          console.log('Cap Information:', data.capInformation)
          console.log('First 3 Players:', data.roster?.slice(0, 3))
          console.log('Most Expensive:', data.mostExpensive)
          console.log('Upcoming FA:', data.upcomingFreeAgents)
          
        } else {
          console.error('[TeamDetail] Failed to fetch team data:', detailResponse.status)
          setError('Failed to load team data')
        }

      } catch (err) {
        console.error('[TeamDetail] Error fetching team data:', err)
        setError('Failed to load team data')
      } finally {
        setLoading(false)
      }
    }

    fetchTeamData()
  }, [leagueIdString, teamIdString])

  // Sort roster data
  const sortedRoster = teamData?.roster ? [...teamData.roster].sort((a, b) => {
    const aValue = a[rosterSortField]
    const bValue = b[rosterSortField]
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return rosterSortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return rosterSortDirection === 'asc' ? aValue - bValue : bValue - aValue
    }
    
    return 0
  }) : []

  // Handle roster column sorting
  const handleRosterSort = (field: keyof TeamDetailResponse['roster'][0]) => {
    if (rosterSortField === field) {
      setRosterSortDirection(rosterSortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setRosterSortField(field)
      setRosterSortDirection('desc')
    }
  }

  // Get sort indicator
  const getSortIndicator = (field: keyof TeamDetailResponse['roster'][0]) => {
    if (rosterSortField !== field) return ''
    return rosterSortDirection === 'asc' ? ' ↑' : ' ↓'
  }

  // Get week label with playoff information
  const getWeekLabel = (week: number, weekLabel?: string): string => {
    // Use backend weekLabel if available, otherwise fallback to frontend logic
    if (weekLabel) {
      return weekLabel
    }
    
    if (week >= 19) {
      switch (week) {
        case 19: return '19 (Wild Card)'
        case 20: return '20 (Divisional)'
        case 21: return '21 (Conference)'
        case 22: return '22 (Pro Bowl)'
        case 23: return '23 (Super Bowl)'
        default: return `${week} (Playoff)`
      }
    }
    return week.toString()
  }


  // Generate complete schedule with bye weeks
  const generateCompleteSchedule = (schedule: ScheduleItem[], order: 'chronological' | 'reverse' = 'chronological') => {
    const sortedSchedule = [...schedule].sort((a, b) => {
      if (order === 'chronological') {
        return a.week - b.week
      } else {
        return b.week - a.week
      }
    })

    // Find the range of weeks (1 to max week)
    const maxWeek = Math.max(...schedule.map(game => game.week))
    
    // Generate all weeks from 1 to max week
    const allWeeks = Array.from({ length: maxWeek }, (_, i) => i + 1)
    
    // Create complete schedule with bye weeks
    const completeSchedule = allWeeks.map(week => {
      const game = sortedSchedule.find(g => g.week === week)
      if (game) {
        return game
      } else {
        // This is a bye week
        return {
          week,
          weekLabel: getWeekLabel(week), // Add weekLabel for bye weeks too
          home: '',
          away: '',
          opponent: 'Bye Week',
          isHome: false,
          score: null,
          result: null,
          gameId: -week, // Negative ID to indicate bye week
          isByeWeek: true
        } as ScheduleItem & { isByeWeek: boolean }
      }
    })

    return completeSchedule
  }


  // Toggle schedule sort order
  const toggleScheduleSort = () => {
    setScheduleSortOrder(prev => prev === 'chronological' ? 'reverse' : 'chronological')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-green"></div>
        <span className="ml-2">Loading team data...</span>
      </div>
    )
  }

  if (error || !teamData) {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white flex items-center justify-center">
        <div className="text-red-400">Error: {error || 'Failed to load team data'}</div>
      </div>
    )
  }

  const tabs = [
    { id: 'home', label: 'HOME' },
    { id: 'schedule', label: 'SCHEDULE' },
    { id: 'statistics', label: 'STATISTICS' },
    { id: 'roster', label: 'ROSTER' },
    { id: 'depth-chart', label: 'DEPTH CHART' },
    { id: 'transactions', label: 'TRANSACTIONS' },
    { id: 'contracts', label: 'CONTRACTS' },
    { id: 'customization', label: 'CUSTOMIZATION' }
  ]

  // Get team configuration for styling
  const teamConfig = getTeamConfig(teamData.team.name)
  const teamColor = teamConfig?.colors?.primary || '#00FF00'

  // formatter for totals with ranks from backend
  // per-game formatter with rank
  const fmtPg = (v?: number, r?: number) =>
    Number.isFinite(v as number) ? `${Number(v).toFixed(1)} (${r ?? '-'})` : '-'

  // Safely derive a player route id from leader objects
  const getLeaderRouteId = (leader: unknown): string | null => {
    if (!leader || typeof leader !== 'object') return null
    const obj = leader as Record<string, unknown>
    const explicitId = obj.playerId
    if (typeof explicitId === 'number' || typeof explicitId === 'string') {
      return String(explicitId)
    }
    const playerField = obj.player
    if (typeof playerField === 'string') {
      const digits = playerField.replace(/[^0-9]/g, '')
      return digits || null
    }
    return null
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'statistics': {
        const leaders = teamData.leaders
        const passingPid = getLeaderRouteId(leaders?.passing)
        const rushingPid = getLeaderRouteId(leaders?.rushing)
        const receivingPid = getLeaderRouteId(leaders?.receiving)
        const tacklesPid = getLeaderRouteId(leaders?.tackles)
        const sacksPid = getLeaderRouteId(leaders?.sacks)
        const interceptionsPid = getLeaderRouteId(leaders?.interceptions)
        return (
          <div className="space-y-6">
            {/* Passing Leader */}
            <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded border-4" style={{ borderColor: teamColor }}>
              <h3 className="text-lg font-semibold text-neon-green mb-3">Passing Leader</h3>
              {leaders?.passing ? (
                <div className="flex items-center justify-between text-sm">
                  <Link
                    href={passingPid ? `/leagues/${leagueIdString}/players/${passingPid}` : '#'}
                    onClick={(e) => { if (!passingPid) e.preventDefault() }}
                    className="text-blue-600 dark:text-blue-400 hover:text-neon-green"
                  >
                    {leaders.passing?.player} {leaders.passing?.position ? `(${leaders.passing.position})` : ''}
                  </Link>
                  <div className="text-right text-gray-700 dark:text-gray-300">
                    <div>Yards: {Number(leaders.passing?.yards ?? 0).toLocaleString()}</div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">No data</div>
              )}
            </div>

            {/* Rushing Leader */}
            <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded border-4" style={{ borderColor: teamColor }}>
              <h3 className="text-lg font-semibold text-neon-green mb-3">Rushing Leader</h3>
              {leaders?.rushing ? (
                <div className="flex items-center justify-between text-sm">
                  <Link
                    href={rushingPid ? `/leagues/${leagueIdString}/players/${rushingPid}` : '#'}
                    onClick={(e) => { if (!rushingPid) e.preventDefault() }}
                    className="text-blue-600 dark:text-blue-400 hover:text-neon-green"
                  >
                    {leaders.rushing?.player} {leaders.rushing?.position ? `(${leaders.rushing.position})` : ''}
                  </Link>
                  <div className="text-right text-gray-700 dark:text-gray-300">
                    <div>Yards: {Number(leaders.rushing?.yards ?? 0).toLocaleString()}</div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">No data</div>
              )}
            </div>

            {/* Receiving Leader */}
            <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded border-4" style={{ borderColor: teamColor }}>
              <h3 className="text-lg font-semibold text-neon-green mb-3">Receiving Leader</h3>
              {leaders?.receiving ? (
                <div className="flex items-center justify-between text-sm">
                  <Link
                    href={receivingPid ? `/leagues/${leagueIdString}/players/${receivingPid}` : '#'}
                    onClick={(e) => { if (!receivingPid) e.preventDefault() }}
                    className="text-blue-600 dark:text-blue-400 hover:text-neon-green"
                  >
                    {leaders.receiving?.player} {leaders.receiving?.position ? `(${leaders.receiving.position})` : ''}
                  </Link>
                  <div className="text-right text-gray-700 dark:text-gray-300">
                    <div>Yards: {Number(leaders.receiving?.yards ?? 0).toLocaleString()}</div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">No data</div>
              )}
            </div>

            {/* Defense Leaders */}
            <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded border-4" style={{ borderColor: teamColor }}>
              <h3 className="text-lg font-semibold text-neon-green mb-3">Defense Leaders</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="font-medium mb-1">Tackles</div>
                  {leaders?.tackles ? (
                    <div className="flex items-center justify-between">
                      <Link
                        href={tacklesPid ? `/leagues/${leagueIdString}/players/${tacklesPid}` : '#'}
                        onClick={(e) => { if (!tacklesPid) e.preventDefault() }}
                        className="text-blue-600 dark:text-blue-400 hover:text-neon-green"
                      >
                        {leaders.tackles?.player}
                      </Link>
                      <span>{Number(leaders.tackles?.tackles ?? 0)}</span>
                    </div>
                  ) : (
                    <div className="text-gray-500">-</div>
                  )}
                </div>
                <div>
                  <div className="font-medium mb-1">Sacks</div>
                  {leaders?.sacks ? (
                    <div className="flex items-center justify-between">
                      <Link
                        href={sacksPid ? `/leagues/${leagueIdString}/players/${sacksPid}` : '#'}
                        onClick={(e) => { if (!sacksPid) e.preventDefault() }}
                        className="text-blue-600 dark:text-blue-400 hover:text-neon-green"
                      >
                        {leaders.sacks?.player}
                      </Link>
                      <span>{Number(leaders.sacks?.sacks ?? 0)}</span>
                    </div>
                  ) : (
                    <div className="text-gray-500">-</div>
                  )}
                </div>
                <div>
                  <div className="font-medium mb-1">Interceptions</div>
                  {leaders?.interceptions ? (
                    <div className="flex items-center justify-between">
                      <Link
                        href={interceptionsPid ? `/leagues/${leagueIdString}/players/${interceptionsPid}` : '#'}
                        onClick={(e) => { if (!interceptionsPid) e.preventDefault() }}
                        className="text-blue-600 dark:text-blue-400 hover:text-neon-green"
                      >
                        {leaders.interceptions?.player}
                      </Link>
                      <span>{Number(leaders.interceptions?.interceptions ?? 0)}</span>
                    </div>
                  ) : (
                    <div className="text-gray-500">-</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      }
      case 'schedule': {
        const rawSchedule: ScheduleItem[] = (teamData as unknown as { schedule?: ScheduleItem[] }).schedule ?? []
        const schedule = generateCompleteSchedule(rawSchedule, scheduleSortOrder)
        
        return (
          <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg border-4 overflow-x-auto" style={{ borderColor: teamColor }}>
            {/* Schedule Header with Sort Toggle */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-green-600 dark:text-neon-green">Schedule</h3>
              <button 
                onClick={toggleScheduleSort}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                title={`Sort ${scheduleSortOrder === 'chronological' ? 'reverse' : 'chronological'}`}
              >
                {scheduleSortOrder === 'chronological' ? '↓ Week' : '↑ Week'}
              </button>
            </div>
            
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-300 dark:border-gray-700 text-left">
                  <th className="py-2 px-2">Week</th>
                  <th className="py-2 px-2">Opponent</th>
                  <th className="py-2 px-2">H/A</th>
                  <th className="py-2 px-2">Result</th>
                  <th className="py-2 px-2">Score</th>
                  <th className="py-2 px-2">Comments</th>
                  <th className="py-2 px-2">Box Score</th>
                </tr>
              </thead>
              <tbody>
                {schedule.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-4 px-2 text-center text-gray-600 dark:text-gray-400">
                      No games available
                    </td>
                  </tr>
                ) : (
                  schedule
                    .filter(g => g.week !== 22) // Only exclude Pro Bowl week (no team plays in Pro Bowl)
                    .map((g) => {
                    const isByeWeek = (g as ScheduleItem & { isByeWeek?: boolean }).isByeWeek || g.opponent === 'Bye Week'
                    const isSpecialByeWeek = g.week === 22 // Only Pro Bowl is a special bye week
                    const isPlayoffWeek = g.week >= 19 && g.week <= 23 // Include Super Bowl (Week 23) as playoff week
                    
                    return (
                    <tr key={g.gameId} className="border-b border-gray-200 dark:border-gray-800">
                        <td className="py-2 px-2 font-medium">
                          <span className={`${isPlayoffWeek ? 'text-yellow-400 font-bold' : isSpecialByeWeek ? 'text-gray-400' : ''}`}>
                            {getWeekLabel(g.week ?? 0, g.weekLabel)}
                          </span>
                        </td>
                      <td className="py-2 px-2">
                          {isByeWeek ? (
                            <span className="text-gray-500 italic">Bye Week</span>
                          ) : isSpecialByeWeek ? (
                            <span className="text-gray-400 italic">Bye Week</span>
                          ) : (() => {
                            const opponentTeamId = getOpponentTeamId(g)
                            return opponentTeamId ? (
                              <Link 
                                href={`/leagues/${leagueIdString}/teams/${opponentTeamId}`}
                                className="text-blue-600 dark:text-blue-400 hover:text-neon-green hover:underline transition-colors"
                              >
                                {g.opponent}
                              </Link>
                            ) : (
                              <span>{g.opponent}</span>
                            )
                          })()}
                        </td>
                        <td className="py-2 px-2">
                          {isByeWeek || isSpecialByeWeek ? (
                            <span className="text-gray-500">-</span>
                          ) : (
                            g.isHome ? 'Home' : 'Away'
                          )}
                        </td>
                        <td className="py-2 px-2">
                          {isByeWeek || isSpecialByeWeek ? (
                            <span className="text-gray-500">-</span>
                          ) : (
                            <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                              g.result === 'W' ? 'bg-green-500 text-white' :
                              g.result === 'L' ? 'bg-red-500 text-white' :
                              g.result === 'T' ? 'bg-yellow-500 text-black' :
                              'bg-gray-500 text-white'
                            }`}>
                              {g.result ?? '-'}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-2">
                          {isByeWeek || isSpecialByeWeek ? (
                            <span className="text-gray-500">-</span>
                          ) : (
                            g.score ?? '-'
                          )}
                        </td>
                        <td className="py-2 px-2">
                          {isByeWeek || isSpecialByeWeek ? (
                            <span className="text-gray-500">-</span>
                          ) : (
                        <Link className="text-blue-600 dark:text-blue-400 hover:text-neon-green" href={`/leagues/${leagueIdString}/games/${g.gameId}/comments`}>
                          💬
                        </Link>
                          )}
                      </td>
                      <td className="py-2 px-2">
                          {isByeWeek || isSpecialByeWeek ? (
                            <span className="text-gray-500">-</span>
                          ) : (
                        <Link className="text-blue-600 dark:text-blue-400 hover:text-neon-green" href={`/leagues/${leagueIdString}/schedule/box-score/${g.gameId}`}>
                          View
                        </Link>
                          )}
                      </td>
                    </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )
      }
      case 'home':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Most Expensive under Home tab */}
            <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg border-4" style={{ borderColor: teamColor }}>
              <h3 className="text-lg font-semibold text-green-600 dark:text-neon-green mb-3">Most Expensive</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-1 px-1 text-gray-400">Player</th>
                      <th className="text-left py-1 px-1 text-gray-400">POS</th>
                      <th className="text-left py-1 px-1 text-gray-400">DEV</th>
                      <th className="text-left py-1 px-1 text-gray-400">OVR</th>
                      <th className="text-left py-1 px-1 text-gray-400">CAP HIT</th>
                      <th className="text-left py-1 px-1 text-gray-400">SALARY</th>
                      <th className="text-left py-1 px-1 text-gray-400">BON</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamData.mostExpensive && teamData.mostExpensive.length > 0 ? (
                      teamData.mostExpensive.slice(0, 10).map((player, index) => (
                        <tr key={index} className="border-b border-gray-700/50">
                          <td className="py-1 px-1 text-white text-xs">{player.player.replace(/ #\d+$/, '')}</td>
                          <td className="py-1 px-1 text-white text-xs">{player.position}</td>
                          <td className="py-1 px-1 text-white text-xs">{player.devTrait}</td>
                          <td className="py-1 px-1 text-white text-xs">{player.overall}</td>
                          <td className="py-1 px-1 text-white text-xs">{formatCurrencyValue(player.capHit)}</td>
                          <td className="py-1 px-1 text-white text-xs">{formatCurrencyValue(player.salary)}</td>
                          <td className="py-1 px-1 text-white text-xs">{formatCurrencyValue(player.bonus)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-2 text-center text-gray-400 text-xs">No data available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Upcoming FA under Home tab */}
            <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg border-4" style={{ borderColor: teamColor }}>
              <h3 className="text-lg font-semibold text-green-600 dark:text-neon-green mb-3">Upcoming FA</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-1 px-1 text-gray-400">Player</th>
                      <th className="text-left py-1 px-1 text-gray-400">POS</th>
                      <th className="text-left py-1 px-1 text-gray-400">DEV</th>
                      <th className="text-left py-1 px-1 text-gray-400">OVR</th>
                      <th className="text-left py-1 px-1 text-gray-400">CAP HIT</th>
                      <th className="text-left py-1 px-1 text-gray-400">SALARY</th>
                      <th className="text-left py-1 px-1 text-gray-400">BON</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamData.upcomingFreeAgents && teamData.upcomingFreeAgents.length > 0 ? (
                      teamData.upcomingFreeAgents.slice(0, 10).map((player, index) => (
                        <tr key={index} className="border-b border-gray-700/50">
                          <td className="py-1 px-1 text-white text-xs">{player.player.replace(/ #\d+$/, '')}</td>
                          <td className="py-1 px-1 text-white text-xs">{player.position}</td>
                          <td className="py-1 px-1 text-white text-xs">{player.devTrait}</td>
                          <td className="py-1 px-1 text-white text-xs">{player.overall}</td>
                          <td className="py-1 px-1 text-white text-xs">{formatCurrencyValue(player.capHit)}</td>
                          <td className="py-1 px-1 text-white text-xs">{formatCurrencyValue(player.salary)}</td>
                          <td className="py-1 px-1 text-white text-xs">{formatCurrencyValue(player.bonus)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-2 text-center text-gray-400 text-xs">No data available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
             case 'roster':
                 return (
           <div className="bg-gray-900 p-4 rounded border-4" style={{ borderColor: teamColor }}>
             <div className="overflow-x-auto">
               <table className="w-full text-sm">
                 <thead>
                   <tr className="border-b border-gray-300 dark:border-gray-700">
                    <th 
                      className="text-left py-2 px-1 text-gray-400 cursor-pointer hover:text-white"
                      onClick={() => handleRosterSort('name')}
                    >
                      Player{getSortIndicator('name')}
                    </th>
                    <th 
                      className="text-left py-2 px-1 text-gray-400 cursor-pointer hover:text-white"
                      onClick={() => handleRosterSort('position')}
                    >
                      POS{getSortIndicator('position')}
                    </th>
                    <th 
                      className="text-left py-2 px-1 text-gray-400 cursor-pointer hover:text-white"
                      onClick={() => handleRosterSort('dev_trait')}
                    >
                      DEV{getSortIndicator('dev_trait')}
                    </th>
                    <th 
                      className="text-left py-2 px-1 text-gray-400 cursor-pointer hover:text-white"
                      onClick={() => handleRosterSort('overall')}
                    >
                      OVR{getSortIndicator('overall')}
                    </th>
                    <th 
                      className="text-left py-2 px-1 text-gray-400 cursor-pointer hover:text-white"
                      onClick={() => handleRosterSort('age')}
                    >
                      AGE{getSortIndicator('age')}
                    </th>
                    <th 
                      className="text-left py-2 px-1 text-gray-400 cursor-pointer hover:text-white"
                      onClick={() => handleRosterSort('height')}
                    >
                      HGT{getSortIndicator('height')}
                    </th>
                    <th 
                      className="text-left py-2 px-1 text-gray-400 cursor-pointer hover:text-white"
                      onClick={() => handleRosterSort('speed')}
                    >
                      SPD{getSortIndicator('speed')}
                    </th>
                    <th 
                      className="text-left py-2 px-1 text-gray-400 cursor-pointer hover:text-white"
                      onClick={() => handleRosterSort('cap_hit')}
                    >
                      CAP HIT{getSortIndicator('cap_hit')}
                    </th>
                    <th 
                      className="text-left py-2 px-1 text-gray-400 cursor-pointer hover:text-white"
                      onClick={() => handleRosterSort('salary')}
                    >
                      SALARY{getSortIndicator('salary')}
                    </th>
                    <th 
                      className="text-left py-2 px-1 text-gray-400 cursor-pointer hover:text-white"
                      onClick={() => handleRosterSort('bonus')}
                    >
                      BON{getSortIndicator('bonus')}
                    </th>
                    <th 
                      className="text-left py-2 px-1 text-gray-400 cursor-pointer hover:text-white"
                      onClick={() => handleRosterSort('years_left')}
                    >
                      YRS LEFT{getSortIndicator('years_left')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRoster.length > 0 ? (
                    sortedRoster.map((player) => (
                      <tr key={player.id} className="border-b border-gray-300/50 dark:border-gray-700/50 hover:bg-gray-200/30 dark:hover:bg-gray-700/30">
                        <td className="py-2 px-1 text-gray-900 dark:text-white">
                          <Link 
                            href={`/leagues/${leagueIdString}/players/${player.madden_id}`}
                            className="hover:text-green-600 dark:hover:text-neon-green transition-colors"
                          >
                            {player.name}
                          </Link>
                        </td>
                        <td className="py-2 px-1 text-gray-900 dark:text-white">{player.position}</td>
                        <td className="py-2 px-1 text-gray-900 dark:text-white">{player.dev_trait}</td>
                        <td className="py-2 px-1 text-gray-900 dark:text-white">{player.overall}</td>
                        <td className="py-2 px-1 text-gray-900 dark:text-white">{player.age}</td>
                        <td className="py-2 px-1 text-gray-900 dark:text-white">{formatHeight(player.height)}</td>
                        <td className="py-2 px-1 text-gray-900 dark:text-white">{player.speed}</td>
                        <td className="py-2 px-1 text-gray-900 dark:text-white">{formatCurrencyValue(player.cap_hit)}</td>
                        <td className="py-2 px-1 text-gray-900 dark:text-white">{formatCurrencyValue(player.salary)}</td>
                        <td className="py-2 px-1 text-gray-900 dark:text-white">{formatCurrencyValue(player.bonus)}</td>
                        <td className="py-2 px-1 text-gray-900 dark:text-white">{player.years_left || 0}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={11} className="py-4 text-center text-gray-600 dark:text-gray-400">
                        No players found in roster
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )

      case 'depth-chart':
        return (
          <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded border-4" style={{ borderColor: teamColor }}>
            {teamData.depthChart && Object.keys(teamData.depthChart).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(() => {
                  // Desired left-to-right order per row
                  const order = [
                    'QB', 'HB', 'FB',
                    'WR', 'TE', 'LT',
                    'LG', 'C', 'RG',
                    'RT', 'LE', 'DT',
                    'RE', 'LOLB', 'MLB',
                    'ROLB', 'CB', 'SS',
                    'FS', 'P', 'K',
                  ]
                  // Map common aliases
                  const alias: Record<string, string[]> = { RB: ['HB'], RDE: ['RE'], LDE: ['LE'] }
                  const exists = (pos: string) =>
                    teamData.depthChart[pos] || (alias[pos]?.find(a => teamData.depthChart[a]))
                  const getPlayers = (pos: string) =>
                    teamData.depthChart[pos] || (alias[pos]?.find(a => teamData.depthChart[a]) && teamData.depthChart[alias[pos]!.find(a => teamData.depthChart[a]) as string])

                  const orderedKeys = order.filter((p) => Boolean(exists(p)))
                  const extraKeys = Object.keys(teamData.depthChart).filter((k) => !orderedKeys.includes(k))
                  const finalKeys = [...orderedKeys, ...extraKeys]

                  return finalKeys.map((position) => {
                    const players = getPlayers(position) || teamData.depthChart[position]
                    return (
                      <div key={position} className="bg-gray-200 dark:bg-gray-800 p-3 rounded">
                        <h4 className="text-lg font-semibold text-green-600 dark:text-neon-green mb-2">{position}</h4>
                        <div className="space-y-2">
                          {players.map((player: { id: number; madden_id: string; name: string; position: string; overall: number; dev_trait: string; age: number; speed: number }, index: number) => (
                            <div key={player.id} className="flex items-center justify-between p-2 bg-gray-300 dark:bg-gray-700 rounded">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-600 dark:text-gray-400">#{index + 1}</span>
                                  <Link
                                    href={`/leagues/${leagueIdString}/players/${player.madden_id}`}
                                    className="text-gray-900 dark:text-white hover:text-green-600 dark:hover:text-neon-green transition-colors font-medium"
                                  >
                                    {player.name}
                                  </Link>
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  {player.position} • OVR: {player.overall} • {player.dev_trait}
                                </div>
                              </div>
                              <div className="text-right text-xs text-gray-600 dark:text-gray-400">
                                <div>Age: {player.age}</div>
                                <div>SPD: {player.speed}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })
                })()}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-600 dark:text-gray-400">No depth chart data available</div>
            )}
          </div>
        )

             default:
         return (
           <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded border-4" style={{ borderColor: teamColor }}>
             <p className="text-gray-600 dark:text-gray-400">Content for {activeTab} tab coming soon...</p>
           </div>
         )
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white">
             {/* Header */}
       <div className="bg-gray-100 dark:bg-gray-900 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
                         <Link 
               href={`/leagues/${leagueIdString}/teams`}
               className="text-green-600 dark:text-neon-green hover:text-green-700 dark:hover:text-green-400 transition-colors"
             >
              ← Back to Teams
            </Link>
            <h1 className="text-2xl font-bold">{teamData.team.name}</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={clearCache}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-lg border-2 border-red-500"
              title="Clear cache and refresh data"
              style={{ zIndex: 1000 }}
            >
              🔄 CLEAR CACHE
            </button>
            <div className="text-right">
              <div className="text-2xl font-bold">{teamData?.team?.record || 'Loading...'}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-6 p-6">
        {/* Main Content */}
        <div className="flex-1 space-y-6">
                     {/* Team Info Card */}
           <div className="bg-gray-100 dark:bg-gray-900 p-6 rounded-lg border-4" style={{ borderColor: teamColor }}>
                         <div className="flex items-center gap-4 mb-4">
               <TeamLogo 
                 teamName={teamData.team.name}
                 size="2xl"
                 variant="logo"
                 showName={false}
               />
              <div>
                <h2 className="text-2xl font-bold">{teamData.team.name}</h2>
                <p className="text-gray-400">
                  Record: {teamData.team.record} • Owner: {teamData.team.user} • Roster: {teamData.team.rosterCount}
                </p>
              </div>
            </div>

            {/* Team Notes */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-neon-green mb-2">Team Notes</h3>
              <p className="text-gray-400">None</p>
            </div>

             {/* Stats Grid using backend totals and ranks */}
            <div className="grid grid-cols-2 gap-6 mb-4">
              <div>
                 <h4 className="text-lg font-semibold text-neon-green mb-2">Offense</h4>
                 <div className="space-y-1 text-sm">
                  <div>Points: {fmtPg(teamData.offensiveStats.points, teamData.offensiveStats.pointsRank)}</div>
                  <div>Total Yards: {fmtPg(teamData.offensiveStats.yards, teamData.offensiveStats.yardsRank)}</div>
                  <div>Pass Yards: {fmtPg(teamData.offensiveStats.passingYards, teamData.offensiveStats.passingYardsRank)}</div>
                  <div>Rush Yards: {fmtPg(teamData.offensiveStats.rushingYards, teamData.offensiveStats.rushingYardsRank)}</div>
                 </div>
              </div>
              <div>
                 <h4 className="text-lg font-semibold text-neon-green mb-2">Defense</h4>
                 <div className="space-y-1 text-sm">
                  <div>Pts Allowed: {fmtPg(teamData.defensiveStats.points, teamData.defensiveStats.pointsRank)}</div>
                  <div>Yds Allowed: {fmtPg(teamData.defensiveStats.yards, teamData.defensiveStats.yardsRank)}</div>
                  <div>Pass Yds Allowed: {fmtPg(teamData.defensiveStats.passingYards, teamData.defensiveStats.passingYardsRank)}</div>
                  <div>Rush Yds Allowed: {fmtPg(teamData.defensiveStats.rushingYards, teamData.defensiveStats.rushingYardsRank)}</div>
                 </div>
              </div>
            </div>

            {/* Trade Block Comments */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-neon-green mb-2">Trade Block Comments</h3>
              <p className="text-gray-400">None</p>
            </div>

            {/* Details and Cap Info */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-semibold text-neon-green mb-2">Details</h4>
                <div className="space-y-1 text-sm">
                  <div>Division: {teamData.team.division}</div>
                  <div>Member: @{teamData.team.user}</div>
                  <div>Coach/Owner: {teamData.team.user.toUpperCase()}</div>
                  <div>Offense Scheme: {teamData.team.offenseScheme}</div>
                  <div>Defense Scheme: {teamData.team.defenseScheme}</div>
                  <div>Roster Count: {teamData.team.rosterCount}</div>
                  <div>Injury Count: {teamData.team.injuryCount}</div>
                </div>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-neon-green mb-2">Cap Information</h4>
                <div className="space-y-1 text-sm">
                  <div className="text-green-400">Cap Room: {formatCurrencyValue(teamData.capInformation?.capRoom)}</div>
                  <div>Spent: {formatCurrencyValue(teamData.capInformation?.spent)}</div>
                  <div className="text-green-400">Available: {formatCurrencyValue(teamData.capInformation?.available)}</div>
                </div>
              </div>
            </div>
          </div>

                                {/* Tab Navigation */}
           <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg border-4" style={{ borderColor: teamColor }}>
             <div className="flex space-x-6 border-b border-gray-300 dark:border-gray-700">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'home' | 'schedule' | 'statistics' | 'roster' | 'depth-chart' | 'transactions' | 'contracts' | 'customization')}
                                     className={`pb-2 px-1 text-sm font-medium transition-colors ${
                     activeTab === tab.id
                       ? 'text-green-600 dark:text-neon-green border-b-2 border-green-600 dark:border-neon-green'
                       : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                   }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            
            {/* Tab Content */}
            <div className="mt-4">
              {renderTabContent()}
            </div>
          </div>
        </div>

          {/* Right Sidebar */}
         <div className="w-80 space-y-4">
           {/* Record Display */}
           <div className="text-right text-sm text-gray-600 dark:text-gray-400">
            {teamData.team.record}
          </div>

           {/* On The Block */}
           <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg border-4" style={{ borderColor: teamColor }}>
                            <h3 className="text-lg font-semibold text-green-600 dark:text-neon-green mb-3">On The Block</h3>
             <div className="overflow-x-auto">
               <table className="w-full text-xs">
                 <thead>
                   <tr className="border-b border-gray-700">
                    <th className="text-left py-1 px-1 text-gray-400">Player</th>
                    <th className="text-left py-1 px-1 text-gray-400">POS</th>
                    <th className="text-left py-1 px-1 text-gray-400">DEV</th>
                    <th className="text-left py-1 px-1 text-gray-400">OVR</th>
                    <th className="text-left py-1 px-1 text-gray-400">AGE</th>
                    <th className="text-left py-1 px-1 text-gray-400">HGT</th>
                    <th className="text-left py-1 px-1 text-gray-400">SPD</th>
                    <th className="text-left py-1 px-1 text-gray-400">V</th>
                  </tr>
                </thead>
                <tbody>
                  {teamData.onTheBlock && teamData.onTheBlock.length > 0 ? (
                    teamData.onTheBlock.map((player, index) => (
                      <tr key={index} className="border-b border-gray-700/50">
                        <td className="py-1 px-1 text-white text-xs">{player.player}</td>
                        <td className="py-1 px-1 text-white text-xs">{player.position}</td>
                        <td className="py-1 px-1 text-white text-xs">{player.devTrait}</td>
                        <td className="py-1 px-1 text-white text-xs">{player.overall}</td>
                        <td className="py-1 px-1 text-white text-xs">{player.age}</td>
                        <td className="py-1 px-1 text-white text-xs">{formatHeight(player.height)}</td>
                        <td className="py-1 px-1 text-white text-xs">{player.speed}</td>
                        <td className="py-1 px-1 text-white text-xs">{formatCurrencyValue(player.capHit)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-2 text-center text-gray-400 text-xs">
                        No matching records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
