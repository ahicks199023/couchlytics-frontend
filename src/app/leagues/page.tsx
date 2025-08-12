'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ProtectedRoute from '../../components/ProtectedRoute'
import { fetchFromApi } from '@/lib/api'
import { http } from '@/lib/http'

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
  const [leaderboard, setLeaderboard] = useState<Array<{
    rank: number
    user: string
    wins: number
    losses: number
    streakType: 'W' | 'L' | ''
    streakCount: number
    winPct: number
  }>>([])
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null)

  useEffect(() => {
    fetchFromApi('/leagues')
      .then((data) => {
        const leaguesData = (data as LeaguesResponse).leagues || []
        console.log('Fetched leagues data:', leaguesData)
        console.log('League IDs:', leaguesData.map(l => l.leagueId))
        console.log('Full league objects:', JSON.stringify(leaguesData, null, 2))
        setLeagues(leaguesData)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setError('Failed to load leagues.')
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await http.get('/leaderboard/top-users', { params: { limit: 100 } })
        type RawUser = {
          display_name?: string
          username?: string
          email?: string
          wins?: number
          losses?: number
          streak_type?: 'W' | 'L' | string
          streak_count?: number
          win_pct?: number
        }
        const rows: RawUser[] = Array.isArray(res.data?.users) ? res.data.users as RawUser[] : []
        setLeaderboard(rows.map((u: RawUser, i: number) => ({
          rank: i + 1,
          user: String(u.display_name || u.username || u.email || 'User'),
          wins: Number(u.wins ?? 0),
          losses: Number(u.losses ?? 0),
          streakType: ((u.streak_type === 'W' || u.streak_type === 'L') ? u.streak_type : ''),
          streakCount: Number(u.streak_count ?? 0),
          winPct: Number(u.win_pct ?? ((u.wins || 0) / Math.max((u.wins || 0) + (u.losses || 0), 1)))
        })))
      } catch (e) {
        console.warn('Leaderboard unavailable:', e)
        setLeaderboardError('Leaderboard unavailable')
      }
    }
    load()
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
        <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar */}
          <aside className="lg:col-span-3 bg-gray-900 border border-gray-800 rounded-lg h-max sticky top-6 p-4">
            <h2 className="text-lg font-semibold text-neon-green mb-4">Navigation</h2>
            <nav className="space-y-1">
              <Link href="/leagues" className="block px-3 py-2 rounded hover:bg-gray-800">Couchlytics Central</Link>
              <Link href="/chat" className="block px-3 py-2 rounded hover:bg-gray-800">Lounge</Link>
              <Link href="/dashboard" className="block px-3 py-2 rounded hover:bg-gray-800">Dashboard</Link>
              <Link href="/analytics-engine" className="block px-3 py-2 rounded hover:bg-gray-800">Analytics</Link>
              <Link href="/upload" className="block px-3 py-2 rounded hover:bg-gray-800">Upload</Link>
            </nav>
          </aside>

          {/* Main content */}
          <div className="lg:col-span-9 space-y-8">
            <h1 className="text-3xl font-bold text-neon-green">Couchlytics Central</h1>

            {/* Leaderboard */}
            <section className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-semibold">Top 100 Leaderboard</h2>
                <span className="text-xs text-gray-400">Wins • Losses • Streak • Win %</span>
              </div>
              {leaderboard.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-gray-400 border-b border-gray-800">
                        <th className="text-left py-2 pr-4">#</th>
                        <th className="text-left py-2 pr-4">User</th>
                        <th className="text-right py-2 pr-4">W</th>
                        <th className="text-right py-2 pr-4">L</th>
                        <th className="text-right py-2 pr-4">Streak</th>
                        <th className="text-right py-2">Win %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map(row => (
                        <tr key={row.rank} className="border-b border-gray-800 hover:bg-gray-800/60">
                          <td className="py-2 pr-4">{row.rank}</td>
                          <td className="py-2 pr-4">{row.user}</td>
                          <td className="py-2 pr-4 text-right text-green-400">{row.wins}</td>
                          <td className="py-2 pr-4 text-right text-red-400">{row.losses}</td>
                          <td className="py-2 pr-4 text-right">{row.streakType}{row.streakCount}</td>
                          <td className="py-2 text-right">{(row.winPct * 100).toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-400 text-sm">{leaderboardError ?? 'Leaderboard loading…'}</p>
              )}
            </section>

            {/* Upload League JSON */}
            <div className="p-4 bg-gray-900 border border-gray-800 rounded-md">
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

            {/* Leagues list */}
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
                  className="p-4 mb-4 rounded border border-gray-800 bg-gray-900 transition-all duration-200 hover:shadow-[0_0_8px_2px_#39FF14]"
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
                      href={`/leagues/${league.leagueId || 'unknown'}`}
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

            {/* Ozzie AI Promo */}
            <section className="bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-2">Meet Ozzie AI</h2>
              <p className="text-gray-300 mb-4">Your always‑on league strategist. Ask about trades, draft value, matchups, and scouting. Ozzie reads your league data and gives actionable answers in seconds.</p>
              <div className="flex items-center gap-3">
                <Link href="/chat" className="bg-neon-green text-black font-semibold px-5 py-2 rounded hover:bg-green-400">Open Lounge</Link>
                <Link href="/analytics-engine" className="px-5 py-2 rounded border border-gray-600 hover:bg-gray-800">Explore Analytics</Link>
              </div>
            </section>

          </div>
        </div>
      </main>
    </ProtectedRoute>
  )
}
