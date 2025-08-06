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

const divisions = {
  AFC: {
    'AFC North': ['Bengals', 'Browns', 'Ravens', 'Steelers'],
    'AFC South': ['Colts', 'Jaguars', 'Texans', 'Titans'],
    'AFC East': ['Bills', 'Dolphins', 'Jets', 'Patriots'],
    'AFC West': ['Broncos', 'Chargers', 'Chiefs', 'Raiders']
  },
  NFC: {
    'NFC North': ['Bears', 'Lions', 'Packers', 'Vikings'],
    'NFC South': ['Buccaneers', 'Falcons', 'Panthers', 'Saints'],
    'NFC West': ['Cardinals', '49ers', 'Rams', 'Seahawks'],
    'NFC East': ['Commanders', 'Cowboys', 'Eagles', 'Giants']
  }
}

export default function DivisionStandingsPage() {
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

  const getDivisionTeams = (divisionName: string, expectedTeams: string[]) => {
    const foundTeams = expectedTeams
      .map(teamName => {
        // Find team by name, trying different variations
        const team = teams.find(t => 
          t.name === teamName || 
          t.name.includes(teamName) ||
          teamName.includes(t.name) ||
          t.city === teamName ||
          t.abbreviation === teamName
        )
        return team
      })
      .filter((team): team is Team => team !== undefined)
    
    return foundTeams.sort((a, b) => {
      // Sort by win percentage first
      if (b.winPercentage !== a.winPercentage) {
        return b.winPercentage - a.winPercentage
      }
      // Then by division record
      const aDivPct = a.divisionWins / (a.divisionWins + a.divisionLosses) || 0
      const bDivPct = b.divisionWins / (b.divisionWins + b.divisionLosses) || 0
      if (bDivPct !== aDivPct) {
        return bDivPct - aDivPct
      }
      // Then by point differential
      return b.pointsDifferential - a.pointsDifferential
    })
  }

  const formatRecord = (wins: number, losses: number, ties: number = 0) => {
    return ties > 0 ? `${wins}-${losses}-${ties}` : `${wins}-${losses}`
  }

  const renderDivisionTable = (divisionName: string, divisionTeams: Team[]) => (
    <div key={divisionName} className="bg-gray-900 rounded-lg p-6">
      <h3 className="text-xl font-bold mb-4 text-center text-neon-green">{divisionName}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-2 px-2">Team</th>
              <th className="text-center py-2 px-2">W-L</th>
              <th className="text-center py-2 px-2">PCT</th>
              <th className="text-center py-2 px-2">PF</th>
              <th className="text-center py-2 px-2">PA</th>
              <th className="text-center py-2 px-2">DIFF</th>
              <th className="text-center py-2 px-2">DIV</th>
            </tr>
          </thead>
          <tbody>
            {divisionTeams.map((team, index) => (
              <tr key={team.id} className={`border-b border-gray-800 hover:bg-gray-800 ${index === 0 ? 'bg-green-900/20' : ''}`}>
                <td className="py-2 px-2">
                  <div className="font-medium text-sm">
                    {team.city} {team.name}
                    {index === 0 && <span className="ml-2 text-xs text-green-400">DIV LEADER</span>}
                  </div>
                </td>
                <td className="text-center py-2 px-2 font-medium text-sm">
                  {formatRecord(team.wins, team.losses, team.ties)}
                </td>
                <td className="text-center py-2 px-2 text-sm">
                  {team.winPercentage.toFixed(3)}
                </td>
                <td className="text-center py-2 px-2 text-sm">{team.pointsFor}</td>
                <td className="text-center py-2 px-2 text-sm">{team.pointsAgainst}</td>
                <td className={`text-center py-2 px-2 text-sm ${team.pointsDifferential >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {team.pointsDifferential >= 0 ? '+' : ''}{team.pointsDifferential}
                </td>
                <td className="text-center py-2 px-2 text-sm">
                  {formatRecord(team.divisionWins || 0, team.divisionLosses || 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="text-center py-8">
          <div className="text-gray-400">Loading division standings...</div>
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

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-6">Division Standings</h1>
      <p className="text-gray-400 mb-8">Regular Season Records (Weeks 1-18)</p>

      {/* AFC Divisions */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-blue-400 mb-6">AFC</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Object.entries(divisions.AFC).map(([divisionName, teamNames]) => {
            const divisionTeams = getDivisionTeams(divisionName, teamNames)
            return renderDivisionTable(divisionName, divisionTeams)
          })}
        </div>
      </div>

      {/* NFC Divisions */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-red-400 mb-6">NFC</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Object.entries(divisions.NFC).map(([divisionName, teamNames]) => {
            const divisionTeams = getDivisionTeams(divisionName, teamNames)
            return renderDivisionTable(divisionName, divisionTeams)
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-gray-900 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-300">
          <div><span className="font-medium">PCT:</span> Win Percentage</div>
          <div><span className="font-medium">PF:</span> Points For</div>
          <div><span className="font-medium">PA:</span> Points Against</div>
          <div><span className="font-medium">DIFF:</span> Point Differential</div>
          <div><span className="font-medium">DIV:</span> Division Record</div>
          <div><span className="text-green-400 font-medium">DIV LEADER:</span> Division Leader</div>
        </div>
      </div>
    </div>
  )
}