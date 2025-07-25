'use client'

import { useEffect, useState } from 'react'
import { analyticsApi, getTeamRankingColor } from '@/lib/analytics'
import { LeagueStandings as LeagueStandingsType } from '@/types/analytics'

interface LeagueStandingsProps {
  leagueId: string | number
}

export default function LeagueStandings({ leagueId }: LeagueStandingsProps) {
  const [standings, setStandings] = useState<LeagueStandingsType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStandings = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await analyticsApi.getLeagueStandings(leagueId)
        setStandings(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch standings')
        console.error('Error fetching standings:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStandings()
  }, [leagueId])

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-green"></div>
        <span className="ml-2 text-white">Loading standings...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
        <h3 className="text-red-400 font-semibold mb-2">Error Loading Standings</h3>
        <p className="text-red-300">{error}</p>
      </div>
    )
  }

  if (!standings) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-400">No standings data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-neon-green mb-4">League Standings</h2>
      
      {standings.conferences.map((conference) => (
        <div key={conference.conferenceId} className="bg-gray-900/50 rounded-lg p-4">
          <h3 className="text-xl font-semibold text-white mb-4">
            {conference.conferenceName}
          </h3>
          
          <div className="grid gap-6 md:grid-cols-2">
            {conference.divisions.map((division) => (
              <div key={division.divisionId} className="bg-gray-800/50 rounded-lg p-4">
                <h4 className="text-lg font-medium text-gray-300 mb-3">
                  {division.divisionName}
                </h4>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-2 px-1 text-gray-400">Rank</th>
                        <th className="text-left py-2 px-1 text-gray-400">Team</th>
                        <th className="text-center py-2 px-1 text-gray-400">W</th>
                        <th className="text-center py-2 px-1 text-gray-400">L</th>
                        <th className="text-center py-2 px-1 text-gray-400">T</th>
                        <th className="text-center py-2 px-1 text-gray-400">PCT</th>
                        <th className="text-center py-2 px-1 text-gray-400">PF</th>
                        <th className="text-center py-2 px-1 text-gray-400">PA</th>
                        <th className="text-center py-2 px-1 text-gray-400">DIFF</th>
                      </tr>
                    </thead>
                    <tbody>
                      {division.teams.map((team) => (
                        <tr 
                          key={team.teamId} 
                          className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors"
                        >
                          <td className={`py-2 px-1 font-medium ${getTeamRankingColor(team.divisionRank)}`}>
                            {team.divisionRank}
                          </td>
                          <td className="py-2 px-1 text-white">
                            <div>
                              <div className="font-medium">{team.city} {team.teamName}</div>
                              <div className="text-xs text-gray-400">
                                Conf: {team.conferenceRank} | Overall: {team.overallRank}
                              </div>
                            </div>
                          </td>
                          <td className="text-center py-2 px-1 text-white">{team.wins}</td>
                          <td className="text-center py-2 px-1 text-white">{team.losses}</td>
                          <td className="text-center py-2 px-1 text-white">{team.ties}</td>
                          <td className="text-center py-2 px-1 text-white">
                            {team.winPercentage.toFixed(3)}
                          </td>
                          <td className="text-center py-2 px-1 text-white">{team.pointsScored}</td>
                          <td className="text-center py-2 px-1 text-white">{team.pointsAllowed}</td>
                          <td className={`text-center py-2 px-1 font-medium ${
                            team.pointDifferential > 0 ? 'text-green-400' : 
                            team.pointDifferential < 0 ? 'text-red-400' : 'text-gray-400'
                          }`}>
                            {team.pointDifferential > 0 ? '+' : ''}{team.pointDifferential}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      
      {/* Overall League Summary */}
      <div className="bg-gray-900/50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-3">League Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-gray-400">Total Teams</div>
            <div className="text-white font-medium">
              {standings.conferences.reduce((acc, conf) => 
                acc + conf.divisions.reduce((divAcc, div) => divAcc + div.teams.length, 0), 0
              )}
            </div>
          </div>
          <div className="text-center">
            <div className="text-gray-400">Conferences</div>
            <div className="text-white font-medium">{standings.conferences.length}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400">Divisions</div>
            <div className="text-white font-medium">
              {standings.conferences.reduce((acc, conf) => acc + conf.divisions.length, 0)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-gray-400">Season</div>
            <div className="text-white font-medium">{standings.season}</div>
          </div>
        </div>
      </div>
    </div>
  )
} 