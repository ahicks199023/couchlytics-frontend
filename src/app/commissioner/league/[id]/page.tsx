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
  updateLeagueSettings,
  assignTeamToUserFlexible,
  unassignTeam
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
  companion_app_url?: string
  league_id?: string
}

interface Team {
  id: number
  name: string
  abbreviation: string
  city: string
  user_id?: number
  user?: string
  team_id?: number
  assigned_user?: string
  is_assigned?: boolean
}

interface User {
  id: number
  first_name?: string
  last_name?: string
  email: string
  name?: string
  role: 'commissioner' | 'co-commissioner' | 'member'
  team_id?: number
  joined_at?: string
  is_active?: boolean
  team_abbreviation?: string
  team_name?: string
}

interface LeagueSettingsResponse {
  league: League
  members: User[]
  stats: {
    assigned_teams: number
    available_teams: number
    total_members: number
    total_teams: number
  }
  teams: Team[]
}

interface CompanionAppInfo {
  companion_app_url: string
  ingestion_endpoint: string
  league_id: string
  league_name: string
  setup_instructions: {
    step1: string
    step2: string
    step3: string
  }
}

interface LeagueSettings {
  name?: string
  description?: string
  image_url?: string
  invite_code?: string
  setup_completed?: boolean
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
  const [hasAccess, setHasAccess] = useState(false)
  
