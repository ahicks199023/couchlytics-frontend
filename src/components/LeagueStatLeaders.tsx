'use client'

import React, { useEffect, useState, useCallback } from 'react'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { API_BASE } from '@/lib/config'
import { statOptions, positionOptions } from '@/constants/statTypes'

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend)

interface StatLeader {
  playerId: string | number
  name: string
  teamName: string
  statValue: number
  // Optional fields that may not be present in API response
  portraitId?: string
  espnId?: string
  teamId?: number
  position?: string
  // New leaderboard fields
  maddenId?: string
  touchdowns?: number
  interceptions?: number
  completions?: number
  attempts?: number
  rating?: number
  gamesPlayed?: number
}

// Interface for the new leaderboard API response structure
interface BackendStatLeader {
  playerId: number
  maddenId?: string
  name?: string
  position: string
  teamId: number
  yards?: number
  touchdowns?: number
  interceptions?: number
  completions?: number
  attempts?: number
  rating?: number
  gamesPlayed?: number
  // Database field names for player names
  full_name?: string
  fullName?: string
  firstName?: string
  first_name?: string
  lastName?: string
  last_name?: string
  playerName?: string
  player_name?: string
  // Legacy fields for backward compatibility
  player_id?: string
  teamName?: string
  team_name?: string
  team_id?: number
  statValue?: number
  value?: number
  portraitId?: string
  portrait_id?: string
  espnId?: string
  espn_id?: string
}

interface ApiResponse {
  passingLeaders?: BackendStatLeader[]
  rushingLeaders?: BackendStatLeader[]
  receivingLeaders?: BackendStatLeader[]
  defensiveLeaders?: BackendStatLeader[]
  kickingLeaders?: BackendStatLeader[]
}

interface Props {
  leagueId: string
}

