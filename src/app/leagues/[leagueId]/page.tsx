'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { LeagueStatLeaders } from '@/components/LeagueStatLeaders'
import { fetchFromApi } from '@/lib/api'

type LeagueData = {
  league: {
    leagueId: string
    name: string
    seasonYear: number
  }
  teams: {
    id: number
    name: string
    user: string
  }[]
  players: {
    name: string
  }[]
  games: {
    homeTeam: string
    awayTeam: string
  }[]
}

export default function LeagueDetailPage() {
  const { leagueId } = useParams()
  const [league, setLeague] = useState<LeagueData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!leagueId) return

    fetchFromApi(`/leagues/${leagueId}`)
      .then(data => {
        setLeague(data as LeagueData)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch league data:', err)
        setError('League not found or access denied.')
        setLoading(false)
      })
  }, [leagueId])

  if (loading) return <main className="p-6 text-white">Loading league details...</main>
  if (error || !league) return <main className="p-6 text-red-400">{error || 'No data found.'}</main>

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-2">{league.league.name}</h1>
      <p className="text-gray-400 mb-1">Season Year: {league.league.seasonYear}</p>

      <Link
        href={`/leagues/${league.league.leagueId}/analytics`}
        className="inline-block mt-2 text-sm text-blue-400 hover:underline"
      >
        View Analytics →
      </Link>

      <section className="mt-8 mb-8">
        <h2 className="text-2xl font-semibold mb-2">Teams</h2>
        {league.teams?.length > 0 ? (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {league.teams
              .filter(team => team.name && team.name !== 'Unknown')
              .map((team) => (
                <li key={team.id} className="bg-gray-800 p-3 rounded">
                  <strong>{team.name}</strong>
                  <div className="text-sm text-gray-400">User: {team.user}</div>
                </li>
              ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm italic">No teams available.</p>
        )}
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">Recent Games</h2>
        {league.games?.length > 0 ? (
          <ul className="space-y-2">
            {league.games.map((game, i) => (
              <li key={`${game.homeTeam}-${game.awayTeam}-${i}`} className="bg-gray-800 p-3 rounded">
                {game.homeTeam} vs {game.awayTeam}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm italic">No games recorded yet.</p>
        )}
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">League Stat Leaders</h2>
        <LeagueStatLeaders leagueId={league.league.leagueId} />
      </section>
    </main>
  )
}
