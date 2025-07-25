'use client'

import { useEffect, useState } from 'react'
import { analyticsApi, formatRecord } from '@/lib/analytics'
import { TeamStats as TeamStatsType } from '@/types/analytics'

interface TeamStatsProps {
  leagueId: string | number
  teamId: string | number
}

export default function TeamStats({ leagueId, teamId }: TeamStatsProps) {
  const [teamStats, setTeamStats] = useState<TeamStatsType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTeamStats = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await analyticsApi.getTeamStats(leagueId, teamId)
        setTeamStats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch team stats')
        console.error('Error fetching team stats:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchTeamStats()
  }, [leagueId, teamId])

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-green"></div>
        <span className="ml-2 text-white">Loading team stats...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
        <h3 className="text-red-400 font-semibold mb-2">Error Loading Team Stats</h3>
        <p className="text-red-300">{error}</p>
      </div>
    )
  }

  if (!teamStats) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-400">No team stats available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-900/50 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-neon-green mb-4">
          {teamStats.city} {teamStats.teamName}
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-gray-400 text-sm">Conference</div>
            <div className="text-white font-medium">{teamStats.conference}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400 text-sm">Division</div>
            <div className="text-white font-medium">{teamStats.division}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400 text-sm">Roster Size</div>
            <div className="text-white font-medium">{teamStats.rosterSize}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400 text-sm">Record</div>
            <div className="text-white font-medium">
              {formatRecord(teamStats.record.wins, teamStats.record.losses, teamStats.record.ties)}
            </div>
          </div>
        </div>

        {/* Offense Stats */}
        <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
          <h3 className="text-lg font-semibold text-white mb-3">Offense</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div className="text-center">
              <div className="text-gray-400">Total Yards</div>
              <div className="text-white font-medium">{teamStats.offense.totalYards.toLocaleString()}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400">Passing Yards</div>
              <div className="text-white font-medium">{teamStats.offense.passingYards.toLocaleString()}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400">Rushing Yards</div>
              <div className="text-white font-medium">{teamStats.offense.rushingYards.toLocaleString()}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400">Points Scored</div>
              <div className="text-white font-medium">{teamStats.offense.pointsScored}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400">Turnovers</div>
              <div className="text-red-400 font-medium">{teamStats.offense.turnovers}</div>
            </div>
          </div>
        </div>

        {/* Defense Stats */}
        <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
          <h3 className="text-lg font-semibold text-white mb-3">Defense</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div className="text-center">
              <div className="text-gray-400">Yards Allowed</div>
              <div className="text-white font-medium">{teamStats.defense.totalYardsAllowed.toLocaleString()}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400">Pass Yards Allowed</div>
              <div className="text-white font-medium">{teamStats.defense.passingYardsAllowed.toLocaleString()}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400">Rush Yards Allowed</div>
              <div className="text-white font-medium">{teamStats.defense.rushingYardsAllowed.toLocaleString()}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400">Points Allowed</div>
              <div className="text-white font-medium">{teamStats.defense.pointsAllowed}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400">Turnovers Forced</div>
              <div className="text-green-400 font-medium">{teamStats.defense.turnoversForced}</div>
            </div>
          </div>
        </div>

        {/* Team Performance Metrics */}
        <div className="bg-gray-800/50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-3">Performance Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-gray-400">Win Percentage</div>
              <div className="text-white font-medium">
                {(teamStats.record.winPercentage * 100).toFixed(1)}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-400">Points Per Game</div>
              <div className="text-white font-medium">
                {teamStats.offense.pointsScored > 0 ? (teamStats.offense.pointsScored / (teamStats.record.wins + teamStats.record.losses + teamStats.record.ties)).toFixed(1) : '0.0'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-400">Points Allowed Per Game</div>
              <div className="text-white font-medium">
                {teamStats.defense.pointsAllowed > 0 ? (teamStats.defense.pointsAllowed / (teamStats.record.wins + teamStats.record.losses + teamStats.record.ties)).toFixed(1) : '0.0'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-400">Point Differential</div>
              <div className={`font-medium ${
                teamStats.offense.pointsScored - teamStats.defense.pointsAllowed > 0 ? 'text-green-400' : 
                teamStats.offense.pointsScored - teamStats.defense.pointsAllowed < 0 ? 'text-red-400' : 'text-gray-400'
              }`}>
                {teamStats.offense.pointsScored - teamStats.defense.pointsAllowed > 0 ? '+' : ''}
                {teamStats.offense.pointsScored - teamStats.defense.pointsAllowed}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Roster Section */}
      {teamStats.players && teamStats.players.length > 0 && (
        <div className="bg-gray-900/50 rounded-lg p-6">
          <h3 className="text-xl font-bold text-neon-green mb-4">Roster</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-2 px-2 text-gray-400">Player</th>
                  <th className="text-left py-2 px-2 text-gray-400">Position</th>
                  <th className="text-center py-2 px-2 text-gray-400">Stats</th>
                </tr>
              </thead>
              <tbody>
                {teamStats.players.map((player) => (
                  <tr key={player.playerId} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                    <td className="py-2 px-2 text-white font-medium">{player.playerName}</td>
                    <td className="py-2 px-2 text-gray-300">{player.position}</td>
                    <td className="py-2 px-2 text-gray-300">
                      {player.stats.passing && (
                        <div className="text-xs">
                          Pass: {player.stats.passing.yards}yds, {player.stats.passing.touchdowns}TD
                        </div>
                      )}
                      {player.stats.rushing && (
                        <div className="text-xs">
                          Rush: {player.stats.rushing.yards}yds, {player.stats.rushing.touchdowns}TD
                        </div>
                      )}
                      {player.stats.receiving && (
                        <div className="text-xs">
                          Rec: {player.stats.receiving.receptions}rec, {player.stats.receiving.yards}yds
                        </div>
                      )}
                      {player.stats.defense && (
                        <div className="text-xs">
                          Def: {player.stats.defense.tackles}tkl, {player.stats.defense.sacks}sack
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
} 