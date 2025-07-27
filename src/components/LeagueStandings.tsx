'use client'

import { useEffect, useState } from 'react'
import { analyticsApi, getTeamRankingColor } from '@/lib/analytics'
import { LeagueStandings as LeagueStandingsType } from '@/types/analytics'

interface LeagueStandingsProps {
  leagueId: string | number
}

// Interface for the actual API response structure
interface ApiStandingsResponse {
  conferences: Array<{
    id: string
    name: string
    teams: Array<{
      teamId: number
      teamName: string
      city: string
      wins: number
      losses: number
      ties: number
      winPercentage: number
      pointsScored: number
      pointsAllowed: number
      pointDifferential: number
      conferenceRank: number
      divisionRank: number
      overallRank: number
      division?: string
    }>
  }>
  divisions?: Array<{
    id: string
    name: string
    teams: Array<unknown>
  }>
  season?: number
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
        const data = await analyticsApi.getLeagueStandings(leagueId) as unknown as ApiStandingsResponse
        console.log('Standings API Response:', data) // Debug log
        
        // Transform the flat API response to the expected nested structure
        if (data && data.conferences) {
          const transformedStandings: LeagueStandingsType = {
            leagueId: Number(leagueId),
            season: data.season || 2024,
            conferences: data.conferences.map((conf, confIndex) => ({
              conferenceId: confIndex + 1,
              conferenceName: conf.name,
              divisions: [
                {
                  divisionId: confIndex + 1,
                  divisionName: `${conf.name} Division`,
                  teams: conf.teams.map((team, teamIndex) => ({
                    teamId: team.teamId,
                    teamName: team.teamName,
                    city: team.city,
                    wins: team.wins || 0,
                    losses: team.losses || 0,
                    ties: team.ties || 0,
                    winPercentage: team.winPercentage || 0,
                    pointsScored: team.pointsScored || 0,
                    pointsAllowed: team.pointsAllowed || 0,
                    pointDifferential: team.pointDifferential || 0,
                    conferenceRank: team.conferenceRank || teamIndex + 1,
                    divisionRank: team.divisionRank || teamIndex + 1,
                    overallRank: team.overallRank || teamIndex + 1,
                  }))
                }
              ]
            }))
          }
          
          console.log('Transformed Standings:', transformedStandings)
          setStandings(transformedStandings)
        } else {
          console.warn('Invalid API response structure:', data)
          setError('Invalid standings data structure received from API')
        }
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

  // Defensive checks for data structure
  if (!standings.conferences || !Array.isArray(standings.conferences)) {
    console.warn('No conferences array found in standings:', standings)
    return (
      <div className="text-center p-8">
        <p className="text-gray-400">No conference data available</p>
        <p className="text-xs text-gray-500 mt-2">API Response: {JSON.stringify(standings, null, 2)}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-neon-green mb-4">League Standings</h2>
      
      {standings.conferences.map((conference) => {
        // Defensive check for conference structure
        if (!conference || !conference.divisions || !Array.isArray(conference.divisions)) {
          console.warn('Invalid conference structure:', conference)
          return null
        }

        return (
          <div key={conference.conferenceId} className="bg-gray-900/50 rounded-lg p-4">
            <h3 className="text-xl font-semibold text-white mb-4">
              {conference.conferenceName || 'Unknown Conference'}
            </h3>
            
            <div className="grid gap-6 md:grid-cols-2">
              {conference.divisions.map((division) => {
                // Defensive check for division structure
                if (!division || !division.teams || !Array.isArray(division.teams)) {
                  console.warn('Invalid division structure:', division)
                  return null
                }

                return (
                  <div key={division.divisionId} className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-gray-300 mb-3">
                      {division.divisionName || 'Unknown Division'}
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
                          {division.teams.map((team) => {
                            // Defensive check for team structure
                            if (!team) {
                              console.warn('Invalid team structure:', team)
                              return null
                            }

                            return (
                              <tr 
                                key={team.teamId} 
                                className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors"
                              >
                                <td className={`py-2 px-1 font-medium ${getTeamRankingColor(team.divisionRank)}`}>
                                  {team.divisionRank || '-'}
                                </td>
                                <td className="py-2 px-1 text-white">
                                  <div>
                                    <div className="font-medium">{team.city || ''} {team.teamName || 'Unknown Team'}</div>
                                    <div className="text-xs text-gray-400">
                                      Conf: {team.conferenceRank || '-'} | Overall: {team.overallRank || '-'}
                                    </div>
                                  </div>
                                </td>
                                <td className="text-center py-2 px-1 text-white">{team.wins || 0}</td>
                                <td className="text-center py-2 px-1 text-white">{team.losses || 0}</td>
                                <td className="text-center py-2 px-1 text-white">{team.ties || 0}</td>
                                <td className="text-center py-2 px-1 text-white">
                                  {team.winPercentage ? team.winPercentage.toFixed(3) : '0.000'}
                                </td>
                                <td className="text-center py-2 px-1 text-white">{team.pointsScored || 0}</td>
                                <td className="text-center py-2 px-1 text-white">{team.pointsAllowed || 0}</td>
                                <td className={`text-center py-2 px-1 font-medium ${
                                  (team.pointDifferential || 0) > 0 ? 'text-green-400' : 
                                  (team.pointDifferential || 0) < 0 ? 'text-red-400' : 'text-gray-400'
                                }`}>
                                  {(team.pointDifferential || 0) > 0 ? '+' : ''}{team.pointDifferential || 0}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
      
      {/* Overall League Summary */}
      <div className="bg-gray-900/50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-3">League Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-gray-400">Total Teams</div>
            <div className="text-white font-medium">
              {standings.conferences.reduce((acc, conf) => 
                acc + (conf.divisions ? conf.divisions.reduce((divAcc, div) => 
                  divAcc + (div.teams ? div.teams.length : 0), 0) : 0), 0
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
              {standings.conferences.reduce((acc, conf) => 
                acc + (conf.divisions ? conf.divisions.length : 0), 0
              )}
            </div>
          </div>
          <div className="text-center">
            <div className="text-gray-400">Season</div>
            <div className="text-white font-medium">{standings.season || 'N/A'}</div>
          </div>
        </div>
      </div>
    </div>
  )
} 