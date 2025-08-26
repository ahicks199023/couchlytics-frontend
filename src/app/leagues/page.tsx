'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ProtectedRoute from '../../components/ProtectedRoute'
import { fetchUserLeagues, fetchLeaderboard, checkDeveloperAccess } from '@/lib/api-utils'
import { useAuth } from '@/contexts/AuthContext'

// Team type removed from this page after sidebar redesign

type League = {
  leagueId: string
  name: string
  seasonYear: number
  week: number
}

type LeaguesResponse = {
  leagues: League[]
}

// TeamsResponse type no longer used here

export default function LeaguesPage() {
  const [leagues, setLeagues] = useState<League[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeveloper, setIsDeveloper] = useState(false)
  const [leaderboard, setLeaderboard] = useState<Array<{
    rank: number
    user: string
    wins: number
    losses: number
    streakType: 'W' | 'L' | ''
    streakCount: number
    winPct: number
  }>>([])
  const { isAdmin } = useAuth()

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Check developer access first
        const developerAccess = await checkDeveloperAccess()
        setIsDeveloper(developerAccess)
        
        // Fetch leagues using new API utility
        const leaguesData = await fetchUserLeagues()
        const formattedLeagues = (leaguesData as LeaguesResponse).leagues || (Array.isArray(leaguesData as unknown as unknown[]) ? (leaguesData as unknown as League[]) : [])
        console.log('✅ Fetched leagues:', { isDeveloper: developerAccess, count: formattedLeagues.length, leagues: formattedLeagues })
        setLeagues(formattedLeagues as League[])
        
        // Try to fetch leaderboard (optional)
        try {
          const leaderboardData = await fetchLeaderboard()
          if (leaderboardData) {
            setLeaderboard(leaderboardData)
          }
        } catch (leaderboardError) {
          console.log('ℹ️ Leaderboard not available:', leaderboardError)
          // Don't show error for optional leaderboard
        }
        
      } catch (err) {
        console.error('❌ Failed to load leagues:', err)
        setError('Failed to load your leagues. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-green mx-auto mb-4"></div>
            <p className="text-gray-400">Loading your leagues...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-red-400 mb-2">Error Loading Leagues</h2>
            <p className="text-red-300">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  // No leagues state
  if (leagues.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-3xl font-bold text-neon-green mb-4">No Leagues Found</h1>
            <p className="text-gray-400 mb-6">
              {isDeveloper 
                ? "No leagues exist in the system yet."
                : "You don&apos;t appear to be a member of any leagues yet."
              }
            </p>
            <div className="space-y-4">
              {!isDeveloper && (
                <>
                  <p className="text-sm text-gray-500">
                    • Check if you have pending league invitations
                  </p>
                  <p className="text-sm text-gray-500">
                    • Contact your league commissioner to be added
                  </p>
                </>
              )}
              <p className="text-sm text-gray-500">
                • Or create a new league if you&apos;re a commissioner
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold text-neon-green mb-2">
                  {isDeveloper ? 'All Leagues' : 'My Leagues'}
                </h1>
                <p className="text-gray-400 text-lg">
                  {isDeveloper 
                    ? 'System-wide league management and monitoring'
                    : 'Manage your Madden leagues and track your progress'
                  }
                </p>
              </div>
              {isDeveloper && (
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg px-4 py-2">
                  <span className="text-blue-400 text-sm font-medium">🔓 Developer Access</span>
                </div>
              )}
            </div>
            
            {/* Developer Info */}
            {isDeveloper && (
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="text-blue-400 text-lg">🔓</div>
                  <div>
                    <h3 className="text-white font-medium">Developer Access Active</h3>
                    <p className="text-gray-400 text-sm">
                      You can view and manage all leagues in the system. 
                      {leagues.length > 0 && ` Currently showing ${leagues.length} league${leagues.length !== 1 ? 's' : ''}.`}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Leagues Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {leagues.map((league) => (
              <Link
                key={league.leagueId}
                href={`/leagues/${league.leagueId || 'unknown'}`}
                className="block group"
              >
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-neon-green transition-all duration-200 hover:shadow-lg hover:shadow-neon-green/20">
                  <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-neon-green transition-colors">
                    {league.name || 'Untitled League'}
                  </h3>
                  <div className="space-y-2 text-sm text-gray-400">
                    <p>Season: {league.seasonYear || 'N/A'}</p>
                    <p>Week: {league.week || 'N/A'}</p>
                    {isDeveloper && (
                      <p className="text-blue-400">ID: {league.leagueId}</p>
                    )}
                  </div>
                  <div className="mt-4 text-neon-green text-sm font-medium group-hover:text-white transition-colors">
                    View League →
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Quick Actions */}
          {(isAdmin() || isDeveloper) && (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold text-white mb-4">Commissioner Actions</h2>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/commissioner"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Commissioner Hub
                </Link>
                <Link
                  href="/commissioner/create-league"
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Create New League
                </Link>
                {isDeveloper && (
                  <Link
                    href="/admin/leagues"
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Admin Panel
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Leaderboard Section (if available) */}
          {leaderboard.length > 0 && (
            <div className="mt-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold text-white mb-4">Top Users</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-2 text-gray-400">Rank</th>
                      <th className="text-left py-2 text-gray-400">User</th>
                      <th className="text-left py-2 text-gray-400">Wins</th>
                      <th className="text-left py-2 text-gray-400">Losses</th>
                      <th className="text-left py-2 text-gray-400">Win %</th>
                      <th className="text-left py-2 text-gray-400">Streak</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry, index) => (
                      <tr key={index} className="border-b border-gray-700/50">
                        <td className="py-2 text-white">#{entry.rank}</td>
                        <td className="py-2 text-white">{entry.user}</td>
                        <td className="py-2 text-green-400">{entry.wins}</td>
                        <td className="py-2 text-red-400">{entry.losses}</td>
                        <td className="py-2 text-white">{entry.winPct}%</td>
                        <td className="py-2 text-white">
                          {entry.streakType}{entry.streakCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
