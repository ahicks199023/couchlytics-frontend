'use client'

import { useEffect, useState } from 'react'
import { analyticsApi } from '@/lib/analytics'
import { PlayerStats as PlayerStatsType } from '@/types/analytics'
import TeamBadge from '@/components/TeamBadge'

interface PlayerStatsProps {
  leagueId: string | number
  playerId: string | number
}

export default function PlayerStats({ leagueId, playerId }: PlayerStatsProps) {
  const [playerStats, setPlayerStats] = useState<PlayerStatsType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPlayerStats = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await analyticsApi.getPlayerStats(leagueId, playerId)
        setPlayerStats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch player stats')
        console.error('Error fetching player stats:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPlayerStats()
  }, [leagueId, playerId])

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-green"></div>
        <span className="ml-2 text-white">Loading player stats...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
        <h3 className="text-red-400 font-semibold mb-2">Error Loading Player Stats</h3>
        <p className="text-red-300">{error}</p>
      </div>
    )
  }

  if (!playerStats) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-400">No player stats available</p>
      </div>
    )
  }

  const renderPassingStats = (stats: PlayerStatsType['stats']['passing']) => {
    if (!stats) return null
    return (
      <div className="bg-gray-800/50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-3">Passing</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-gray-400">Completions</div>
            <div className="text-white font-medium">{stats.completions}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400">Attempts</div>
            <div className="text-white font-medium">{stats.attempts}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400">Completion %</div>
            <div className="text-white font-medium">
              {stats.attempts > 0 ? ((stats.completions / stats.attempts) * 100).toFixed(1) : '0.0'}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-gray-400">Yards</div>
            <div className="text-white font-medium">{stats.yards.toLocaleString()}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400">Touchdowns</div>
            <div className="text-green-400 font-medium">{stats.touchdowns}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400">Interceptions</div>
            <div className="text-red-400 font-medium">{stats.interceptions}</div>
          </div>
          <div className="text-center md:col-span-3">
            <div className="text-gray-400">Passer Rating</div>
            <div className="text-white font-medium text-lg">{stats.rating.toFixed(1)}</div>
          </div>
        </div>
      </div>
    )
  }

  const renderRushingStats = (stats: PlayerStatsType['stats']['rushing']) => {
    if (!stats) return null
    return (
      <div className="bg-gray-800/50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-3">Rushing</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-gray-400">Attempts</div>
            <div className="text-white font-medium">{stats.attempts}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400">Yards</div>
            <div className="text-white font-medium">{stats.yards.toLocaleString()}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400">Touchdowns</div>
            <div className="text-green-400 font-medium">{stats.touchdowns}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400">Fumbles</div>
            <div className="text-red-400 font-medium">{stats.fumbles}</div>
          </div>
          <div className="text-center md:col-span-4">
            <div className="text-gray-400">Average Per Carry</div>
            <div className="text-white font-medium text-lg">
              {stats.attempts > 0 ? (stats.yards / stats.attempts).toFixed(1) : '0.0'} ypc
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderReceivingStats = (stats: PlayerStatsType['stats']['receiving']) => {
    if (!stats) return null
    return (
      <div className="bg-gray-800/50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-3">Receiving</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-gray-400">Receptions</div>
            <div className="text-white font-medium">{stats.receptions}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400">Yards</div>
            <div className="text-white font-medium">{stats.yards.toLocaleString()}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400">Touchdowns</div>
            <div className="text-green-400 font-medium">{stats.touchdowns}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400">Drops</div>
            <div className="text-red-400 font-medium">{stats.drops}</div>
          </div>
          <div className="text-center md:col-span-4">
            <div className="text-gray-400">Average Per Reception</div>
            <div className="text-white font-medium text-lg">
              {stats.receptions > 0 ? (stats.yards / stats.receptions).toFixed(1) : '0.0'} ypr
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderDefenseStats = (stats: PlayerStatsType['stats']['defense']) => {
    if (!stats) return null
    return (
      <div className="bg-gray-800/50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-3">Defense</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-gray-400">Tackles</div>
            <div className="text-white font-medium">{stats.tackles}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400">Sacks</div>
            <div className="text-green-400 font-medium">{stats.sacks}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400">Interceptions</div>
            <div className="text-green-400 font-medium">{stats.interceptions}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400">Passes Defended</div>
            <div className="text-white font-medium">{stats.passesDefended}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400">Forced Fumbles</div>
            <div className="text-green-400 font-medium">{stats.forcedFumbles}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400">Fumble Recoveries</div>
            <div className="text-green-400 font-medium">{stats.fumbleRecoveries}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400">Touchdowns</div>
            <div className="text-green-400 font-medium">{stats.touchdowns}</div>
          </div>
        </div>
      </div>
    )
  }

  const renderKickingStats = (stats: PlayerStatsType['stats']['kicking']) => {
    if (!stats) return null
    return (
      <div className="bg-gray-800/50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-3">Kicking</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-gray-400">Field Goals</div>
            <div className="text-white font-medium">{stats.fieldGoals}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400">Field Goal Attempts</div>
            <div className="text-white font-medium">{stats.fieldGoalAttempts}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400">Extra Points</div>
            <div className="text-white font-medium">{stats.extraPoints}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400">Extra Point Attempts</div>
            <div className="text-white font-medium">{stats.extraPointAttempts}</div>
          </div>
          <div className="text-center md:col-span-2">
            <div className="text-gray-400">Field Goal %</div>
            <div className="text-white font-medium">
              {stats.fieldGoalAttempts > 0 ? ((stats.fieldGoals / stats.fieldGoalAttempts) * 100).toFixed(1) : '0.0'}%
            </div>
          </div>
          <div className="text-center md:col-span-2">
            <div className="text-gray-400">Extra Point %</div>
            <div className="text-white font-medium">
              {stats.extraPointAttempts > 0 ? ((stats.extraPoints / stats.extraPointAttempts) * 100).toFixed(1) : '0.0'}%
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-900/50 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-neon-green mb-4">
          {playerStats.playerName}
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-gray-400 text-sm">Position</div>
            <div className="text-white font-medium">{playerStats.position}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400 text-sm">Team</div>
            <div className="flex justify-center">
              <TeamBadge 
                teamName={playerStats.teamName}
                size="md"
                variant="logo"
                showAbbr={true}
              />
            </div>
          </div>
          <div className="text-center">
            <div className="text-gray-400 text-sm">Season</div>
            <div className="text-white font-medium">{playerStats.season}</div>
          </div>
          {playerStats.week && (
            <div className="text-center">
              <div className="text-gray-400 text-sm">Week</div>
              <div className="text-white font-medium">{playerStats.week}</div>
            </div>
          )}
        </div>

        {/* Stats Sections */}
        <div className="space-y-4">
          {renderPassingStats(playerStats.stats.passing)}
          {renderRushingStats(playerStats.stats.rushing)}
          {renderReceivingStats(playerStats.stats.receiving)}
          {renderDefenseStats(playerStats.stats.defense)}
          {renderKickingStats(playerStats.stats.kicking)}
        </div>

        {/* Summary Stats */}
        <div className="bg-gray-800/50 rounded-lg p-4 mt-6">
          <h3 className="text-lg font-semibold text-white mb-3">Season Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {playerStats.stats.passing && (
              <>
                <div className="text-center">
                  <div className="text-gray-400">Pass Yards</div>
                  <div className="text-white font-medium">{playerStats.stats.passing.yards.toLocaleString()}</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-400">Pass TDs</div>
                  <div className="text-green-400 font-medium">{playerStats.stats.passing.touchdowns}</div>
                </div>
              </>
            )}
            {playerStats.stats.rushing && (
              <>
                <div className="text-center">
                  <div className="text-gray-400">Rush Yards</div>
                  <div className="text-white font-medium">{playerStats.stats.rushing.yards.toLocaleString()}</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-400">Rush TDs</div>
                  <div className="text-green-400 font-medium">{playerStats.stats.rushing.touchdowns}</div>
                </div>
              </>
            )}
            {playerStats.stats.receiving && (
              <>
                <div className="text-center">
                  <div className="text-gray-400">Rec Yards</div>
                  <div className="text-white font-medium">{playerStats.stats.receiving.yards.toLocaleString()}</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-400">Rec TDs</div>
                  <div className="text-green-400 font-medium">{playerStats.stats.receiving.touchdowns}</div>
                </div>
              </>
            )}
            {playerStats.stats.defense && (
              <>
                <div className="text-center">
                  <div className="text-gray-400">Tackles</div>
                  <div className="text-white font-medium">{playerStats.stats.defense.tackles}</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-400">Sacks</div>
                  <div className="text-green-400 font-medium">{playerStats.stats.defense.sacks}</div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 