'use client'

import React, { useState, useEffect } from 'react'
import InvitationManagement from '../invitations/InvitationManagement'

interface LeagueSettingsWithInvitationsProps {
  leagueId: string
  isCommissioner: boolean
}

const LeagueSettingsWithInvitations: React.FC<LeagueSettingsWithInvitationsProps> = ({ 
  leagueId, 
  isCommissioner 
}) => {
  const [activeTab, setActiveTab] = useState('general')
  const [leagueData, setLeagueData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeagueData()
  }, [leagueId])

  const fetchLeagueData = async () => {
    try {
      const response = await fetch(`/api/leagues/${leagueId}`, {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      })
      const data = await response.json()
      if (data.success) {
        setLeagueData(data.league)
      }
    } catch (error) {
      console.error('Error fetching league data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="league-settings-container">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">League Settings</h1>
        <p className="text-gray-400">Manage your league configuration and members</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-700 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('general')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'general'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            General Settings
          </button>
          {isCommissioner && (
            <button
              onClick={() => setActiveTab('invitations')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'invitations'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              Invitations & Members
            </button>
          )}
          {isCommissioner && (
            <button
              onClick={() => setActiveTab('advanced')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'advanced'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              Advanced
            </button>
          )}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'general' && (
          <div className="general-settings">
            <h2 className="text-xl font-semibold mb-4">General Settings</h2>
            <div className="space-y-6">
              {/* League Name */}
              <div>
                <label className="block text-sm font-medium mb-2">League Name</label>
                <input
                  type="text"
                  value={leagueData?.name || ''}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md"
                  placeholder="Enter league name"
                />
              </div>

              {/* League Description */}
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={leagueData?.description || ''}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md"
                  rows={3}
                  placeholder="Enter league description"
                />
              </div>

              {/* Season Year */}
              <div>
                <label className="block text-sm font-medium mb-2">Season Year</label>
                <input
                  type="number"
                  value={leagueData?.season_year || ''}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md"
                  placeholder="2024"
                />
              </div>

              {/* Max Teams */}
              <div>
                <label className="block text-sm font-medium mb-2">Maximum Teams</label>
                <input
                  type="number"
                  value={leagueData?.max_teams || ''}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md"
                  placeholder="32"
                />
              </div>

              <div className="flex justify-end">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'invitations' && isCommissioner && (
          <div className="invitations-settings">
            <InvitationManagement leagueId={leagueId} />
          </div>
        )}

        {activeTab === 'advanced' && isCommissioner && (
          <div className="advanced-settings">
            <h2 className="text-xl font-semibold mb-4">Advanced Settings</h2>
            <div className="space-y-6">
              <div className="bg-yellow-900/20 border border-yellow-500 p-4 rounded-lg">
                <h3 className="font-semibold text-yellow-300 mb-2">⚠️ Danger Zone</h3>
                <p className="text-sm text-gray-300 mb-4">
                  These actions are irreversible. Please proceed with caution.
                </p>
                <div className="space-y-3">
                  <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm">
                    Delete League
                  </button>
                  <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm">
                    Reset League Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('authToken') || ''
}

export default LeagueSettingsWithInvitations
