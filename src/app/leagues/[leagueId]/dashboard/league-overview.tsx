'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface LeagueSummary {
  leagueId: number
  leagueName: string
  seasonYear: number
  teamCount: number
  playerCount: number
  gameCount: number
  email: string
  timestamp: string
}

export default function LeagueOverview() {
  const [leagues, setLeagues] = useState<LeagueSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('http://localhost:5000/leagues/overview', {
      credentials: 'include'
    })
      .then((res) => {
        if (!res.ok) throw new Error('Access denied or failed to load')
        return res.json()
      })
      .then((data) => {
        setLeagues(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) return <p className="text-white p-6">Loading...</p>
  if (error) return <p className="text-red-500 p-6">{error}</p>

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <h1 className="text-2xl font-bold mb-6">League Overview Dashboard</h1>
      <div className="overflow-x-auto">
        <table className="w-full table-auto border border-gray-700">
          <thead>
            <tr className="bg-gray-800 text-left">
              <th className="px-4 py-2">League</th>
              <th className="px-4 py-2">Analytics</th>
              <th className="px-4 py-2">Season</th>
              <th className="px-4 py-2">Teams</th>
              <th className="px-4 py-2">Players</th>
              <th className="px-4 py-2">Games</th>
              <th className="px-4 py-2">Uploaded By</th>
              <th className="px-4 py-2">Uploaded At</th>
            </tr>
          </thead>
          <tbody>
            {leagues.map((league) => (
              <tr key={league.leagueId} className="border-t border-gray-700 hover:bg-gray-900">
                <td className="px-4 py-2">
                  <Link href={`/leagues/${league.leagueId}`} className="text-blue-400 hover:underline">
                    {league.leagueName}
                  </Link>
                </td>
                <td className="px-4 py-2">
                  <Link href={`/leagues/${league.leagueId}/analytics`} className="text-sm text-blue-500 underline">
                    View Analytics
                  </Link>
                </td>
                <td className="px-4 py-2">{league.seasonYear}</td>
                <td className="px-4 py-2">{league.teamCount}</td>
                <td className="px-4 py-2">{league.playerCount}</td>
                <td className="px-4 py-2">{league.gameCount}</td>
                <td className="px-4 py-2">{league.email}</td>
                <td className="px-4 py-2">{new Date(league.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
