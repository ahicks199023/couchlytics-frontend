'use client'

import { useEffect, useState } from 'react'
import { StatsTable } from './StatsTable'
import { StatsLeadersAPI } from '@/lib/stats-leaders-api'
import { API_BASE } from '@/lib/config'
import {
  PlayerPassingLeader,
  PlayerRushingLeader,
  PlayerReceivingLeader,
} from '@/types/stats-leaders'

interface OffensivePlayersSectionProps {
  leagueId: string
}

export function OffensivePlayersSection({ leagueId }: OffensivePlayersSectionProps) {
  const [passingLeaders, setPassingLeaders] = useState<PlayerPassingLeader[]>([])
  const [rushingLeaders, setRushingLeaders] = useState<PlayerRushingLeader[]>([])
  const [receivingLeaders, setReceivingLeaders] = useState<PlayerReceivingLeader[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentTeamId, setCurrentTeamId] = useState<number | null>(null)

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
  }, [])

  useEffect(() => {
    const fetchOffensiveStats = async () => {
      setLoading(true)
      setError(null)

      try {
        // Fetch all offensive stats in parallel
        const [passingRes, rushingRes, receivingRes] = await Promise.allSettled([
          StatsLeadersAPI.getPlayerPassingLeaders(leagueId, 10),
          StatsLeadersAPI.getPlayerRushingLeaders(leagueId, 10),
          StatsLeadersAPI.getPlayerReceivingLeaders(leagueId, 10),
        ])

        // Handle passing leaders
        if (passingRes.status === 'fulfilled') {
          setPassingLeaders(passingRes.value.leaders as PlayerPassingLeader[])
        } else {
          console.error('Failed to fetch passing leaders:', passingRes.reason)
        }

        // Handle rushing leaders
        if (rushingRes.status === 'fulfilled') {
          setRushingLeaders(rushingRes.value.leaders as PlayerRushingLeader[])
        } else {
          console.error('Failed to fetch rushing leaders:', rushingRes.reason)
        }

        // Handle receiving leaders
        if (receivingRes.status === 'fulfilled') {
          setReceivingLeaders(receivingRes.value.leaders as PlayerReceivingLeader[])
        } else {
          console.error('Failed to fetch receiving leaders:', receivingRes.reason)
        }

        // Check if any requests failed
        const failedRequests = [passingRes, rushingRes, receivingRes].filter(
          (result) => result.status === 'rejected'
        )

        if (failedRequests.length === 3) {
          setError('Failed to load offensive statistics')
        }
      } catch (err) {
        console.error('Error fetching offensive stats:', err)
        setError('Failed to load offensive statistics')
      } finally {
        setLoading(false)
      }
    }

    fetchOffensiveStats()
  }, [leagueId])

  const passingColumns = [
    { key: 'name', label: 'Player', sortable: true },
    { key: 'team_name', label: 'Team', sortable: true },
    { key: 'position', label: 'Pos', sortable: true },
    { key: 'yards', label: 'Yards', sortable: true, align: 'right' as const },
    { key: 'touchdowns', label: 'TDs', sortable: true, align: 'right' as const },
    { key: 'interceptions', label: 'INTs', sortable: true, align: 'right' as const },
    { key: 'rating', label: 'Rating', sortable: true, align: 'right' as const, formatter: (value: unknown) => typeof value === 'number' ? value.toFixed(1) : '-' },
    { key: 'games_played', label: 'Games', sortable: true, align: 'right' as const },
  ]

  const rushingColumns = [
    { key: 'name', label: 'Player', sortable: true },
    { key: 'team_name', label: 'Team', sortable: true },
    { key: 'position', label: 'Pos', sortable: true },
    { key: 'yards', label: 'Yards', sortable: true, align: 'right' as const },
    { key: 'touchdowns', label: 'TDs', sortable: true, align: 'right' as const },
    { key: 'attempts', label: 'Attempts', sortable: true, align: 'right' as const },
    { key: 'average_per_attempt', label: 'Avg/Att', sortable: true, align: 'right' as const, formatter: (value: unknown) => typeof value === 'number' ? value.toFixed(1) : '-' },
    { key: 'games_played', label: 'Games', sortable: true, align: 'right' as const },
  ]

  const receivingColumns = [
    { key: 'name', label: 'Player', sortable: true },
    { key: 'team_name', label: 'Team', sortable: true },
    { key: 'position', label: 'Pos', sortable: true },
    { key: 'yards', label: 'Yards', sortable: true, align: 'right' as const },
    { key: 'touchdowns', label: 'TDs', sortable: true, align: 'right' as const },
    { key: 'catches', label: 'Catches', sortable: true, align: 'right' as const },
    { key: 'average_per_catch', label: 'Avg/Catch', sortable: true, align: 'right' as const, formatter: (value: unknown) => typeof value === 'number' ? value.toFixed(1) : '-' },
    { key: 'games_played', label: 'Games', sortable: true, align: 'right' as const },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-lg text-gray-600">Loading offensive statistics...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-red-500 text-center py-8 text-lg">{error}</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Passing Leaders */}
      <StatsTable
        title="Passing Leaders"
        columns={passingColumns}
        data={passingLeaders}
        leagueId={leagueId}
        highlightUserTeam={true}
        currentTeamId={currentTeamId}
        onRowClick={async (player) => {
          console.log('Player data for routing:', player)
          console.log('Available fields:', Object.keys(player))
          
          // Since the API doesn't include player IDs, we'll search by name
          const playerName = player.name as string
          if (playerName) {
            try {
              // Search for the player by name using the backend API
              const searchResponse = await fetch(`https://api.couchlytics.com/leagues/${leagueId}/players/search?name=${encodeURIComponent(playerName)}`, {
                credentials: 'include'
              })
              
              if (searchResponse.ok) {
                const searchData = await searchResponse.json()
                console.log('Search response:', searchData)
                
                if (searchData.players && searchData.players.length > 0) {
                  const foundPlayer = searchData.players[0]
                  const playerId = foundPlayer.id || foundPlayer.madden_id
                  console.log('Found player ID:', playerId)
                  if (playerId) {
                    window.location.href = `/leagues/${leagueId}/players/${playerId}`
                    return
                  }
                }
              }
              
              // If search fails or no player found, show a message
              console.log('No player found or search failed')
              alert(`Player details for ${playerName} are not available yet.`)
              
            } catch (error) {
              console.error('Error searching for player:', error)
              // Fallback: show a message that player details aren't available
              alert(`Player details for ${playerName} are not available yet.`)
            }
          } else {
            console.log('No player name found')
          }
        }}
      />

      {/* Rushing Leaders */}
      <StatsTable
        title="Rushing Leaders"
        columns={rushingColumns}
        data={rushingLeaders}
        leagueId={leagueId}
        highlightUserTeam={true}
        currentTeamId={currentTeamId}
        onRowClick={async (player) => {
          console.log('Player data for routing:', player)
          console.log('Available fields:', Object.keys(player))
          
          // Since the API doesn't include player IDs, we'll search by name
          const playerName = player.name as string
          if (playerName) {
            try {
              // Search for the player by name
              const searchResponse = await fetch(`/api/leagues/${leagueId}/players/search?name=${encodeURIComponent(playerName)}`, {
                credentials: 'include'
              })
              
              if (searchResponse.ok) {
                const searchData = await searchResponse.json()
                if (searchData.players && searchData.players.length > 0) {
                  const foundPlayer = searchData.players[0]
                  const playerId = foundPlayer.id || foundPlayer.maddenId
                  console.log('Found player ID:', playerId)
                  if (playerId) {
                    window.location.href = `/leagues/${leagueId}/players/${playerId}`
                    return
                  }
                }
              }
              
              // Fallback: try to navigate using the player name as a slug
              console.log('No player ID found, trying name-based routing')
              window.location.href = `/leagues/${leagueId}/players/search?name=${encodeURIComponent(playerName)}`
              
            } catch (error) {
              console.error('Error searching for player:', error)
              // Fallback: show a message that player details aren't available
              alert(`Player details for ${playerName} are not available yet.`)
            }
          } else {
            console.log('No player name found')
          }
        }}
      />

      {/* Receiving Leaders */}
      <StatsTable
        title="Receiving Leaders"
        columns={receivingColumns}
        data={receivingLeaders}
        leagueId={leagueId}
        highlightUserTeam={true}
        currentTeamId={currentTeamId}
        onRowClick={async (player) => {
          console.log('Player data for routing:', player)
          console.log('Available fields:', Object.keys(player))
          
          // Since the API doesn't include player IDs, we'll search by name
          const playerName = player.name as string
          if (playerName) {
            try {
              // Search for the player by name
              const searchResponse = await fetch(`/api/leagues/${leagueId}/players/search?name=${encodeURIComponent(playerName)}`, {
                credentials: 'include'
              })
              
              if (searchResponse.ok) {
                const searchData = await searchResponse.json()
                if (searchData.players && searchData.players.length > 0) {
                  const foundPlayer = searchData.players[0]
                  const playerId = foundPlayer.id || foundPlayer.maddenId
                  console.log('Found player ID:', playerId)
                  if (playerId) {
                    window.location.href = `/leagues/${leagueId}/players/${playerId}`
                    return
                  }
                }
              }
              
              // Fallback: try to navigate using the player name as a slug
              console.log('No player ID found, trying name-based routing')
              window.location.href = `/leagues/${leagueId}/players/search?name=${encodeURIComponent(playerName)}`
              
            } catch (error) {
              console.error('Error searching for player:', error)
              // Fallback: show a message that player details aren't available
              alert(`Player details for ${playerName} are not available yet.`)
            }
          } else {
            console.log('No player name found')
          }
        }}
      />
    </div>
  )
} 