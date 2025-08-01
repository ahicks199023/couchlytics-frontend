'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
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

interface Team {
  id: number
  name: string
  abbreviation: string
  city: string
  user_id?: number
  user?: string
}

interface User {
  id: number
  email: string
  role: 'commissioner' | 'co-commissioner' | 'member'
  team_id?: number
}

interface CompanionAppInfo {
  league_id: string
  ingestion_url: string
  setup_instructions: string
}

export default function LeagueManagement() {
  const params = useParams()
  const router = useRouter()
  const leagueId = params.id as string

  const [league, setLeague] = useState<League | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [companionApp, setCompanionApp] = useState<CompanionAppInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'teams' | 'users' | 'invites' | 'companion'>('overview')

  useEffect(() => {
    const loadLeagueData = async () => {
      try {
        setLoading(true)
        
        // Load league settings
        const leagueRes = await fetch(`${API_BASE}/commissioner/league/${leagueId}/settings`, {
          credentials: 'include'
        })
        
        if (!leagueRes.ok) {
          throw new Error('Failed to load league settings')
        }
        
        const leagueData = await leagueRes.json()
        setLeague(leagueData.league)
        setTeams(leagueData.teams || [])
        setUsers(leagueData.users || [])
        
        // Load companion app info
        const companionRes = await fetch(`${API_BASE}/commissioner/league/${leagueId}/companion-app`, {
          credentials: 'include'
        })
        
        if (companionRes.ok) {
          const companionData = await companionRes.json()
          setCompanionApp(companionData)
        }
        
      } catch (err) {
        console.error('Failed to load league data:', err)
        setError('Failed to load league data')
      } finally {
        setLoading(false)
      }
    }

    if (leagueId) {
      loadLeagueData()
    }
  }, [leagueId])

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      alert(`${label} copied to clipboard!`)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  const generateInviteLink = async () => {
    try {
      const res = await fetch(`${API_BASE}/commissioner/league/${leagueId}/invite`, {
        method: 'POST',
        credentials: 'include'
      })
      
      if (res.ok) {
        const data = await res.json()
        setLeague(prev => prev ? { ...prev, invite_code: data.invite_code } : null)
        alert('New invite link generated!')
      }
    } catch (err) {
      console.error('Failed to generate invite link:', err)
    }
  }

  const assignTeam = async (userId: number, teamId: number) => {
    try {
      const res = await fetch(`${API_BASE}/commissioner/league/${leagueId}/assign-team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ user_id: userId, team_id: teamId })
      })
      
      if (res.ok) {
        // Reload data
        window.location.reload()
      } else {
        const errorData = await res.json()
        alert(`Failed to assign team: ${errorData.error}`)
      }
    } catch (err) {
      console.error('Failed to assign team:', err)
    }
  }

  const unassignTeam = async (teamId: number) => {
    try {
      const res = await fetch(`${API_BASE}/commissioner/league/${leagueId}/unassign-team`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ team_id: teamId })
      })
      
      if (res.ok) {
        // Reload data
        window.location.reload()
      }
    } catch (err) {
      console.error('Failed to unassign team:', err)
    }
  }

  const removeUser = async (userId: number) => {
    if (!confirm('Are you sure you want to remove this user from the league?')) {
      return
    }
    
    try {
      const res = await fetch(`${API_BASE}/commissioner/league/${leagueId}/remove-user`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ user_id: userId })
      })
      
      if (res.ok) {
        // Reload data
        window.location.reload()
      }
    } catch (err) {
      console.error('Failed to remove user:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-green mx-auto mb-4"></div>
          <p className="text-white">Loading League Management...</p>
        </div>
      </div>
    )
  }

  if (error || !league) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'League not found'}</p>
          <button 
            onClick={() => router.push('/commissioner')} 
            className="bg-neon-green text-black px-4 py-2 rounded hover:bg-green-400"
          >
            Back to Commissioner Hub
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
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/commissioner')}
                className="mr-4 text-gray-400 hover:text-white"
              >
                ← Back to Commissioner Hub
              </button>
              <div className="flex items-center">
                {league.image_url ? (
                  <img 
                    src={league.image_url} 
                    alt={league.name}
                    className="w-16 h-16 rounded-lg mr-4 object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-600 rounded-lg mr-4 flex items-center justify-center">
                    <span className="text-gray-400 font-bold text-2xl">
                      {league.name.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <h1 className="text-3xl font-bold">{league.name}</h1>
                  <p className="text-gray-400">
                    {league.setup_completed ? 'Setup Complete' : 'Setup Pending'}
                  </p>
                </div>
              </div>
            </div>
            <div className={`px-3 py-1 rounded text-sm font-medium ${
              league.setup_completed 
                ? 'bg-green-600 text-white' 
                : 'bg-yellow-600 text-black'
            }`}>
              {league.setup_completed ? 'Active' : 'Setup Required'}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-1 bg-gray-800 rounded-lg p-1">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'teams', label: 'Teams', icon: '🏈' },
              { id: 'users', label: 'Users', icon: '👥' },
              { id: 'invites', label: 'Invites', icon: '📧' },
              { id: 'companion', label: 'Companion App', icon: '📱' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-neon-green text-black'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-gray-800 rounded-lg p-6">
          {activeTab === 'overview' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">League Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-2">Members</h3>
                  <p className="text-3xl font-bold text-neon-green">{users.length}</p>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-2">Teams</h3>
                  <p className="text-3xl font-bold text-blue-400">{teams.length}</p>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-2">Assigned</h3>
                  <p className="text-3xl font-bold text-purple-400">
                    {teams.filter(t => t.user_id).length}
                  </p>
                </div>
              </div>
              
              {league.description && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Description</h3>
                  <p className="text-gray-300">{league.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Created</h3>
                  <p className="text-gray-300">
                    {new Date(league.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Last Updated</h3>
                  <p className="text-gray-300">
                    {new Date(league.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'teams' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Team Management</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teams.map((team) => (
                  <div key={team.id} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{team.name}</h3>
                      <span className="text-sm text-gray-400">{team.abbreviation}</span>
                    </div>
                    
                    {team.user_id ? (
                      <div className="mb-3">
                        <p className="text-sm text-gray-400">Assigned to:</p>
                        <p className="text-sm font-medium">
                          {users.find(u => u.id === team.user_id)?.email || 'Unknown User'}
                        </p>
                        <button
                          onClick={() => unassignTeam(team.id)}
                          className="mt-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                        >
                          Unassign
                        </button>
                      </div>
                    ) : (
                      <div className="mb-3">
                        <p className="text-sm text-gray-400 mb-2">Available</p>
                        <select
                          onChange={(e) => {
                            const userId = parseInt(e.target.value)
                            if (userId) {
                              assignTeam(userId, team.id)
                            }
                          }}
                          className="w-full bg-gray-600 text-white border border-gray-500 rounded px-2 py-1 text-sm"
                        >
                          <option value="">Assign to user...</option>
                          {users.filter(u => !teams.find(t => t.user_id === u.id)).map(user => (
                            <option key={user.id} value={user.id}>
                              {user.email}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">User Management</h2>
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{user.email}</h3>
                        <p className="text-sm text-gray-400">
                          Role: {user.role} | 
                          Team: {user.team_id ? teams.find(t => t.id === user.team_id)?.name : 'None'}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <select
                          value={user.role}
                          onChange={(e) => {
                            // TODO: Implement role update
                            console.log('Update role to:', e.target.value)
                          }}
                          className="bg-gray-600 text-white border border-gray-500 rounded px-2 py-1 text-sm"
                        >
                          <option value="member">Member</option>
                          <option value="co-commissioner">Co-Commissioner</option>
                          <option value="commissioner">Commissioner</option>
                        </select>
                        {user.role !== 'commissioner' && (
                          <button
                            onClick={() => removeUser(user.id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'invites' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Invite Management</h2>
              <div className="bg-gray-700 rounded-lg p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">Invite Link</h3>
                  {league.invite_code ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={`${window.location.origin}/join/${league.invite_code}`}
                        readOnly
                        className="flex-1 bg-gray-600 text-white border border-gray-500 rounded px-3 py-2"
                      />
                      <button
                        onClick={() => copyToClipboard(`${window.location.origin}/join/${league.invite_code}`, 'Invite link')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                      >
                        Copy
                      </button>
                    </div>
                  ) : (
                    <p className="text-gray-400">No invite link generated</p>
                  )}
                </div>
                
                <button
                  onClick={generateInviteLink}
                  className="bg-neon-green text-black font-semibold px-4 py-2 rounded hover:bg-green-400"
                >
                  Generate New Invite Link
                </button>
              </div>
            </div>
          )}

          {activeTab === 'companion' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Companion App Setup</h2>
              {companionApp ? (
                <div className="space-y-6">
                  <div className="bg-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-2">Ingestion URL</h3>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={companionApp.ingestion_url}
                        readOnly
                        className="flex-1 bg-gray-600 text-white border border-gray-500 rounded px-3 py-2"
                      />
                      <button
                        onClick={() => copyToClipboard(companionApp.ingestion_url, 'Ingestion URL')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-2">Setup Instructions</h3>
                    <div className="text-gray-300 whitespace-pre-line">
                      {companionApp.setup_instructions}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-700 rounded-lg p-6 text-center">
                  <p className="text-gray-400 mb-4">Companion app not configured</p>
                  <button
                    onClick={() => {
                      // TODO: Implement companion app setup
                      console.log('Setup companion app')
                    }}
                    className="bg-neon-green text-black font-semibold px-4 py-2 rounded hover:bg-green-400"
                  >
                    Setup Companion App
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 