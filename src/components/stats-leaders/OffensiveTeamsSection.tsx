'use client'

import { useEffect, useState } from 'react'
import { StatsTable } from './StatsTable'
import { StatsLeadersAPI } from '@/lib/stats-leaders-api'
import { API_BASE } from '@/lib/config'
import {
  TeamTotalYardsLeader,
  TeamPassingLeader,
  TeamRushingLeader,
} from '@/types/stats-leaders'

interface OffensiveTeamsSectionProps {
  leagueId: string
}

export function OffensiveTeamsSection({ leagueId }: OffensiveTeamsSectionProps) {
  const [totalYardsLeaders, setTotalYardsLeaders] = useState<TeamTotalYardsLeader[]>([])
  const [passingLeaders, setPassingLeaders] = useState<TeamPassingLeader[]>([])
  const [rushingLeaders, setRushingLeaders] = useState<TeamRushingLeader[]>([])
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
    const fetchOffensiveTeamStats = async () => {
      setLoading(true)
      setError(null)

      try {
        // Fetch all offensive team stats in parallel
        const [totalYardsRes, passingRes, rushingRes] = await Promise.allSettled([
          StatsLeadersAPI.getTeamTotalYardsLeaders(leagueId, 10),
          StatsLeadersAPI.getTeamPassingLeaders(leagueId, 10),
          StatsLeadersAPI.getTeamRushingLeaders(leagueId, 10),
        ])

        // Handle total yards leaders
        if (totalYardsRes.status === 'fulfilled') {
          setTotalYardsLeaders(totalYardsRes.value.leaders as TeamTotalYardsLeader[])
        } else {
          console.error('Failed to fetch total yards leaders:', totalYardsRes.reason)
        }

        // Handle passing leaders
        if (passingRes.status === 'fulfilled') {
          setPassingLeaders(passingRes.value.leaders as TeamPassingLeader[])
        } else {
          console.error('Failed to fetch passing leaders:', passingRes.reason)
        }

        // Handle rushing leaders
        if (rushingRes.status === 'fulfilled') {
          setRushingLeaders(rushingRes.value.leaders as TeamRushingLeader[])
        } else {
          console.error('Failed to fetch rushing leaders:', rushingRes.reason)
        }

        // Check if any requests failed
        const failedRequests = [totalYardsRes, passingRes, rushingRes].filter(
          (result) => result.status === 'rejected'
        )

        if (failedRequests.length === 3) {
          setError('Failed to load offensive team statistics')
        }
      } catch (err) {
        console.error('Error fetching offensive team stats:', err)
        setError('Failed to load offensive team statistics')
      } finally {
        setLoading(false)
      }
    }

    fetchOffensiveTeamStats()
  }, [leagueId])

  const totalYardsColumns = [
    { key: 'teamName', label: 'Team', sortable: true },
    { key: 'totalYards', label: 'Total Yards', sortable: true, align: 'right' as const },
    { key: 'passingYards', label: 'Passing Yards', sortable: true, align: 'right' as const },
    { key: 'rushingYards', label: 'Rushing Yards', sortable: true, align: 'right' as const },
    { key: 'yardsPerGame', label: 'Yards/Game', sortable: true, align: 'right' as const, formatter: (value: unknown) => typeof value === 'number' ? value.toFixed(1) : '-' },
    { key: 'gamesPlayed', label: 'Games', sortable: true, align: 'right' as const },
  ]

  const passingColumns = [
    { key: 'teamName', label: 'Team', sortable: true },
    { key: 'passingYards', label: 'Passing Yards', sortable: true, align: 'right' as const },
    { key: 'passingTouchdowns', label: 'Passing TDs', sortable: true, align: 'right' as const },
    { key: 'interceptionsLost', label: 'INTs Lost', sortable: true, align: 'right' as const },
    { key: 'sacksAllowed', label: 'Sacks Allowed', sortable: true, align: 'right' as const },
    { key: 'yardsPerGame', label: 'Yards/Game', sortable: true, align: 'right' as const, formatter: (value: unknown) => typeof value === 'number' ? value.toFixed(1) : '-' },
    { key: 'gamesPlayed', label: 'Games', sortable: true, align: 'right' as const },
  ]

  const rushingColumns = [
    { key: 'teamName', label: 'Team', sortable: true },
    { key: 'rushingYards', label: 'Rushing Yards', sortable: true, align: 'right' as const },
    { key: 'rushingTouchdowns', label: 'Rushing TDs', sortable: true, align: 'right' as const },
    { key: 'fumblesLost', label: 'Fumbles Lost', sortable: true, align: 'right' as const },
    { key: 'yardsPerGame', label: 'Yards/Game', sortable: true, align: 'right' as const, formatter: (value: unknown) => typeof value === 'number' ? value.toFixed(1) : '-' },
    { key: 'gamesPlayed', label: 'Games', sortable: true, align: 'right' as const },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-lg text-gray-600">Loading offensive team statistics...</span>
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
      {/* Total Yards Leaders */}
      <StatsTable
        title="Total Yards Leaders"
        columns={totalYardsColumns}
        data={totalYardsLeaders}
        leagueId={leagueId}
        highlightUserTeam={true}
        currentTeamId={currentTeamId}
      />

      {/* Passing Leaders */}
      <StatsTable
        title="Passing Leaders"
        columns={passingColumns}
        data={passingLeaders}
        leagueId={leagueId}
        highlightUserTeam={true}
        currentTeamId={currentTeamId}
      />

      {/* Rushing Leaders */}
      <StatsTable
        title="Rushing Leaders"
        columns={rushingColumns}
        data={rushingLeaders}
        leagueId={leagueId}
        highlightUserTeam={true}
        currentTeamId={currentTeamId}
      />
    </div>
  )
} 