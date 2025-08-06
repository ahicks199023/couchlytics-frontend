'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { fetchFromApi } from '@/lib/api'

interface Team {
  id: number
  name: string
  city: string
  abbreviation: string
  conference: 'AFC' | 'NFC'
  division: string
  wins: number
  losses: number
  ties: number
  winPercentage: number
  pointsFor: number
  pointsAgainst: number
  pointsDifferential: number
  divisionWins: number
  divisionLosses: number
  conferenceWins: number
  conferenceLosses: number
  homeWins: number
  homeLosses: number
  awayWins: number
  awayLosses: number
  streak: string
}

interface LeagueData {
  teams: Team[]
}

export default function ConferenceStandingsPage() {
  const params = useParams()
  const leagueId = params.leagueId as string
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!leagueId) return

    const fetchStandings = async () => {
      try {
        setLoading(true)
        const data = await fetchFromApi(`/leagues/${leagueId}`) as LeagueData
        
        if (data.teams) {
          // Filter and calculate regular season records (weeks 1-18 only)
          const processedTeams = data.teams.map(team => ({
            ...team,
            // Note: This assumes the API provides regular season records
            // If not, we'll need to calculate from game data
          }))
          setTeams(processedTeams)
        }
      } catch (err) {
        console.error('Failed to load standings:', err)
        setError('Failed to load standings')
      } finally {
        setLoading(false)
      }
    }

    fetchStandings()
  }, [leagueId])

  const getConferenceTeams = (conference: 'AFC' | 'NFC') => {
    return teams
      .filter(team => team.conference === conference)
      .sort((a, b) => {
        // Sort by win percentage first
        if (b.winPercentage !== a.winPercentage) {
          return b.winPercentage - a.winPercentage
        }
        // Then by point differential
        return b.pointsDifferential - a.pointsDifferential
      })
  }

  const formatRecord = (wins: number, losses: number, ties: number = 0) => {
    return ties > 0 ? `${wins}-${losses}-${ties}` : `${wins}-${losses}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="text-center py-8">
          <div className="text-gray-400">Loading standings...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="text-center py-8">
          <div className="text-red-400">{error}</div>
        </div>
      </div>
    )
  }

  const afcTeams = getConferenceTeams('AFC')
  const nfcTeams = getConferenceTeams('NFC')

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-6">Conference Standings</h1>
      <p className="text-gray-400 mb-8">Regular Season Records (Weeks 1-18)</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* AFC Conference */}
        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-blue-400 mb-4 text-center">AFC</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-2 px-3">Team</th>
                  <th className="text-center py-2 px-3">W-L</th>
                  <th className="text-center py-2 px-3">PCT</th>
                  <th className="text-center py-2 px-3">PF</th>
                  <th className="text-center py-2 px-3">PA</th>
                  <th className="text-center py-2 px-3">DIFF</th>
                  <th className="text-center py-2 px-3">DIV</th>
                  <th className="text-center py-2 px-3">CONF</th>
                </tr>
              </thead>
              <tbody>
                {afcTeams.map((team) => (
                  <tr key={team.id} className="border-b border-gray-800 hover:bg-gray-800">
                    <td className="py-2 px-3">
                      <div className="font-medium">{team.city} {team.name}</div>
                      <div className="text-xs text-gray-400">{team.division}</div>
                    </td>
                    <td className="text-center py-2 px-3 font-medium">
                      {formatRecord(team.wins, team.losses, team.ties)}
                    </td>
                    <td className="text-center py-2 px-3">
                      {team.winPercentage.toFixed(3)}
                    </td>
                    <td className="text-center py-2 px-3">{team.pointsFor}</td>
                    <td className="text-center py-2 px-3">{team.pointsAgainst}</td>
                    <td className={`text-center py-2 px-3 ${team.pointsDifferential >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {team.pointsDifferential >= 0 ? '+' : ''}{team.pointsDifferential}
                    </td>
                    <td className="text-center py-2 px-3">
                      {formatRecord(team.divisionWins || 0, team.divisionLosses || 0)}
                    </td>
                    <td className="text-center py-2 px-3">
                      {formatRecord(team.conferenceWins || 0, team.conferenceLosses || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* NFC Conference */}
        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-red-400 mb-4 text-center">NFC</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-2 px-3">Team</th>
                  <th className="text-center py-2 px-3">W-L</th>
                  <th className="text-center py-2 px-3">PCT</th>
                  <th className="text-center py-2 px-3">PF</th>
                  <th className="text-center py-2 px-3">PA</th>
                  <th className="text-center py-2 px-3">DIFF</th>
                  <th className="text-center py-2 px-3">DIV</th>
                  <th className="text-center py-2 px-3">CONF</th>
                </tr>
              </thead>
              <tbody>
                {nfcTeams.map((team) => (
                  <tr key={team.id} className="border-b border-gray-800 hover:bg-gray-800">
                    <td className="py-2 px-3">
                      <div className="font-medium">{team.city} {team.name}</div>
                      <div className="text-xs text-gray-400">{team.division}</div>
                    </td>
                    <td className="text-center py-2 px-3 font-medium">
                      {formatRecord(team.wins, team.losses, team.ties)}
                    </td>
                    <td className="text-center py-2 px-3">
                      {team.winPercentage.toFixed(3)}
                    </td>
                    <td className="text-center py-2 px-3">{team.pointsFor}</td>
                    <td className="text-center py-2 px-3">{team.pointsAgainst}</td>
                    <td className={`text-center py-2 px-3 ${team.pointsDifferential >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {team.pointsDifferential >= 0 ? '+' : ''}{team.pointsDifferential}
                    </td>
                    <td className="text-center py-2 px-3">
                      {formatRecord(team.divisionWins || 0, team.divisionLosses || 0)}
                    </td>
                    <td className="text-center py-2 px-3">
                      {formatRecord(team.conferenceWins || 0, team.conferenceLosses || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-8 bg-gray-900 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-300">
          <div><span className="font-medium">PCT:</span> Win Percentage</div>
          <div><span className="font-medium">PF:</span> Points For</div>
          <div><span className="font-medium">PA:</span> Points Against</div>
          <div><span className="font-medium">DIFF:</span> Point Differential</div>
          <div><span className="font-medium">DIV:</span> Division Record</div>
          <div><span className="font-medium">CONF:</span> Conference Record</div>
        </div>
      </div>
    </div>
  )
}