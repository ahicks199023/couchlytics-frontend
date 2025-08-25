'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { API_BASE } from '@/lib/config'

interface LeagueInfo {
  id: string
  name: string
  seasonYear: number
  teamCount: number
  playerCount: number
}

export default function CommissionerHub() {
  const { leagueId } = useParams()
  const [leagueInfo, setLeagueInfo] = useState<LeagueInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLeagueInfo = async () => {
      try {
        setLoading(true)
        const response = await fetch(`${API_BASE}/leagues/${leagueId}`, {
          credentials: 'include'
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.league) {
            setLeagueInfo({
              id: data.league.leagueId || leagueId,
              name: data.league.name,
              seasonYear: data.league.seasonYear,
              teamCount: data.teams?.length || 0,
              playerCount: data.players?.length || 0
            })
          }
        }
      } catch (err) {
        console.error('Error fetching league info:', err)
        setError('Failed to load league information')
      } finally {
        setLoading(false)
      }
    }

    if (leagueId) {
      fetchLeagueInfo()
    }
  }, [leagueId])

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-green mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading Commissioner Hub...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-400 mb-2">Error</h2>
            <p className="text-red-300">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">⚖️ Commissioner Hub</h1>
          <p className="text-gray-400 text-lg">
            Manage your league: {leagueInfo?.name} (Season {leagueInfo?.seasonYear})
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-gray-300 mb-2">Teams</h3>
            <p className="text-3xl font-bold text-neon-green">{leagueInfo?.teamCount || 0}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-gray-300 mb-2">Players</h3>
            <p className="text-3xl font-bold text-blue-400">{leagueInfo?.playerCount || 0}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-gray-300 mb-2">Season</h3>
            <p className="text-3xl font-bold text-purple-400">{leagueInfo?.seasonYear || 'N/A'}</p>
          </div>
        </div>

        {/* Management Tools */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Draft Pick Values */}
          <Link 
            href={`/leagues/${leagueId}/commissioner/draft-picks`}
            className="bg-gray-800 hover:bg-gray-700 rounded-lg p-6 border border-gray-700 transition-colors group"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">🏈 Draft Pick Values</h3>
              <span className="text-gray-400 group-hover:text-white transition-colors">→</span>
            </div>
            <p className="text-gray-400 mb-4">
              Customize draft pick values for your league. Set individual values for each round and pick.
            </p>
            <div className="text-sm text-gray-500">
              Manage 224 draft pick values
            </div>
          </Link>

          {/* League Settings */}
          <Link 
            href={`/leagues/${leagueId}/commissioner/settings`}
            className="bg-gray-800 hover:bg-gray-700 rounded-lg p-6 border border-gray-700 transition-colors group"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">⚙️ League Settings</h3>
              <span className="text-gray-400 group-hover:text-white transition-colors">→</span>
            </div>
            <p className="text-gray-400 mb-4">
              Configure league rules, scoring, and general settings.
            </p>
            <div className="text-sm text-gray-500">
              Rules, scoring, and preferences
            </div>
          </Link>

          {/* Team Management */}
          <Link 
            href={`/leagues/${leagueId}/teams`}
            className="bg-gray-800 hover:bg-gray-700 rounded-lg p-6 border border-gray-700 transition-colors group"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">🏈 Team Management</h3>
              <span className="text-gray-400 group-hover:text-white transition-colors">→</span>
            </div>
            <p className="text-gray-400 mb-4">
              View and manage team rosters, ownership, and team information.
            </p>
            <div className="text-sm text-gray-500">
              {leagueInfo?.teamCount || 0} teams
            </div>
          </Link>

          {/* User Management */}
          <Link 
            href={`/leagues/${leagueId}/commissioner/users`}
            className="bg-gray-800 hover:bg-gray-700 rounded-lg p-6 border border-gray-700 transition-colors group"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">👥 User Management</h3>
              <span className="text-gray-400 group-hover:text-white transition-colors">→</span>
            </div>
            <p className="text-gray-400 mb-4">
              Manage league members, permissions, and user roles.
            </p>
            <div className="text-sm text-gray-500">
              Member access and roles
            </div>
          </Link>

          {/* Trade Management */}
          <Link 
            href={`/leagues/${leagueId}/trades`}
            className="bg-gray-800 hover:bg-gray-700 rounded-lg p-6 border border-gray-700 transition-colors group"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">🔄 Trade Management</h3>
              <span className="text-gray-400 group-hover:text-white transition-colors">→</span>
            </div>
            <p className="text-gray-400 mb-4">
              Review, approve, and manage league trades.
            </p>
            <div className="text-sm text-gray-500">
              Trade approval and history
            </div>
          </Link>

          {/* AI Commissioner */}
          <Link 
            href={`/leagues/${leagueId}/ai-commissioner`}
            className="bg-gray-800 hover:bg-gray-700 rounded-lg p-6 border border-gray-700 transition-colors group"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">🤖 AI Commissioner</h3>
              <span className="text-gray-400 group-hover:text-white transition-colors">→</span>
            </div>
            <p className="text-gray-400 mb-4">
              Get AI-powered insights and recommendations for league management.
            </p>
            <div className="text-sm text-gray-500">
              AI-powered insights
            </div>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="mt-12 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <button className="bg-neon-green hover:bg-green-400 text-black font-semibold px-4 py-2 rounded-lg transition-colors">
              📧 Send League Announcement
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors">
              📊 Generate League Report
            </button>
            <button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors">
              🔄 Reset Season
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
