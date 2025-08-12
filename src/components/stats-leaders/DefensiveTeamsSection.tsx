'use client'

import { useEffect, useState } from 'react'
import { StatsTable } from './StatsTable'
import { StatsLeadersAPI } from '@/lib/stats-leaders-api'
import { API_BASE } from '@/lib/config'
import {
  TeamYardsAllowedLeader,
  TeamSacksLeader,
  TeamTurnoversLeader,
} from '@/types/stats-leaders'

interface DefensiveTeamsSectionProps {
  leagueId: string
}

export function DefensiveTeamsSection({ leagueId }: DefensiveTeamsSectionProps) {
  const [yardsAllowedLeaders, setYardsAllowedLeaders] = useState<TeamYardsAllowedLeader[]>([])
  const [sacksLeaders, setSacksLeaders] = useState<TeamSacksLeader[]>([])
  const [turnoversLeaders, setTurnoversLeaders] = useState<TeamTurnoversLeader[]>([])
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
    const fetchDefensiveTeamStats = async () => {
      setLoading(true)
      setError(null)

      try {
        // Fetch all defensive team stats in parallel
        const [yardsAllowedRes, sacksRes, turnoversRes] = await Promise.allSettled([
          StatsLeadersAPI.getTeamYardsAllowedLeaders(leagueId, 10),
          StatsLeadersAPI.getTeamSacksLeaders(leagueId, 10),
          StatsLeadersAPI.getTeamTurnoversLeaders(leagueId, 10),
        ])

                 // Handle yards allowed leaders
         if (yardsAllowedRes.status === 'fulfilled') {
           setYardsAllowedLeaders(yardsAllowedRes.value.leaders as TeamYardsAllowedLeader[])
         } else {
           console.error('Failed to fetch yards allowed leaders:', yardsAllowedRes.reason)
         }

        // Handle sacks leaders
        if (sacksRes.status === 'fulfilled') {
          setSacksLeaders(sacksRes.value.leaders as TeamSacksLeader[])
        } else {
          console.error('Failed to fetch sacks leaders:', sacksRes.reason)
        }

        // Handle turnovers leaders
        if (turnoversRes.status === 'fulfilled') {
          setTurnoversLeaders(turnoversRes.value.leaders as TeamTurnoversLeader[])
        } else {
          console.error('Failed to fetch turnovers leaders:', turnoversRes.reason)
        }

        // Check if any requests failed
        const failedRequests = [yardsAllowedRes, sacksRes, turnoversRes].filter(
          (result) => result.status === 'rejected'
        )

        if (failedRequests.length === 3) {
          setError('Failed to load defensive team statistics')
        }
      } catch (err) {
        console.error('Error fetching defensive team stats:', err)
        setError('Failed to load defensive team statistics')
      } finally {
        setLoading(false)
      }
    }

    fetchDefensiveTeamStats()
  }, [leagueId])

  const getNumber = (v: unknown) => (typeof v === 'number' ? v : Number(v || 0))
  const fmt1 = (v: unknown) => getNumber(v).toFixed(1)

  const yardsAllowedColumns = [
    { key: 'team_name', label: 'Team', sortable: true },
    { key: 'total_yards_allowed', label: 'Total Yards Allowed', sortable: true, align: 'right' as const },
    { key: 'passing_yards_allowed', label: 'Pass Yards Allowed', sortable: true, align: 'right' as const },
    { key: 'rushing_yards_allowed', label: 'Rush Yards Allowed', sortable: true, align: 'right' as const },
    { key: 'yardsAllowedPerGame', label: 'Yards/Game', sortable: true, align: 'right' as const, formatter: (_: unknown, row?: Record<string, unknown>) => fmt1((row as any)?.yardsAllowedPerGame ?? (row as any)?.yards_allowed_per_game) },
    { key: 'games_played', label: 'Games', sortable: true, align: 'right' as const },
  ]

  const sacksColumns = [
    { key: 'team_name', label: 'Team', sortable: true },
    { key: 'sacks', label: 'Total Sacks', sortable: true, align: 'right' as const },
    { key: 'interceptions', label: 'INTs', sortable: true, align: 'right' as const },
    { key: 'forced_fumbles', label: 'Forced Fumbles', sortable: true, align: 'right' as const },
    { key: 'fumble_recoveries', label: 'Fumble Recoveries', sortable: true, align: 'right' as const },
    { key: 'sacksPerGame', label: 'Sacks/Game', sortable: true, align: 'right' as const, formatter: (_: unknown, row?: Record<string, unknown>) => fmt1((row as any)?.sacksPerGame ?? (row as any)?.sacks_per_game) },
    { key: 'games_played', label: 'Games', sortable: true, align: 'right' as const },
  ]

  const turnoversColumns = [
    { key: 'team_name', label: 'Team', sortable: true },
    { key: 'turnover_differential', label: 'Turnover Differential', sortable: true, align: 'right' as const },
    { key: 'takeaways', label: 'Takeaways', sortable: true, align: 'right' as const },
    { key: 'giveaways', label: 'Giveaways', sortable: true, align: 'right' as const },
    { key: 'interceptions', label: 'INTs', sortable: true, align: 'right' as const },
    { key: 'fumble_recoveries', label: 'Fumble Recoveries', sortable: true, align: 'right' as const },
    { key: 'games_played', label: 'Games', sortable: true, align: 'right' as const },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-lg text-gray-600">Loading defensive team statistics...</span>
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
      {/* Yards Allowed Leaders */}
      <StatsTable
        title="Yards Allowed Leaders"
        columns={yardsAllowedColumns}
        data={yardsAllowedLeaders}
        leagueId={leagueId}
        highlightUserTeam={true}
        currentTeamId={currentTeamId}
      />

      {/* Sacks Leaders */}
      <StatsTable
        title="Sacks Leaders"
        columns={sacksColumns}
        data={sacksLeaders}
        leagueId={leagueId}
        highlightUserTeam={true}
        currentTeamId={currentTeamId}
      />

      {/* Turnovers Leaders */}
      <StatsTable
        title="Turnovers Leaders"
        columns={turnoversColumns}
        data={turnoversLeaders}
        leagueId={leagueId}
        highlightUserTeam={true}
        currentTeamId={currentTeamId}
      />
    </div>
  )
} 