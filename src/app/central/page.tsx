'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { API_BASE } from '@/lib/config'

interface Announcement {
  id: number
  title: string
  content: string
  author: string
  author_role: string
  created_at: string
  priority: 'low' | 'medium' | 'high'
  category: 'announcement' | 'update' | 'maintenance' | 'feature'
}

interface UserLeaderboard {
  id: number
  username: string
  total_leagues: number
  commissioner_leagues: number
  total_trades: number
  reputation_score: number
  avatar?: string
}

export default function CouchlyticsCentral() {
  const { user, authenticated, loading } = useAuth()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [leaderboard, setLeaderboard] = useState<UserLeaderboard[]>([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (authenticated && user) {
      fetchCentralData()
    }
  }, [authenticated, user])

  const fetchCentralData = async () => {
    try {
      setLoadingData(true)

      // Fetch announcements and leaderboard data
      const [announcementsRes, leaderboardRes] = await Promise.all([
        fetch(`${API_BASE}/central/announcements`, { credentials: 'include' }),
        fetch(`${API_BASE}/central/leaderboard`, { credentials: 'include' })
      ])

      if (announcementsRes.ok) {
        const announcementsData = await announcementsRes.json()
        setAnnouncements(announcementsData.announcements || [])
      }

      if (leaderboardRes.ok) {
        const leaderboardData = await leaderboardRes.json()
        setLeaderboard(leaderboardData.users || [])
      }
    } catch (err) {
      console.error('Error fetching central data:', err)
      console.error('Failed to load central data')
      
      // Set mock data for development
      setAnnouncements([
        {
          id: 1,
          title: 'Welcome to Couchlytics Central!',
          content: 'This is your members-only dashboard where you can stay updated on all platform announcements, updates, and connect with other league managers.',
          author: 'Couchlytics Team',
          author_role: 'Developer',
          created_at: new Date().toISOString(),
          priority: 'high',
          category: 'announcement'
        },
        {
          id: 2,
          title: 'New Trade System Features Coming Soon',
          content: 'We\'re working on enhanced committee voting, auto-approval logic, and improved trade analytics. Stay tuned for updates!',
          author: 'Development Team',
          author_role: 'Developer',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          priority: 'medium',
          category: 'update'
        }
      ])
      
      setLeaderboard([
        { id: 1, username: 'LeagueMaster', total_leagues: 5, commissioner_leagues: 3, total_trades: 12, reputation_score: 95 },
        { id: 2, username: 'TradeKing', total_leagues: 3, commissioner_leagues: 1, total_trades: 28, reputation_score: 88 },
        { id: 3, username: 'DraftGuru', total_leagues: 4, commissioner_leagues: 2, total_trades: 8, reputation_score: 82 }
      ])
    } finally {
      setLoadingData(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500 bg-red-500/10'
      case 'medium': return 'border-yellow-500 bg-yellow-500/10'
      case 'low': return 'border-blue-500 bg-blue-500/10'
      default: return 'border-gray-500 bg-gray-500/10'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'announcement': return '📢'
      case 'update': return '🔄'
      case 'maintenance': return '🔧'
      case 'feature': return '✨'
      default: return '📝'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-green mx-auto mb-4"></div>
          <p>Loading Couchlytics Central...</p>
        </div>
      </div>
    )
  }

  if (!authenticated || !user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-400 mb-6">You must be logged in to access Couchlytics Central</p>
          <Link href="/login" className="bg-neon-green text-black px-6 py-3 rounded-lg font-semibold hover:bg-green-400">
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-4xl font-bold text-neon-green mb-2">
            🏠 Couchlytics Central
          </h1>
          <p className="text-xl text-gray-300">
            Welcome back, {user.firstName || user.email}! Your members-only dashboard
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Timeline/Announcements */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  📢 Platform Announcements & Updates
                </h2>
                <div className="text-sm text-gray-400">
                  {announcements.length} announcements
                </div>
              </div>

              {loadingData ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : announcements.length > 0 ? (
                <div className="space-y-6">
                  {announcements.map((announcement) => (
                    <div
                      key={announcement.id}
                      className={`p-6 rounded-lg border-l-4 ${getPriorityColor(announcement.priority)}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{getCategoryIcon(announcement.category)}</span>
                          <div>
                            <h3 className="text-lg font-semibold text-white">
                              {announcement.title}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-400">
                              <span>By {announcement.author}</span>
                              <span className="bg-gray-700 px-2 py-1 rounded text-xs">
                                {announcement.author_role}
                              </span>
                              <span>
                                {new Date(announcement.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          announcement.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                          announcement.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {announcement.priority.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-gray-300 leading-relaxed">
                        {announcement.content}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📢</div>
                  <h3 className="text-xl font-semibold text-gray-300 mb-2">No Announcements Yet</h3>
                  <p className="text-gray-500">Check back later for platform updates and announcements</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Global Chat Access */}
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
              <h3 className="text-xl font-bold text-white mb-4">
                💬 Global Couchlytics Chat
              </h3>
              <p className="text-gray-400 mb-4">
                Connect with league managers from around the world
              </p>
              <Link
                href="/chat"
                className="block w-full bg-neon-green text-black text-center py-3 px-4 rounded-lg font-semibold hover:bg-green-400 transition-colors"
              >
                Join Global Chat
              </Link>
            </div>

            {/* Users Leaderboard */}
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
              <h3 className="text-xl font-bold text-white mb-4">
                🏆 Top League Managers
              </h3>
              {loadingData ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-3 bg-gray-700 rounded w-3/4 mb-1"></div>
                        <div className="h-2 bg-gray-700 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : leaderboard.length > 0 ? (
                <div className="space-y-3">
                  {leaderboard.map((user, index) => (
                    <div key={user.id} className="flex items-center space-x-3 p-2 rounded hover:bg-gray-800">
                      <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white truncate">
                          {user.username}
                        </div>
                        <div className="text-xs text-gray-400">
                          {user.total_leagues} leagues • {user.total_trades} trades
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-neon-green">
                          {user.reputation_score}
                        </div>
                        <div className="text-xs text-gray-500">pts</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">🏆</div>
                  <p className="text-gray-500 text-sm">No leaderboard data available</p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
              <h3 className="text-xl font-bold text-white mb-4">
                ⚡ Quick Actions
              </h3>
              <div className="space-y-3">
                <Link
                  href="/leagues"
                  className="block w-full bg-gray-800 hover:bg-gray-700 text-white text-center py-2 px-4 rounded transition-colors"
                >
                  View My Leagues
                </Link>
                <Link
                  href="/leagues/create"
                  className="block w-full bg-gray-800 hover:bg-gray-700 text-white text-center py-2 px-4 rounded transition-colors"
                >
                  Create New League
                </Link>
                <Link
                  href="/profile"
                  className="block w-full bg-gray-800 hover:bg-gray-700 text-white text-center py-2 px-4 rounded transition-colors"
                >
                  Update Profile
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