export const LeagueStatLeaders: React.FC<Props> = ({ leagueId }) => {
  const router = useRouter()
  const [statType, setStatType] = useState('pass_yds') // Use a working stat type as default
  const [week, setWeek] = useState('')
  const [position, setPosition] = useState('ALL')
  const [leaders, setLeaders] = useState<StatLeader[]>([])
  const [view, setView] = useState<'table' | 'chart'>('table')
  const [currentTeamId, setCurrentTeamId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [teamNames, setTeamNames] = useState<Record<number, string>>({})

    // Function to fetch team names
  const fetchTeamNames = useCallback(async () => {
    try {
      console.log('Fetching team names for league:', leagueId)
      const res = await fetch(`${API_BASE}/leagues/${leagueId}/teams`, { credentials: 'include' })
      console.log('Team names response status:', res.status)
      
      if (res.ok) {
        const teams = await res.json()
        console.log('Raw teams response:', teams)
        console.log('Teams type:', typeof teams)
        console.log('Teams is array:', Array.isArray(teams))
        
        const teamMap: Record<number, string> = {}
        
        if (Array.isArray(teams)) {
          teams.forEach((team: { id?: number; teamId?: number; name: string }) => {
            teamMap[team.id || team.teamId || 0] = team.name
          })
        } else if (teams && typeof teams === 'object') {
          // Handle case where teams might be an object with team data
          console.log('Teams is an object, keys:', Object.keys(teams))
          Object.entries(teams).forEach(([key, team]: [string, unknown]) => {
            if (team && typeof team === 'object' && 'name' in team && typeof (team as { name: string }).name === 'string') {
              const teamObj = team as { id?: number; teamId?: number; name: string }
              teamMap[teamObj.id || teamObj.teamId || parseInt(key) || 0] = teamObj.name
            }
          })
        }
        
        console.log('Final team names map:', teamMap)
        setTeamNames(teamMap)
      } else {
        console.error('Failed to fetch team names, status:', res.status)
        const errorText = await res.text()
        console.error('Error response:', errorText)
      }
    } catch (err) {
      console.error('Failed to fetch team names:', err)
    }
  }, [leagueId])

  // Function to check leaderboard system status
  const checkLeaderboardStatus = useCallback(async () => {
    try {
      console.log('Checking leaderboard system status...')
      const res = await fetch(`${API_BASE}/leaderboard/health`, { credentials: 'include' })
      
      if (res.ok) {
        const health = await res.json()
        console.log('Leaderboard health status:', health)
        return health.status === 'healthy'
      } else {
        console.warn('Leaderboard health check failed:', res.status)
        return false
      }
    } catch (err) {
      console.error('Failed to check leaderboard status:', err)
      return false
    }
  }, [])

  // Function to handle player navigation
  const handlePlayerClick = async (playerName: string, playerId: string | number, maddenId?: string) => {
    try {
      // Try to use maddenId first if available, otherwise fall back to playerId
      const idToUse = maddenId || playerId
      console.log(`Navigating to player: ${playerName} (ID: ${idToUse}, maddenId: ${maddenId}, playerId: ${playerId})`)
      router.push(`/leagues/${leagueId}/players/${idToUse}`)
    } catch (err) {
      console.error('Error navigating to player:', err)
      // Fallback: navigate to players list with search
      router.push(`/leagues/${leagueId}/players?search=${encodeURIComponent(playerName)}`)
    }
  }

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch(`${API_BASE}/me`, { credentials: 'include' })
        const data = await res.json()
        if (data?.teamId) setCurrentTeamId(data.teamId)
      } catch (err) {
        console.error('Failed to fetch current user:', err)
      }
    }
    console.log('useEffect triggered - fetching current user and team names')
    fetchCurrentUser()
    fetchTeamNames()
  }, [leagueId, fetchTeamNames])

  useEffect(() => {
    if (!leagueId || leagueId === 'undefined') {
      setError('Invalid or missing league ID.');
      setLoading(false);
      return;
    }
    const fetchLeaders = async () => {
      try {
        // First check if the new leaderboard system is available
        const leaderboardHealthy = await checkLeaderboardStatus()
        
        let url: string
        if (leaderboardHealthy) {
          // Use the new high-performance leaderboard API
          const query = new URLSearchParams()
          
          // Map old stat types to new leaderboard stat types
          let leaderboardStatType = 'all'
          if (statType.includes('pass')) leaderboardStatType = 'passing'
          else if (statType.includes('rush')) leaderboardStatType = 'rushing'
          else if (statType.includes('rec')) leaderboardStatType = 'receiving'
          else if (statType.includes('def')) leaderboardStatType = 'defensive'
          else if (statType.includes('kick')) leaderboardStatType = 'kicking'
          
          query.append('statType', leaderboardStatType)
          query.append('limit', '50') // Get more results for better filtering
          
          url = `${API_BASE}/leaderboard/leagues/${leagueId}/leaders?${query.toString()}`
          console.log('Using NEW leaderboard API:', url)
        } else {
          // Fallback to old API
          const query = new URLSearchParams({ statType })
          if (week) query.append('week', week)
          
          url = `${API_BASE}/leagues/${leagueId}/stats/leaders?${query.toString()}`
          console.log('Using OLD API (fallback):', url)
        }
        
        const res = await fetch(url, { credentials: 'include' })
        if (!res.ok) {
          throw new Error(`Failed to fetch stat leaders: ${res.status}`)
        }
        const data: ApiResponse = await res.json()
        console.log('Stat leaders response:', data)
        console.log('Current teamNames state:', teamNames)
        console.log('Raw passing leaders first item:', data.passingLeaders?.[0])
        console.log('Raw rushing leaders first item:', data.rushingLeaders?.[0])
        console.log('Raw receiving leaders first item:', data.receivingLeaders?.[0])
        
                // Handle the new leaderboard API response structure
        let processedLeaders: StatLeader[] = []
        
        if (data.passingLeaders && Array.isArray(data.passingLeaders)) {
          console.log('Processing passing leaders:', data.passingLeaders)
          const mappedPassingLeaders = data.passingLeaders.map((leader: BackendStatLeader, index: number) => {
                         console.log(`Passing leader ${index}:`, leader)
             console.log(`Passing leader ${index} all available fields:`, Object.keys(leader))
             console.log(`Passing leader ${index} name-related fields:`, {
               name: leader.name,
               full_name: leader.full_name,
               fullName: leader.fullName,
               firstName: leader.firstName,
               first_name: leader.first_name,
               lastName: leader.lastName,
               last_name: leader.last_name
             })
            
            const teamId = leader.teamId || leader.team_id
            const teamName = leader.teamName || leader.team_name || teamNames[teamId || 0] || `Team ${teamId || ''}`
            
                         // Use the new leaderboard structure with fallbacks
             // Try multiple possible name fields based on the database structure
             let playerName = leader.name
             if (!playerName || playerName === null) {
               // Check for alternative name fields that exist in the database
               const possibleNameFields = ['full_name', 'fullName', 'playerName', 'player_name', 'firstName', 'first_name', 'lastName', 'last_name']
               for (const field of possibleNameFields) {
                 if (leader[field as keyof BackendStatLeader] && typeof leader[field as keyof BackendStatLeader] === 'string') {
                   playerName = leader[field as keyof BackendStatLeader] as string
                   console.log(`Found player name in field ${field}:`, playerName)
                   break
                 }
               }
             }
             
             // If still no name, try combining first and last name
             if (!playerName || playerName === null) {
               const firstName = leader.firstName || leader.first_name
               const lastName = leader.lastName || leader.last_name
               if (firstName && lastName) {
                 playerName = `${firstName} ${lastName}`
                 console.log(`Combined name from first/last:`, playerName)
               }
             }
             
             const mappedLeader: StatLeader = {
               playerId: leader.playerId || leader.player_id || index,
               name: playerName || `Player ${index + 1}`,
               teamName: teamName,
               statValue: leader.yards || leader.statValue || leader.value || 0,
               position: leader.position || 'QB',
               teamId: teamId,
               portraitId: leader.portraitId || leader.portrait_id,
               espnId: leader.espnId || leader.espn_id,
               // New leaderboard fields
               maddenId: leader.maddenId,
               touchdowns: leader.touchdowns,
               interceptions: leader.interceptions,
               completions: leader.completions,
               attempts: leader.attempts,
               rating: leader.rating,
               gamesPlayed: leader.gamesPlayed
             }
            console.log(`Mapped passing leader ${index}:`, mappedLeader)
            return mappedLeader
          })
          // Only include passing leaders if we're looking at passing stats
          if (statType.includes('pass')) {
            processedLeaders = [...processedLeaders, ...mappedPassingLeaders]
          }
        }
        if (data.rushingLeaders && Array.isArray(data.rushingLeaders)) {
          console.log('Processing rushing leaders:', data.rushingLeaders)
          const mappedRushingLeaders = data.rushingLeaders.map((leader: BackendStatLeader, index: number) => {
            console.log(`Rushing leader ${index}:`, leader)
            
                         const teamId = leader.teamId || leader.team_id
             const teamName = leader.teamName || leader.team_name || teamNames[teamId || 0] || `Team ${teamId || ''}`
             
             // Try multiple possible name fields based on the database structure
             let playerName = leader.name
             if (!playerName || playerName === null) {
               // Check for alternative name fields that exist in the database
               const possibleNameFields = ['full_name', 'fullName', 'playerName', 'player_name', 'firstName', 'first_name', 'lastName', 'last_name']
               for (const field of possibleNameFields) {
                 if (leader[field as keyof BackendStatLeader] && typeof leader[field as keyof BackendStatLeader] === 'string') {
                   playerName = leader[field as keyof BackendStatLeader] as string
                   console.log(`Found rushing player name in field ${field}:`, playerName)
                   break
                 }
               }
             }
             
             // If still no name, try combining first and last name
             if (!playerName || playerName === null) {
               const firstName = leader.firstName || leader.first_name
               const lastName = leader.lastName || leader.last_name
               if (firstName && lastName) {
                 playerName = `${firstName} ${lastName}`
                 console.log(`Combined rushing name from first/last:`, playerName)
               }
             }
             
             const mappedLeader: StatLeader = {
               playerId: leader.playerId || leader.player_id || index,
               name: playerName || `Player ${index + 1}`,
               teamName: teamName,
               statValue: leader.yards || leader.statValue || leader.value || 0,
               position: leader.position || 'HB',
               teamId: teamId,
               portraitId: leader.portraitId || leader.portrait_id,
               espnId: leader.espnId || leader.espn_id,
               // New leaderboard fields
               maddenId: leader.maddenId,
               touchdowns: leader.touchdowns,
               interceptions: leader.interceptions,
               completions: leader.completions,
               attempts: leader.attempts,
               rating: leader.rating,
               gamesPlayed: leader.gamesPlayed
             }
            return mappedLeader
          })
          // Only include rushing leaders if we're looking at rushing stats
          if (statType.includes('rush')) {
            processedLeaders = [...processedLeaders, ...mappedRushingLeaders]
          }
        }
        if (data.receivingLeaders && Array.isArray(data.receivingLeaders)) {
          console.log('Processing receiving leaders:', data.receivingLeaders)
          const mappedReceivingLeaders = data.receivingLeaders.map((leader: BackendStatLeader, index: number) => {
            console.log(`Receiving leader ${index}:`, leader)
            
                         const teamId = leader.teamId || leader.team_id
             const teamName = leader.teamName || leader.team_name || teamNames[teamId || 0] || `Team ${teamId || ''}`
             
             // Try multiple possible name fields based on the database structure
             let playerName = leader.name
             if (!playerName || playerName === null) {
               // Check for alternative name fields that exist in the database
               const possibleNameFields = ['full_name', 'fullName', 'playerName', 'player_name', 'firstName', 'first_name', 'lastName', 'last_name']
               for (const field of possibleNameFields) {
                 if (leader[field as keyof BackendStatLeader] && typeof leader[field as keyof BackendStatLeader] === 'string') {
                   playerName = leader[field as keyof BackendStatLeader] as string
                   console.log(`Found receiving player name in field ${field}:`, playerName)
                   break
                 }
               }
             }
             
             // If still no name, try combining first and last name
             if (!playerName || playerName === null) {
               const firstName = leader.firstName || leader.first_name
               const lastName = leader.lastName || leader.last_name
               if (firstName && lastName) {
                 playerName = `${firstName} ${lastName}`
                 console.log(`Combined receiving name from first/last:`, playerName)
               }
             }
             
             const mappedLeader: StatLeader = {
               playerId: leader.playerId || leader.player_id || index,
               name: playerName || `Player ${index + 1}`,
               teamName: teamName,
               statValue: leader.yards || leader.statValue || leader.value || 0,
               position: leader.position || 'WR',
               teamId: teamId,
               portraitId: leader.portraitId || leader.portrait_id,
               espnId: leader.espnId || leader.espn_id,
               // New leaderboard fields
               maddenId: leader.maddenId,
               touchdowns: leader.touchdowns,
               interceptions: leader.interceptions,
               completions: leader.completions,
               attempts: leader.attempts,
               rating: leader.rating,
               gamesPlayed: leader.gamesPlayed
             }
            return mappedLeader
          })
          // Only include receiving leaders if we're looking at receiving stats
          if (statType.includes('rec')) {
            processedLeaders = [...processedLeaders, ...mappedReceivingLeaders]
          }
        }
        
        // Process defensive leaders (new category)
        if (data.defensiveLeaders && Array.isArray(data.defensiveLeaders)) {
          console.log('Processing defensive leaders:', data.defensiveLeaders)
          const mappedDefensiveLeaders = data.defensiveLeaders.map((leader: BackendStatLeader, index: number) => {
            console.log(`Defensive leader ${index}:`, leader)
            
            const teamId = leader.teamId || leader.team_id
            const teamName = leader.teamName || leader.team_name || teamNames[teamId || 0] || `Team ${teamId || ''}`
            
            const mappedLeader: StatLeader = {
              playerId: leader.playerId || leader.player_id || index,
              name: leader.name || `Player ${index + 1}`,
              teamName: teamName,
              statValue: leader.yards || leader.statValue || leader.value || 0,
              position: leader.position || 'LB',
              teamId: teamId,
              portraitId: leader.portraitId || leader.portrait_id,
              espnId: leader.espnId || leader.espn_id,
              // New leaderboard fields
              maddenId: leader.maddenId,
              touchdowns: leader.touchdowns,
              interceptions: leader.interceptions,
              completions: leader.completions,
              attempts: leader.attempts,
              rating: leader.rating,
              gamesPlayed: leader.gamesPlayed
            }
            return mappedLeader
          })
          // Only include defensive leaders if we're looking at defensive stats
          if (statType.includes('def')) {
            processedLeaders = [...processedLeaders, ...mappedDefensiveLeaders]
          }
        }
        
        // Process kicking leaders (new category)
        if (data.kickingLeaders && Array.isArray(data.kickingLeaders)) {
          console.log('Processing kicking leaders:', data.kickingLeaders)
          const mappedKickingLeaders = data.kickingLeaders.map((leader: BackendStatLeader, index: number) => {
            console.log(`Kicking leader ${index}:`, leader)
            
            const teamId = leader.teamId || leader.team_id
            const teamName = leader.teamName || leader.team_name || teamNames[teamId || 0] || `Team ${teamId || ''}`
            
            const mappedLeader: StatLeader = {
              playerId: leader.playerId || leader.player_id || index,
              name: leader.name || `Player ${index + 1}`,
              teamName: teamName,
              statValue: leader.yards || leader.statValue || leader.value || 0,
              position: leader.position || 'K',
              teamId: teamId,
              portraitId: leader.portraitId || leader.portrait_id,
              espnId: leader.espnId || leader.espn_id,
              // New leaderboard fields
              maddenId: leader.maddenId,
              touchdowns: leader.touchdowns,
              interceptions: leader.interceptions,
              completions: leader.completions,
              attempts: leader.attempts,
              rating: leader.rating,
              gamesPlayed: leader.gamesPlayed
            }
            return mappedLeader
          })
          // Only include kicking leaders if we're looking at kicking stats
          if (statType.includes('kick')) {
            processedLeaders = [...processedLeaders, ...mappedKickingLeaders]
          }
        }
        
        // If no specific leaders found, try to use the data as a flat array (fallback)
        if (processedLeaders.length === 0 && Array.isArray(data)) {
          processedLeaders = data
        }
        
        // Additional fallback: try to extract data from any structure
        if (processedLeaders.length === 0) {
          console.log('No leaders found, trying alternative data extraction...')
          console.log('Full response structure:', JSON.stringify(data, null, 2))
          
          // Try to find any array in the response
          const allArrays = Object.values(data).filter(Array.isArray)
          console.log('All arrays found in response:', allArrays)
          
          if (allArrays.length > 0) {
            const firstArray = allArrays[0] as BackendStatLeader[]
            console.log('Using first array as fallback:', firstArray)
            const fallbackLeaders = firstArray.map((item: BackendStatLeader, index: number) => {
              console.log(`Fallback item ${index}:`, item)
              return {
                playerId: item.playerId || item.player_id || `player_${index}`,
                name: item.name || `Player ${index + 1}`,
                teamName: item.teamName || item.team_name || teamNames[item.teamId || item.team_id || 0] || `Team ${item.teamId || item.team_id || index}`,
                statValue: item.statValue || item.yards || item.value || 0,
                position: item.position || 'QB',
                teamId: item.teamId || item.team_id,
                portraitId: item.portraitId || item.portrait_id,
                espnId: item.espnId || item.espn_id
              }
            })
            processedLeaders = fallbackLeaders
          }
        }
        
        console.log('Final processed leaders:', processedLeaders)
        setLeaders(processedLeaders)
        setError(null)
      } catch (err) {
        console.error('Error fetching leaders:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch stat leaders')
      } finally {
        setLoading(false)
      }
    }
    fetchLeaders()
  }, [leagueId, statType, week, teamNames, checkLeaderboardStatus])

  const filteredLeaders =
    position === 'ALL'
      ? leaders
      : leaders.filter((l) => l.position?.toUpperCase() === position)

  const chartData = {
    labels: filteredLeaders.map((l) => `${l.name} (${l.teamName})`),
    datasets: [
      {
        label: statType,
        data: filteredLeaders.map((l) => l.statValue),
      },
    ],
  }

  if (loading) return <p className="text-gray-400">Loading stats...</p>
  if (error) return <p className="text-red-500">{error}</p>
  if (!leaders || leaders.length === 0) return <p className="text-gray-400">No stat leaders available for this selection.</p>

  return (
    <Card className="p-4 w-full">
      <CardContent>
        <div className="flex flex-wrap gap-4 items-center mb-6">
          <Select value={statType} onValueChange={setStatType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Stat Type" />
            </SelectTrigger>
            <SelectContent>
              {statOptions.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={position} onValueChange={setPosition}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Position" />
            </SelectTrigger>
            <SelectContent>
              {positionOptions.map((pos) => (
                <SelectItem key={pos} value={pos}>
                  {pos}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder="Week # (optional)"
            value={week}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setWeek(e.target.value)
            }
            className="w-[140px]"
            type="number"
          />

          <button
            className="ml-auto text-sm underline"
            onClick={() => setView(view === 'table' ? 'chart' : 'table')}
          >
            Toggle {view === 'table' ? 'Chart' : 'Table'}
          </button>
        </div>

        {view === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800">
                  <th className="text-left p-2">Rank</th>
                  <th className="text-left p-2">Player</th>
                  <th className="text-left p-2">Team</th>
                  <th className="text-left p-2">Pos</th>
                  <th className="text-right p-2">{statType}</th>
                  {/* Show additional stats for new leaderboard data */}
                  {filteredLeaders.some(l => l.touchdowns !== undefined) && <th className="text-right p-2">TDs</th>}
                  {filteredLeaders.some(l => l.interceptions !== undefined) && <th className="text-right p-2">INTs</th>}
                  {filteredLeaders.some(l => l.rating !== undefined) && <th className="text-right p-2">Rating</th>}
                </tr>
              </thead>
              <tbody>
                {filteredLeaders.map((leader, idx) => {
                  const isUserTeam = leader.teamId === currentTeamId
                  return (
                    <tr
                      key={leader.playerId}
                      className={`border-t cursor-pointer hover:bg-gray-700 ${
                        isUserTeam
                          ? 'bg-yellow-100 dark:bg-yellow-900 font-bold'
                          : ''
                      }`}
                                             onClick={() => handlePlayerClick(leader.name, leader.playerId, leader.maddenId)}
                    >
                      <td className="p-2">{idx + 1}</td>
                      <td className="p-2 flex items-center">
                        {leader.espnId ? (
                          <Link href={`/players/${leader.espnId}`}>
                            <Image
                              src={`/headshots/${leader.espnId}.png`}
                              alt={leader.name}
                              width={32}
                              height={32}
                              className="rounded-full"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = '/headshots/default.png'
                              }}
                            />
                          </Link>
                        ) : (
                          <Link href={`/players/${leader.playerId}`}>
                            <Image
                              src={leader.portraitId ? `/headshots/${leader.portraitId}.png` : '/default-avatar.png'}
                              alt={leader.name}
                              width={40}
                              height={40}
                              className="rounded-full object-cover mr-2"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/default-avatar.png'; }}
                            />
                          </Link>
                        )}
                        <button 
                                                     onClick={(e) => {
                             e.stopPropagation()
                             handlePlayerClick(leader.name, leader.playerId, leader.maddenId)
                           }}
                          className="text-blue-400 hover:underline cursor-pointer"
                        >
                          {leader.name}
                        </button>
                      </td>
                      <td className="p-2">{leader.teamName}</td>
                      <td className="p-2">{leader.position}</td>
                      <td className="p-2 text-right">{leader.statValue}</td>
                      {/* Show additional stats for new leaderboard data */}
                      {filteredLeaders.some(l => l.touchdowns !== undefined) && (
                        <td className="p-2 text-right">{leader.touchdowns || '-'}</td>
                      )}
                      {filteredLeaders.some(l => l.interceptions !== undefined) && (
                        <td className="p-2 text-right">{leader.interceptions || '-'}</td>
                      )}
                      {filteredLeaders.some(l => l.rating !== undefined) && (
                        <td className="p-2 text-right">{leader.rating ? leader.rating.toFixed(1) : '-'}</td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Bar data={chartData} />
        )}
      </CardContent>
    </Card>
  )
}
