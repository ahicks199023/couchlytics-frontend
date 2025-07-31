'use client'

import { useEffect, useState } from 'react'
import { StatsTable } from './StatsTable'
import { StatsLeadersAPI } from '@/lib/stats-leaders-api'
import { API_BASE } from '@/lib/config'
import {
  PlayerTacklesLeader,
  PlayerSacksLeader,
  PlayerInterceptionsLeader,
} from '@/types/stats-leaders'

interface DefensivePlayersSectionProps {
  leagueId: string
}

export function DefensivePlayersSection({ leagueId }: DefensivePlayersSectionProps) {
  const [tacklesLeaders, setTacklesLeaders] = useState<PlayerTacklesLeader[]>([])
  const [sacksLeaders, setSacksLeaders] = useState<PlayerSacksLeader[]>([])
  const [interceptionsLeaders, setInterceptionsLeaders] = useState<PlayerInterceptionsLeader[]>([])
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
    const fetchDefensiveStats = async () => {
      setLoading(true)
      setError(null)

      try {
        // Fetch all defensive stats in parallel
        const [tacklesRes, sacksRes, interceptionsRes] = await Promise.allSettled([
          StatsLeadersAPI.getPlayerTacklesLeaders(leagueId, 10),
          StatsLeadersAPI.getPlayerSacksLeaders(leagueId, 10),
          StatsLeadersAPI.getPlayerInterceptionsLeaders(leagueId, 10),
        ])

        // Handle tackles leaders
        if (tacklesRes.status === 'fulfilled') {
          setTacklesLeaders(tacklesRes.value.leaders as PlayerTacklesLeader[])
        } else {
          console.error('Failed to fetch tackles leaders:', tacklesRes.reason)
        }

        // Handle sacks leaders
        if (sacksRes.status === 'fulfilled') {
          setSacksLeaders(sacksRes.value.leaders as PlayerSacksLeader[])
        } else {
          console.error('Failed to fetch sacks leaders:', sacksRes.reason)
        }

        // Handle interceptions leaders
        if (interceptionsRes.status === 'fulfilled') {
          setInterceptionsLeaders(interceptionsRes.value.leaders as PlayerInterceptionsLeader[])
        } else {
          console.error('Failed to fetch interceptions leaders:', interceptionsRes.reason)
        }

        // Check if any requests failed
        const failedRequests = [tacklesRes, sacksRes, interceptionsRes].filter(
          (result) => result.status === 'rejected'
        )

        if (failedRequests.length === 3) {
          setError('Failed to load defensive statistics')
        }
      } catch (err) {
        console.error('Error fetching defensive stats:', err)
        setError('Failed to load defensive statistics')
      } finally {
        setLoading(false)
      }
    }

    fetchDefensiveStats()
  }, [leagueId])

  const tacklesColumns = [
    { key: 'name', label: 'Player', sortable: true },
    { key: 'team_name', label: 'Team', sortable: true },
    { key: 'position', label: 'Pos', sortable: true },
    { key: 'tackles', label: 'Tackles', sortable: true, align: 'right' as const },
    { key: 'sacks', label: 'Sacks', sortable: true, align: 'right' as const },
    { key: 'interceptions', label: 'INTs', sortable: true, align: 'right' as const },
    { key: 'fumble_recoveries', label: 'Fum Rec', sortable: true, align: 'right' as const },
    { key: 'games_played', label: 'Games', sortable: true, align: 'right' as const },
  ]

  const sacksColumns = [
    { key: 'name', label: 'Player', sortable: true },
    { key: 'team_name', label: 'Team', sortable: true },
    { key: 'position', label: 'Pos', sortable: true },
    { key: 'sacks', label: 'Sacks', sortable: true, align: 'right' as const },
    { key: 'tackles', label: 'Tackles', sortable: true, align: 'right' as const },
    { key: 'interceptions', label: 'INTs', sortable: true, align: 'right' as const },
    { key: 'forced_fumbles', label: 'Forced Fum', sortable: true, align: 'right' as const },
    { key: 'games_played', label: 'Games', sortable: true, align: 'right' as const },
  ]

  const interceptionsColumns = [
    { key: 'name', label: 'Player', sortable: true },
    { key: 'team_name', label: 'Team', sortable: true },
    { key: 'position', label: 'Pos', sortable: true },
    { key: 'interceptions', label: 'INTs', sortable: true, align: 'right' as const },
    { key: 'return_yards', label: 'Return Yds', sortable: true, align: 'right' as const },
    { key: 'touchdowns', label: 'TDs', sortable: true, align: 'right' as const },
    { key: 'tackles', label: 'Tackles', sortable: true, align: 'right' as const },
    { key: 'games_played', label: 'Games', sortable: true, align: 'right' as const },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-green"></div>
          <span className="ml-3 text-lg text-gray-600">Loading defensive statistics...</span>
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
      {/* Tackles Leaders */}
      <StatsTable
        title="Tackles Leaders"
        columns={tacklesColumns}
        data={tacklesLeaders}
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

      {/* Sacks Leaders */}
      <StatsTable
        title="Sacks Leaders"
        columns={sacksColumns}
        data={sacksLeaders}
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

      {/* Interceptions Leaders */}
      <StatsTable
        title="Interceptions Leaders"
        columns={interceptionsColumns}
        data={interceptionsLeaders}
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