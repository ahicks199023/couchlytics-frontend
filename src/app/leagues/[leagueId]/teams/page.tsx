'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'


type Team = {
  id: number
  name: string
  city: string
  wins: number
  losses: number
  leagueId: number
}

export default function TeamsPage() {
  const { leagueId } = useParams()
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!leagueId) return

    const fetchTeams = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/leagues/${leagueId}/teams`, {
          credentials: 'include'
        })

        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Failed to fetch teams')
        }

        const data = await res.json()
        setTeams(data.teams || [])
      } catch (err: unknown) {
        console.error('Fetch error:', err)
        setError((err as Error).message || 'Server error')
      } finally {
        setLoading(false)
      }
    }

    fetchTeams()
  }, [leagueId])

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-black text-white px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-neon-green">Teams in League {leagueId}</h1>

          {loading ? (
            <p className="text-gray-400">Loading teams...</p>
          ) : error ? (
            <p className="text-red-400">Error: {error}</p>
          ) : teams.length === 0 ? (
            <p className="text-gray-400 italic">No teams found for this league.</p>
          ) : (
            teams.map((team) => (
              <div
                key={team.id}
                className="p-4 mb-4 rounded border border-gray-700 bg-gray-900 text-white transition-all duration-200 hover:shadow-[0_0_6px_2px_#39FF14]"
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-neon-green">
                    {team.city} {team.name}
                  </h2>
                  <span className="text-sm text-gray-400">
                    Record: {team.wins}-{team.losses}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </ProtectedRoute>
  )
}
