'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { API_BASE } from '@/lib/config'
import { 
  getLeagueSettings, 
  generateInviteLink, 
  assignTeamToUser, 
  removeUserFromLeague, 
  getCompanionAppInfo,
  checkCommissionerAccess
} from '@/lib/api'

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

type TabType = 'overview' | 'teams' | 'users' | 'invites' | 'companion'

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
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [currentUser, setCurrentUser] = useState<{ id: number; email: string } | null>(null)
  const [hasAccess, setHasAccess] = useState(false)

  // Check commissioner access and load data
  useEffect(() => {
    const checkAccessAndLoadData = async () => {
      try {
        setLoading(true)
        
        // Get current user
        const userRes = await fetch(`${API_BASE}/me`, {
          credentials: 'include'
        })
        
        if (!userRes.ok) {
          throw new Error('Not authenticated')
        }
        
        const userData = await userRes.json()
        setCurrentUser(userData)
        
        // Check commissioner access for this league
        const hasCommissionerAccess = await checkCommissionerAccess(userData.id, leagueId)
        setHasAccess(hasCommissionerAccess)
        
        if (!hasCommissionerAccess && !userData.is_admin) {
          router.push('/unauthorized')
          return
        }
        
        // Load league data
        const leagueData = await getLeagueSettings(userData.id, leagueId)
        setLeague(leagueData.league)
        
        // Load teams
        const teamsRes = await fetch(`${API_BASE}/leagues/${leagueId}/teams`, {
          credentials: 'include'
        })
        if (teamsRes.ok) {
          const teamsData = await teamsRes.json()
          setTeams(teamsData.teams || [])
        }
        
        // Load users
        const usersRes = await fetch(`${API_BASE}/leagues/${leagueId}/users`, {
          credentials: 'include'
        })
        if (usersRes.ok) {
          const usersData = await usersRes.json()
          setUsers(usersData.users || [])
        }
        
        // Load companion app info
        try {
          const companionData = await getCompanionAppInfo(userData.id, leagueId)
          setCompanionApp(companionData)
                 } catch {
           console.log('Companion app not set up yet')
         }
        
      } catch (err) {
        console.error('Failed to load commissioner data:', err)
        setError('Failed to load commissioner data')
      } finally {
        setLoading(false)
      }
    }

    if (leagueId) {
      checkAccessAndLoadData()
    }
  }, [leagueId, router])

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // You could add a toast notification here
      alert('Copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const generateInvite = async () => {
    if (!currentUser) return
    
    try {
      const result = await generateInviteLink(currentUser.id, leagueId)
      const inviteUrl = `${window.location.origin}/leagues/${leagueId}/join?code=${result.invite_code}`
      copyToClipboard(inviteUrl)
    } catch (error) {
      console.error('Failed to generate invite:', error)
      alert('Failed to generate invite link')
    }
  }

  const assignTeam = async (teamId: number, userEmail: string) => {
    if (!currentUser) return
    
    try {
      await assignTeamToUser(currentUser.id, leagueId, teamId, userEmail)
      // Refresh teams data
      const teamsRes = await fetch(`${API_BASE}/leagues/${leagueId}/teams`, {
        credentials: 'include'
      })
      if (teamsRes.ok) {
        const teamsData = await teamsRes.json()
        setTeams(teamsData.teams || [])
      }
      alert('Team assigned successfully!')
    } catch (error) {
      console.error('Failed to assign team:', error)
      alert('Failed to assign team')
    }
  }

  const removeUser = async (userEmail: string) => {
    if (!currentUser) return
    
    if (!confirm(`Are you sure you want to remove ${userEmail} from the league?`)) {
      return
    }
    
    try {
      await removeUserFromLeague(currentUser.id, leagueId, userEmail)
      // Refresh users data
      const usersRes = await fetch(`${API_BASE}/leagues/${leagueId}/users`, {
        credentials: 'include'
      })
      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData.users || [])
      }
      alert('User removed successfully!')
    } catch (error) {
      console.error('Failed to remove user:', error)
      alert('Failed to remove user')
    }
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

  if (error || !league) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'League not found'}</p>
          <button 
            onClick={() => router.push('/leagues')} 
            className="bg-neon-green text-black px-4 py-2 rounded hover:bg-green-400"
          >
            Back to Leagues
          </button>
        </div>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">You don&apos;t have commissioner access to this league</p>
          <button 
            onClick={() => router.push(`/leagues/${leagueId}`)} 
            className="bg-neon-green text-black px-4 py-2 rounded hover:bg-green-400"
          >
            Back to League
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
                onClick={() => router.push(`/leagues/${leagueId}`)}
                className="mr-4 text-gray-400 hover:text-white"
              >
                ← Back to League
              </button>
              <div className="flex items-center">
                {league.image_url ? (
                  <div className="relative w-16 h-16 mr-4">
                    <Image 
                      src={league.image_url} 
                      alt={league.name}
                      fill
                      className="rounded-lg object-cover"
                    />
                  </div>
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
              { id: 'overview' as TabType, label: 'Overview', icon: '📊' },
              { id: 'teams' as TabType, label: 'Teams', icon: '🏈' },
              { id: 'users' as TabType, label: 'Users', icon: '👥' },
              { id: 'invites' as TabType, label: 'Invites', icon: '📧' },
              { id: 'companion' as TabType, label: 'Companion App', icon: '📱' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">League Information</h3>
                  <div className="space-y-2">
                    <p><strong>Name:</strong> {league.name}</p>
                    <p><strong>Description:</strong> {league.description || 'No description'}</p>
                    <p><strong>Created:</strong> {new Date(league.created_at).toLocaleDateString()}</p>
                    <p><strong>Status:</strong> {league.setup_completed ? 'Active' : 'Setup Required'}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Quick Stats</h3>
                  <div className="space-y-2">
                    <p><strong>Teams:</strong> {teams.length}</p>
                    <p><strong>Members:</strong> {users.length}</p>
                    <p><strong>Assigned Teams:</strong> {teams.filter(t => t.user_id).length}</p>
                    <p><strong>Available Teams:</strong> {teams.filter(t => !t.user_id).length}</p>
                  </div>
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
                    <h3 className="font-semibold mb-2">{team.city} {team.name}</h3>
                    <p className="text-sm text-gray-400 mb-2">ID: {team.id}</p>
                    {team.user ? (
                      <div>
                        <p className="text-sm text-green-400">Assigned to: {team.user}</p>
                        <button
                          onClick={() => assignTeam(team.id, '')}
                          className="mt-2 bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-xs"
                        >
                          Unassign
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-gray-400">Unassigned</p>
                        <input
                          type="email"
                          placeholder="Enter user email"
                          className="mt-2 w-full px-2 py-1 rounded text-sm bg-gray-600 text-white"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              const email = (e.target as HTMLInputElement).value
                              if (email) assignTeam(team.id, email)
                            }
                          }}
                        />
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
                  <div key={user.id} className="bg-gray-700 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{user.email}</p>
                      <p className="text-sm text-gray-400">Role: {user.role}</p>
                      {user.team_id && (
                        <p className="text-sm text-green-400">
                          Team: {teams.find(t => t.id === user.team_id)?.name || 'Unknown'}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => removeUser(user.email)}
                      className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-xs"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'invites' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Invite Management</h2>
              <div className="space-y-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-2">Generate Invite Link</h3>
                  <p className="text-gray-400 mb-4">
                    Create a new invite link for this league. Share this link with new members.
                  </p>
                  <button
                    onClick={generateInvite}
                    className="bg-neon-green text-black px-4 py-2 rounded hover:bg-green-400"
                  >
                    Generate Invite Link
                  </button>
                </div>
                
                {league.invite_code && (
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-2">Current Invite Code</h3>
                    <div className="flex items-center space-x-2">
                      <code className="bg-gray-600 px-2 py-1 rounded text-sm">
                        {league.invite_code}
                      </code>
                      <button
                        onClick={() => copyToClipboard(league.invite_code!)}
                        className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-xs"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'companion' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Companion App Setup</h2>
              {companionApp ? (
                <div className="space-y-4">
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-2">Ingestion URL</h3>
                    <div className="flex items-center space-x-2">
                      <code className="bg-gray-600 px-2 py-1 rounded text-sm flex-1">
                        {companionApp.ingestion_url}
                      </code>
                      <button
                        onClick={() => copyToClipboard(companionApp.ingestion_url)}
                        className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-xs"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-2">Setup Instructions</h3>
                    <p className="text-gray-300 whitespace-pre-wrap">
                      {companionApp.setup_instructions}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-700 rounded-lg p-4">
                  <p className="text-gray-400">
                    Companion app is not set up for this league yet. Contact support to enable this feature.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 