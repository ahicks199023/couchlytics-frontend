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
  playerId: string
  name: string
  teamName: string
  statValue: number
  // Optional fields that may not be present in API response
  portraitId?: string
  espnId?: string
  teamId?: number
  position?: string
}

// Interface for the actual backend response structure
interface BackendStatLeader {
  playerId?: string
  player_id?: string
  name?: string
  teamName?: string
  team_name?: string
  teamId?: number
  team_id?: number
  statValue?: number
  yards?: number
  value?: number
  position?: string
  portraitId?: string
  portrait_id?: string
  espnId?: string
  espn_id?: string
}

interface ApiResponse {
  passingLeaders?: BackendStatLeader[]
  rushingLeaders?: BackendStatLeader[]
  receivingLeaders?: BackendStatLeader[]
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
      const res = await fetch(`${API_BASE}/leagues/${leagueId}/teams`, { credentials: 'include' })
      if (res.ok) {
        const teams = await res.json()
        const teamMap: Record<number, string> = {}
        teams.forEach((team: { id?: number; teamId?: number; name: string }) => {
          teamMap[team.id || team.teamId || 0] = team.name
        })
        setTeamNames(teamMap)
        console.log('Team names loaded:', teamMap)
      }
    } catch (err) {
      console.error('Failed to fetch team names:', err)
    }
  }, [leagueId])

  // Function to handle player navigation
  const handlePlayerClick = async (playerName: string, playerId: string) => {
    try {
      // Use the same simple approach as the players page
      // Navigate directly using the playerId from stat leaders
      router.push(`/leagues/${leagueId}/players/${playerId}`)
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
        const query = new URLSearchParams({ statType })
        if (week) query.append('week', week)

        const url = `${API_BASE}/leagues/${leagueId}/stats/leaders?${query.toString()}`
        console.log('Fetching stat leaders from:', url)
        
        const res = await fetch(url, { credentials: 'include' })
        if (!res.ok) {
          throw new Error('Failed to fetch stat leaders')
        }
        const data: ApiResponse = await res.json()
        console.log('Stat leaders response:', data)
        console.log('Raw passing leaders first item:', data.passingLeaders?.[0])
        console.log('Raw rushing leaders first item:', data.rushingLeaders?.[0])
        console.log('Raw receiving leaders first item:', data.receivingLeaders?.[0])
        
        // Handle the new API response structure
        let processedLeaders: StatLeader[] = []
        
        if (data.passingLeaders && Array.isArray(data.passingLeaders)) {
          console.log('Processing passing leaders:', data.passingLeaders)
          const mappedPassingLeaders = data.passingLeaders.map((leader: BackendStatLeader, index: number) => {
            console.log(`Passing leader ${index}:`, leader)
            const teamId = leader.teamId || leader.team_id
            const teamName = leader.teamName || leader.team_name || teamNames[teamId || 0] || `Team ${teamId || ''}`
            const mappedLeader = {
              playerId: leader.playerId || leader.player_id || '',
              name: leader.name || '',
              teamName: teamName,
              statValue: leader.statValue || leader.yards || leader.value || 0,
              position: leader.position || 'QB',
              teamId: teamId,
              portraitId: leader.portraitId || leader.portrait_id,
              espnId: leader.espnId || leader.espn_id
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
          const mappedRushingLeaders = data.rushingLeaders.map((leader: BackendStatLeader) => {
            const teamId = leader.teamId || leader.team_id
            const teamName = leader.teamName || leader.team_name || teamNames[teamId || 0] || `Team ${teamId || ''}`
            return {
              playerId: leader.playerId || leader.player_id || '',
              name: leader.name || '',
              teamName: teamName,
              statValue: leader.statValue || leader.yards || leader.value || 0,
              position: leader.position || 'HB',
              teamId: teamId,
              portraitId: leader.portraitId || leader.portrait_id,
              espnId: leader.espnId || leader.espn_id
            }
          })
          // Only include rushing leaders if we're looking at rushing stats
          if (statType.includes('rush')) {
            processedLeaders = [...processedLeaders, ...mappedRushingLeaders]
          }
        }
        if (data.receivingLeaders && Array.isArray(data.receivingLeaders)) {
          console.log('Processing receiving leaders:', data.receivingLeaders)
          const mappedReceivingLeaders = data.receivingLeaders.map((leader: BackendStatLeader) => {
            const teamId = leader.teamId || leader.team_id
            const teamName = leader.teamName || leader.team_name || teamNames[teamId || 0] || `Team ${teamId || ''}`
            return {
              playerId: leader.playerId || leader.player_id || '',
              name: leader.name || '',
              teamName: teamName,
              statValue: leader.statValue || leader.yards || leader.value || 0,
              position: leader.position || 'WR',
              teamId: teamId,
              portraitId: leader.portraitId || leader.portrait_id,
              espnId: leader.espnId || leader.espn_id
            }
          })
          // Only include receiving leaders if we're looking at receiving stats
          if (statType.includes('rec')) {
            processedLeaders = [...processedLeaders, ...mappedReceivingLeaders]
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
  }, [leagueId, statType, week, teamNames])

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
                      onClick={() => handlePlayerClick(leader.name, leader.playerId)}
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
                            handlePlayerClick(leader.name, leader.playerId)
                          }}
                          className="text-blue-400 hover:underline cursor-pointer"
                        >
                          {leader.name}
                        </button>
                      </td>
                      <td className="p-2">{leader.teamName}</td>
                      <td className="p-2">{leader.position}</td>
                      <td className="p-2 text-right">{leader.statValue}</td>
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
