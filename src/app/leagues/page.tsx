'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ProtectedRoute from '../../components/ProtectedRoute'
import { fetchFromApi } from '@/lib/api'

type Team = {
  id: number
  name: string
  city: string
  wins: number
  losses: number
}

type League = {
  leagueId: string
  name: string
  seasonYear: number
  week: number
}

type LeaguesResponse = {
  leagues: League[]
}

type TeamsResponse = {
  teams: Team[]
}

export default function LeaguesPage() {
  const [leagues, setLeagues] = useState<League[]>([])
  const [expandedLeagueId, setExpandedLeagueId] = useState<string | null>(null)
  const [teamsByLeague, setTeamsByLeague] = useState<Record<string, Team[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchFromApi('/leagues')
      .then((data) => {
        const leaguesData = (data as LeaguesResponse).leagues || []
        console.log('Fetched leagues data:', leaguesData)
        console.log('League IDs:', leaguesData.map(l => l.leagueId))
        setLeagues(leaguesData)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setError('Failed to load leagues.')
        setLoading(false)
      })
  }, [])

  // Debug log to check leagueId presence
  console.log('leagues:', leagues);

  const toggleTeams = async (leagueId: string) => {
    if (expandedLeagueId === leagueId) {
      setExpandedLeagueId(null)
      return
    }

    if (!teamsByLeague[leagueId]) {
      try {
        const res = await fetchFromApi(`/leagues/${leagueId}/teams`)
        setTeamsByLeague(prev => ({ ...prev, [leagueId]: (res as TeamsResponse).teams || [] }))
      } catch (err) {
        console.error(`Failed to fetch teams for league ${leagueId}`, err)
      }
    }

    setExpandedLeagueId(leagueId)
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-black text-white px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-neon-green">Franchise Leagues</h1>

          <div className="my-8 p-4 bg-gray-800 rounded-md">
            <h2 className="text-lg font-semibold mb-2 text-white">Upload League JSON</h2>
            <form
              action={`${process.env.NEXT_PUBLIC_API_BASE}/upload`}
              method="post"
              encType="multipart/form-data"
            >
              <input
                type="file"
                name="file"
                accept=".json"
                className="text-white block mb-2"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-neon-green text-black rounded hover:bg-green-400"
              >
                Upload JSON
              </button>
            </form>
          </div>

          {loading ? (
            <p className="text-gray-400">Loading leagues...</p>
          ) : error ? (
            <p className="text-red-400">{error}</p>
          ) : leagues.length === 0 ? (
            <p className="text-gray-400 italic">No leagues uploaded yet.</p>
          ) : (
            leagues.map((league) => (
              <div
                key={league.leagueId}
                className="p-4 mb-4 rounded border border-gray-700 bg-gray-900 transition-all duration-200 hover:shadow-[0_0_8px_2px_#39FF14]"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h2
                      className="text-lg sm:text-xl font-semibold hover:underline cursor-pointer"
                      onClick={() => toggleTeams(league.leagueId)}
                    >
                      {league.name || 'Untitled League'}
                    </h2>
                    <p className="text-sm text-gray-400 italic">
                      Season {league.seasonYear ?? '?'} — Week {league.week ?? '?'}
                    </p>
                  </div>
                  <Link
                    href={`/leagues/${league.leagueId}`}
                    className="text-sm text-neon-green underline hover:text-green-400"
                  >
                    View Details
                  </Link>
                </div>

                {expandedLeagueId === league.leagueId && (
                  <div className="mt-3">
                    {teamsByLeague[league.leagueId]?.length > 0 ? (
                      <ul className="text-sm text-gray-300 list-disc pl-5 space-y-1">
                        {teamsByLeague[league.leagueId].map(team => (
                          <li key={team.id}>
                            <Link 
                              href={`/leagues/${league.leagueId}/teams/${team.id}`}
                              className="hover:text-neon-green transition-colors"
                            >
                              <span className="text-neon-green font-medium">{team.city}</span> {team.name} — {team.wins}-{team.losses}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 italic text-sm">No teams available.</p>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>
    </ProtectedRoute>
  )
}
