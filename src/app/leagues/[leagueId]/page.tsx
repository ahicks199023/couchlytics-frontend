'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import LeagueStats from './stats/LeagueStats'
import { LeagueStatLeaders } from '@/components/LeagueStatLeaders'
import { fetchFromApi } from '@/lib/api'

export default function LeagueDetailPage() {
  const { leagueId } = useParams()
  const [league, setLeague] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!leagueId) return

    fetchFromApi(`/leagues/${leagueId}`)
      .then(data => {
        setLeague(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch league data:', err)
        setError('League not found or access denied.')
        setLoading(false)
      })
  }, [leagueId])

  if (loading) {
    return <main className="p-6 text-white">Loading league details...</main>
  }

  if (error) {
    return <main className="p-6 text-red-400">{error}</main>
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-2">{league.league.name}</h1>
      <p className="text-gray-400 mb-1">Season Year: {league.league.seasonYear}</p>

      <Link
        href={`/leagues/${league.league.id}/analytics`}
        className="inline-block mt-2 text-sm text-blue-400 hover:underline"
      >
        View Analytics →
      </Link>

      <section className="mt-8 mb-8">
        <h2 className="text-2xl font-semibold mb-2">Teams</h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {league.teams.map((team: any) => (
            <li key={team.id} className="bg-gray-800 p-3 rounded">
              <strong>{team.name}</strong>
              <div className="text-sm text-gray-400">User: {team.user}</div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">Players</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-sm">
          {league.players.map((player: any, i: number) => (
            <div key={i} className="bg-gray-900 px-2 py-1 rounded">{player.name}</div>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">Recent Games</h2>
        <ul className="space-y-2">
          {league.games.map((game: any, i: number) => (
            <li key={i} className="bg-gray-800 p-3 rounded">
              {game.homeTeam} vs {game.awayTeam}
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">League Stat Leaders</h2>
        <LeagueStatLeaders leagueId={parseInt(leagueId as string)} />
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-2">League Stats</h2>
        <LeagueStats leagueId={parseInt(leagueId as string)} />
      </section>
    </main>
  )
}