  // New states for editing
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    description: ''
  })
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  
  // New states for companion app
  const [companionAppUrl, setCompanionAppUrl] = useState<string>('')
  const [setupInstructions, setSetupInstructions] = useState<{step1: string, step2: string, step3: string} | null>(null)
  const [copyMessage, setCopyMessage] = useState<string>('')

  // Check commissioner access and load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // TEMPORARY: Bypass authentication check for now since OAuth isn't fully set up
        // TODO: Remove this bypass once OAuth authentication is working
        setHasAccess(true)
        
        // Check commissioner access by trying to get league settings
        try {
          const leagueData: LeagueSettingsResponse = await getLeagueSettings(leagueId)
          setLeague(leagueData.league)
          setTeams(leagueData.teams || [])
          setUsers(leagueData.members || [])
        } catch (error) {
          console.error('Commissioner access check failed:', error)
          setError('You do not have commissioner access to this league')
          setHasAccess(false)
          return
        }
        
        // Load companion app info
        try {
          const companionData = await getCompanionAppInfo(leagueId)
          setCompanionApp(companionData)
          setCompanionAppUrl(companionData.companion_app_url)
          setSetupInstructions(companionData.setup_instructions)
        } catch (error) {
          console.error('Failed to load companion app info:', error)
          setCompanionApp(null)
        }
        
      } catch (error) {
        console.error('Failed to load data:', error)
        setError('Failed to load league data')
      } finally {
        setLoading(false)
      }
    }
    
    if (leagueId) {
      loadData()
    }
  }, [leagueId])

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopyMessage('URL copied to clipboard!')
      setTimeout(() => setCopyMessage(''), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopyMessage('URL copied to clipboard!')
      setTimeout(() => setCopyMessage(''), 2000)
    }
  }

  const generateInvite = async () => {
    try {
      setError(null)
      const result = await generateInviteLink(leagueId)
      const inviteUrl = `${API_BASE}/invites/${result.invite_code}/go`
      copyToClipboard(inviteUrl)
      setSuccessMessage('Invite link generated and copied to clipboard!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error('Failed to generate invite:', error)
      setError('Failed to generate invite link')
    }
  }

  const assignTeam = async (teamId: number, userEmail: string) => {
    try {
      setError(null)
      await assignTeamToUser(leagueId, teamId, userEmail)
      // Refresh league data to get updated teams and users
      const leagueData: LeagueSettingsResponse = await getLeagueSettings(leagueId)
      setTeams(leagueData.teams || [])
      setUsers(leagueData.members || [])
      setSuccessMessage('Team assigned successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error('Failed to assign team:', error)
      setError('Failed to assign team')
    }
  }

  const removeUser = async (userEmail: string) => {
    if (!confirm(`Are you sure you want to remove ${userEmail} from the league?`)) {
      return
    }
    
    try {
      setError(null)
      await removeUserFromLeague(leagueId, userEmail)
      // Refresh league data to get updated teams and users
      const leagueData: LeagueSettingsResponse = await getLeagueSettings(leagueId)
      setTeams(leagueData.teams || [])
      setUsers(leagueData.members || [])
      setSuccessMessage('User removed successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error('Failed to remove user:', error)
      setError('Failed to remove user')
    }
  }

  // New functions for editing
  const startEditing = () => {
    if (league) {
      setEditForm({
        name: league.name,
        description: league.description || ''
      })
      setIsEditing(true)
    }
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setEditForm({ name: '', description: '' })
    setImageFile(null)
    setImagePreview(null)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const saveChanges = async () => {
    if (!league) return
    
    setSaving(true)
    setError(null)
    setSuccessMessage(null)
    
    try {
      // Prepare update data
      const updateData: LeagueSettings = {
        name: editForm.name,
        description: editForm.description
      }
      
      // Update league settings
      await updateLeagueSettings(leagueId, updateData)
      
      // Handle image upload if there's a new image
      if (imageFile) {
        const formData = new FormData()
        formData.append('image', imageFile)
        
        const imageRes = await fetch(`${API_BASE}/commissioner/league/${leagueId}/upload-image`, {
          method: 'POST',
          credentials: 'include',
          body: formData
        })
        
        if (!imageRes.ok) {
          throw new Error('Failed to upload image')
        }
      }
      
      // Refresh league data
      const leagueData = await getLeagueSettings(leagueId)
      setLeague(leagueData.league)
      
      setSuccessMessage('League settings updated successfully!')
      setIsEditing(false)
      setImageFile(null)
      setImagePreview(null)
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000)
      
    } catch (err) {
      console.error('Failed to update league:', err)
      setError(err instanceof Error ? err.message : 'Failed to update league settings')
    } finally {
      setSaving(false)
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
          {/* Success/Error Messages - Show on all tabs */}
          {successMessage && (
            <div className="bg-green-600 text-white px-4 py-2 rounded mb-4">
              {successMessage}
            </div>
          )}
          
          {error && (
            <div className="bg-red-600 text-white px-4 py-2 rounded mb-4">
              {error}
            </div>
          )}

          {activeTab === 'overview' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">League Overview</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">League Information</h3>
                  
                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          League Name
                        </label>
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Description
                        </label>
                        <textarea
                          value={editForm.description}
                          onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                          rows={3}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          League Image
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                        />
                        {imagePreview && (
                          <div className="mt-2">
                            <Image 
                              src={imagePreview} 
                              alt="Preview" 
                              width={80} 
                              height={80} 
                              className="rounded"
                            />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={saveChanges}
                          disabled={saving}
                          className="bg-neon-green text-black px-4 py-2 rounded hover:bg-green-400 disabled:opacity-50"
                        >
                          {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                          onClick={cancelEditing}
                          disabled={saving}
                          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-500 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p><strong>Name:</strong> {league.name}</p>
                      <p><strong>Description:</strong> {league.description || 'No description'}</p>
                      <p><strong>Created:</strong> {new Date(league.created_at).toLocaleDateString()}</p>
                      <p><strong>Status:</strong> {league.setup_completed ? 'Active' : 'Setup Required'}</p>
                      
                      <button
                        onClick={startEditing}
                        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                      >
                        Edit League Settings
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Quick Stats</h3>
                  <div className="space-y-2">
                    <p><strong>Teams:</strong> {teams.length}</p>
                    <p><strong>Members:</strong> {users.length}</p>
                    <p><strong>Assigned Teams:</strong> {teams.filter(t => t.is_assigned).length}</p>
                    <p><strong>Available Teams:</strong> {teams.filter(t => !t.is_assigned).length}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'teams' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Team Management</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                       <th className="text-left py-2 px-1">Team</th>
                      <th className="text-left py-2 px-1">Abbreviation</th>
                      <th className="text-left py-2 px-1">Status</th>
                      <th className="text-left py-2 px-1">Assigned User</th>
                      <th className="text-left py-2 px-1">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teams.map((team) => (
                      <tr key={team.team_id || team.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                        <td className="py-2 px-1 text-white">{team.name}</td>
                        <td className="py-2 px-1 text-white">{team.abbreviation}</td>
                        <td className="py-2 px-1">
                          <span className={`px-2 py-1 rounded text-xs ${
                            team.is_assigned ? 'bg-green-600' : 'bg-gray-600'
                          }`}>
                            {team.is_assigned ? 'Assigned' : 'Available'}
                          </span>
                        </td>
                        <td className="py-2 px-1 text-white">
                          {team.assigned_user || 'Unassigned'}
                        </td>
                        <td className="py-2 px-1">
                          {!team.is_assigned && (
                            <button
                              onClick={() => {
                                const email = prompt('Enter user email to assign:')
                                if (email) {
                                  assignTeam(team.team_id || team.id, email)
                                }
                              }}
                              className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs"
                            >
                              Assign
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">League Members</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-2 px-1">Name</th>
                      <th className="text-left py-2 px-1">Email</th>
                      <th className="text-left py-2 px-1">Role</th>
                      <th className="text-left py-2 px-1">Team</th>
                      <th className="text-left py-2 px-1">Joined</th>
                      <th className="text-left py-2 px-1">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                        <td className="py-2 px-1 text-white">
                          {user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'N/A'}
                        </td>
                        <td className="py-2 px-1 text-white">{user.email}</td>
                        <td className="py-2 px-1">
                          <span className={`px-2 py-1 rounded text-xs ${
                            user.role === 'commissioner' ? 'bg-red-600' :
                            user.role === 'co-commissioner' ? 'bg-orange-600' :
                            'bg-gray-600'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-2 px-1 text-white">
                          <select
                            className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm"
                            value={user.team_id ?? ''}
                            onChange={async (e) => {
                              const raw = e.target.value
                              try {
                                setError(null)
                                if (raw) {
                                  // Prefer external string team_id; fallback to numeric id
                                  const team = teams.find(t => String(t.id) === raw || String((t as any).team_id ?? '') === raw)
                                  const teamIdentifier = (team && (team as any).team_id) ? String((team as any).team_id) : Number(raw)
                                  await assignTeamToUserFlexible(leagueId, { userId: user.id, teamIdentifier })
                                  setSuccessMessage('Team assigned successfully!')
                                } else {
                                  await unassignTeam(leagueId, user.id)
                                  setSuccessMessage('Team unassigned')
                                }
                                const leagueData: LeagueSettingsResponse = await getLeagueSettings(leagueId)
                                setTeams(leagueData.teams || [])
                                setUsers(leagueData.members || [])
                                setTimeout(() => setSuccessMessage(null), 3000)
                              } catch (err: unknown) {
                                console.error('Failed to update team assignment:', err)
                                const message = err instanceof Error ? err.message : 'Failed to update team assignment'
                                setError(message)
                              }
                            }}
                          >
                            <option value="">Unassigned</option>
                            {teams.map((t) => (
                              <option key={t.id} value={String((t as any).team_id ?? t.id)}>
                                {t.city} {t.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-1 text-white">
                          {user.joined_at ? new Date(user.joined_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-2 px-1">
                          {user.role !== 'commissioner' && (
                            <button
                              onClick={() => removeUser(user.email)}
                              className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs"
                            >
                              Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                      <div className="space-y-1">
                        <div className="text-xs text-gray-300">Public invite URL (handoff):</div>
                        <div className="flex items-center space-x-2">
                          <code className="bg-gray-600 px-2 py-1 rounded text-sm">
                            {`${API_BASE}/invites/${league.invite_code}/go`}
                          </code>
                          <button
                            onClick={() => copyToClipboard(`${API_BASE}/invites/${league.invite_code}/go`)}
                            className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-xs"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'companion' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Companion App Setup</h2>
              
              {copyMessage && (
                <div className="bg-green-600 text-white px-4 py-2 rounded mb-4">
                  {copyMessage}
                </div>
              )}
              
              {companionApp ? (
                <div className="space-y-6">
                  <div className="companion-app-section">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Companion App Ingestion URL:
                    </label>
                    <div className="url-input-container flex gap-3 items-center">
                      <input 
                        type="text" 
                        value={companionAppUrl || 'Loading...'} 
                        readOnly 
                        className="url-input flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                        placeholder="https://api.couchlytics.com/companion/ingest"
                      />
                      <button 
                        onClick={() => copyToClipboard(companionAppUrl)}
                        className="copy-button bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!companionAppUrl}
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  
                  <div className="setup-instructions bg-gray-700 rounded-lg p-4">
                    <h4 className="text-lg font-semibold mb-3">Setup Instructions:</h4>
                    <ol className="space-y-2 text-gray-300">
                      {setupInstructions?.step1 && (
                        <li className="flex items-start">
                          <span className="bg-neon-green text-black rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">1</span>
                          <span>{setupInstructions.step1}</span>
                        </li>
                      )}
                      {setupInstructions?.step2 && (
                        <li className="flex items-start">
                          <span className="bg-neon-green text-black rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">2</span>
                          <span>{setupInstructions.step2}</span>
                        </li>
                      )}
                      {setupInstructions?.step3 && (
                        <li className="flex items-start">
                          <span className="bg-neon-green text-black rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">3</span>
                          <span>{setupInstructions.step3}</span>
                        </li>
                      )}
                    </ol>
                  </div>
                  
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                    <h4 className="text-lg font-semibold mb-2 text-blue-300">League Information</h4>
                    <div className="space-y-1 text-sm text-gray-300">
                      <p><strong>League ID:</strong> {companionApp.league_id}</p>
                      <p><strong>League Name:</strong> {companionApp.league_name}</p>
                      <p><strong>Ingestion Endpoint:</strong> {companionApp.ingestion_endpoint}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400">Companion app information not available</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 