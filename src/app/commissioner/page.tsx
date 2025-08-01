'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { API_BASE } from '@/lib/config'

interface League {
  id: string
  name: string
  description?: string
  image_url?: string
  invite_code?: string
  setup_completed: boolean
  created_at: string
  updated_at: string
}

interface User {
  id: number
  email: string
  is_commissioner?: boolean
  is_admin?: boolean
}

export default function CommissionerHub() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [leagues, setLeagues] = useState<League[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkUserAndLoadLeagues = async () => {
      try {
        setLoading(true)
        
        // Check if user is commissioner or admin
        const userRes = await fetch(`${API_BASE}/me`, {
          credentials: 'include'
        })
        
        if (!userRes.ok) {
          throw new Error('Not authenticated')
        }
        
        const userData = await userRes.json()
        setUser(userData)
        
        if (!userData.is_commissioner && !userData.is_admin) {
          router.push('/unauthorized')
          return
        }
        
        // Load commissioner leagues
        const leaguesRes = await fetch(`${API_BASE}/commissioner/leagues`, {
          credentials: 'include'
        })
        
        if (leaguesRes.ok) {
          const leaguesData = await leaguesRes.json()
          setLeagues(leaguesData.leagues || [])
        }
        
      } catch (err) {
        console.error('Failed to load commissioner data:', err)
        setError('Failed to load commissioner data')
      } finally {
        setLoading(false)
      }
    }

    checkUserAndLoadLeagues()
  }, [router])

  const createNewLeague = () => {
    router.push('/commissioner/create-league')
  }

  const manageLeague = (leagueId: string) => {
    router.push(`/commissioner/league/${leagueId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-green mx-auto mb-4"></div>
          <p className="text-white">Loading Commissioner Hub...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-neon-green text-black px-4 py-2 rounded hover:bg-green-400"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-neon-green mb-2">Commissioner's Hub</h1>
          <p className="text-gray-400">
            Manage your fantasy football leagues with comprehensive tools and controls
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={createNewLeague}
                className="bg-neon-green text-black font-semibold px-6 py-3 rounded-lg hover:bg-green-400 transition-colors"
              >
                Create New League
              </button>
              <button
                onClick={() => router.push('/commissioner/analytics')}
                className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Analytics
              </button>
              <button
                onClick={() => router.push('/commissioner/settings')}
                className="bg-purple-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Global Settings
              </button>
            </div>
          </div>
        </div>

        {/* Leagues Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Your Leagues</h2>
          
          {leagues.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-8 text-center">
              <p className="text-gray-400 mb-4">You haven't created any leagues yet.</p>
              <button
                onClick={createNewLeague}
                className="bg-neon-green text-black font-semibold px-6 py-3 rounded-lg hover:bg-green-400 transition-colors"
              >
                Create Your First League
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {leagues.map((league) => (
                <div key={league.id} className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors cursor-pointer" onClick={() => manageLeague(league.id)}>
                  <div className="flex items-center mb-4">
                    {league.image_url ? (
                      <img 
                        src={league.image_url} 
                        alt={league.name}
                        className="w-12 h-12 rounded-lg mr-4 object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-600 rounded-lg mr-4 flex items-center justify-center">
                        <span className="text-gray-400 font-bold text-lg">
                          {league.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold">{league.name}</h3>
                      <p className="text-sm text-gray-400">
                        {league.setup_completed ? 'Setup Complete' : 'Setup Pending'}
                      </p>
                    </div>
                  </div>
                  
                  {league.description && (
                    <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                      {league.description}
                    </p>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">
                      Created {new Date(league.created_at).toLocaleDateString()}
                    </span>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      league.setup_completed 
                        ? 'bg-green-600 text-white' 
                        : 'bg-yellow-600 text-black'
                    }`}>
                      {league.setup_completed ? 'Active' : 'Setup Required'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Features Overview */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Commissioner Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-lg mx-auto mb-2 flex items-center justify-center">
                <span className="text-white font-bold">👥</span>
              </div>
              <h3 className="font-semibold mb-1">User Management</h3>
              <p className="text-sm text-gray-400">Manage members and permissions</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-600 rounded-lg mx-auto mb-2 flex items-center justify-center">
                <span className="text-white font-bold">🏈</span>
              </div>
              <h3 className="font-semibold mb-1">Team Assignment</h3>
              <p className="text-sm text-gray-400">Assign teams to users</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-600 rounded-lg mx-auto mb-2 flex items-center justify-center">
                <span className="text-white font-bold">📱</span>
              </div>
              <h3 className="font-semibold mb-1">Companion App</h3>
              <p className="text-sm text-gray-400">Setup Madden integration</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-600 rounded-lg mx-auto mb-2 flex items-center justify-center">
                <span className="text-white font-bold">📊</span>
              </div>
              <h3 className="font-semibold mb-1">Analytics</h3>
              <p className="text-sm text-gray-400">League statistics and insights</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 