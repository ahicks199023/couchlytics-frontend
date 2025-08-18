'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { API_BASE, authenticatedFetch } from '@/lib/config'
import { TeamDetailResponse } from '@/types/analytics'
import { getTeamByName, getTeamByPartialName } from '@/lib/team-config'
import TeamLogo from '@/components/TeamLogo'

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

export default function TeamDetailPage() {
  const { leagueId, id: teamId } = useParams()
  const leagueIdString = leagueId as string
  const teamIdString = teamId as string
  
  // State for team data
  const [teamData, setTeamData] = useState<TeamDetailResponse | null>(null)
  
  // UI State
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'home' | 'schedule' | 'statistics' | 'roster' | 'depth-chart' | 'transactions' | 'contracts' | 'customization'>('home')

  // Roster sorting state
  const [rosterSortField, setRosterSortField] = useState<keyof TeamDetailResponse['roster'][0]>('overall')
  const [rosterSortDirection, setRosterSortDirection] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch team detail information from the new single endpoint
        const detailResponse = await authenticatedFetch(`${API_BASE}/leagues/${leagueIdString}/teams/${teamIdString}/detail`)
        
        if (detailResponse.ok) {
          const data = await detailResponse.json()
          setTeamData(data)
          console.log('[TeamDetail] Team data loaded:', data)
          
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
        type ScheduleItem = {
          week: number
          home: string
          away: string
          opponent: string
          isHome: boolean
          score?: string | null
          result?: 'W' | 'L' | 'T' | null
          gameId: number
        }
        const schedule: ScheduleItem[] = (teamData as unknown as { schedule?: ScheduleItem[] }).schedule ?? []
        return (
          <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg border-4 overflow-x-auto" style={{ borderColor: teamColor }}>
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-300 dark:border-gray-700 text-left">
                  <th className="py-2 px-2">Week</th>
                  <th className="py-2 px-2">Opponent</th>
                  <th className="py-2 px-2">H/A</th>
                  <th className="py-2 px-2">Result</th>
                  <th className="py-2 px-2">Score</th>
                  <th className="py-2 px-2">Box Score</th>
                </tr>
              </thead>
              <tbody>
                {schedule.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-4 px-2 text-center text-gray-600 dark:text-gray-400">
                      No games available
                    </td>
                  </tr>
                ) : (
                  schedule.map((g) => (
                    <tr key={g.gameId} className="border-b border-gray-200 dark:border-gray-800">
                      <td className="py-2 px-2">{(g.week ?? 0) + 1}</td>
                      <td className="py-2 px-2">{g.opponent}</td>
                      <td className="py-2 px-2">{g.isHome ? 'Home' : 'Away'}</td>
                      <td className="py-2 px-2">{g.result ?? '-'}</td>
                      <td className="py-2 px-2">{g.score ?? '-'}</td>
                      <td className="py-2 px-2">
                        <Link className="text-blue-600 dark:text-blue-400 hover:text-neon-green" href={`/leagues/${leagueIdString}/schedule/box-score/${g.gameId}`}>
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
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
                          <td className="py-1 px-1 text-white text-xs">
                            <Link 
                              href={`/leagues/${leagueIdString}/players/${player.playerId || encodeURIComponent(player.player)}`}
                              className="text-blue-400 hover:text-neon-green transition-colors cursor-pointer"
                            >
                              {player.player}
                            </Link>
                          </td>
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
                          <td className="py-1 px-1 text-white text-xs">
                            <Link 
                              href={`/leagues/${leagueIdString}/players/${player.playerId || encodeURIComponent(player.player)}`}
                              className="text-blue-400 hover:text-neon-green transition-colors cursor-pointer"
                            >
                              {player.player}
                            </Link>
                          </td>
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
          <div className="text-right">
            <div className="text-2xl font-bold">{teamData.team.record}</div>
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
                  <div>Total Salary: {formatCurrencyValue(teamData.capInformation?.totalSalary)}</div>
                  <div>Total Bonus: {formatCurrencyValue(teamData.capInformation?.totalBonus)}</div>
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
