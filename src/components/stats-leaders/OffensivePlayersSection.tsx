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
          console.log('Passing leaders raw data:', passingRes.value.leaders)
          console.log('First passing leader:', passingRes.value.leaders[0])
          console.log('First passing leader all fields:', Object.keys(passingRes.value.leaders[0]))
          console.log('First passing leader full object:', JSON.stringify(passingRes.value.leaders[0], null, 2))
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
    { key: 'teamName', label: 'Team', sortable: true },
    { key: 'position', label: 'Pos', sortable: true },
    { key: 'yards', label: 'Yards', sortable: true, align: 'right' as const },
    { key: 'touchdowns', label: 'TDs', sortable: true, align: 'right' as const },
    { key: 'interceptions', label: 'INTs', sortable: true, align: 'right' as const },
    { key: 'rating', label: 'Rating', sortable: true, align: 'right' as const, formatter: (value: unknown) => typeof value === 'number' ? value.toFixed(1) : '-' },
    { key: 'gamesPlayed', label: 'Games', sortable: true, align: 'right' as const },
  ]

  const rushingColumns = [
    { key: 'name', label: 'Player', sortable: true },
    { key: 'teamName', label: 'Team', sortable: true },
    { key: 'position', label: 'Pos', sortable: true },
    { key: 'yards', label: 'Yards', sortable: true, align: 'right' as const },
    { key: 'touchdowns', label: 'TDs', sortable: true, align: 'right' as const },
    { key: 'attempts', label: 'Attempts', sortable: true, align: 'right' as const },
    { key: 'averagePerAttempt', label: 'Avg/Att', sortable: true, align: 'right' as const, formatter: (value: unknown) => typeof value === 'number' ? value.toFixed(1) : '-' },
    { key: 'gamesPlayed', label: 'Games', sortable: true, align: 'right' as const },
  ]

  const receivingColumns = [
    { key: 'name', label: 'Player', sortable: true },
    { key: 'teamName', label: 'Team', sortable: true },
    { key: 'position', label: 'Pos', sortable: true },
    { key: 'yards', label: 'Yards', sortable: true, align: 'right' as const },
    { key: 'touchdowns', label: 'TDs', sortable: true, align: 'right' as const },
    { key: 'catches', label: 'Catches', sortable: true, align: 'right' as const },
    { key: 'averagePerCatch', label: 'Avg/Catch', sortable: true, align: 'right' as const, formatter: (value: unknown) => typeof value === 'number' ? value.toFixed(1) : '-' },
    { key: 'gamesPlayed', label: 'Games', sortable: true, align: 'right' as const },
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

      {/* Receiving Leaders */}
      <StatsTable
        title="Receiving Leaders"
        columns={receivingColumns}
        data={receivingLeaders}
        leagueId={leagueId}
        highlightUserTeam={true}
        currentTeamId={currentTeamId}
      />
    </div>
  )
} 