'use client'

import { useState } from 'react'
import LeagueStandings from './LeagueStandings'
import TeamStats from './TeamStats'
import TeamSalaryCap from './TeamSalaryCap'
import PlayerStats from './PlayerStats'

interface AnalyticsDashboardProps {
  leagueId: string | number
  initialView?: 'standings' | 'team-stats' | 'salary-cap' | 'player-stats'
  teamId?: string | number
  playerId?: string | number
}

type ViewType = 'standings' | 'team-stats' | 'salary-cap' | 'player-stats'

export default function AnalyticsDashboard({ 
  leagueId, 
  initialView = 'standings',
  teamId,
  playerId 
}: AnalyticsDashboardProps) {
  const [currentView, setCurrentView] = useState<ViewType>(initialView)
  const [selectedTeamId, setSelectedTeamId] = useState<string | number | undefined>(teamId)
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | number | undefined>(playerId)

  const navigationItems = [
    { id: 'standings', label: 'League Standings', icon: '🏆' },
    { id: 'team-stats', label: 'Team Stats', icon: '📊' },
    { id: 'salary-cap', label: 'Salary Cap', icon: '💰' },
    { id: 'player-stats', label: 'Player Stats', icon: '👤' },
  ]

  const renderCurrentView = () => {
    switch (currentView) {
      case 'standings':
        return <LeagueStandings leagueId={leagueId} />
      
      case 'team-stats':
        if (!selectedTeamId) {
          return (
            <div className="text-center p-8">
              <p className="text-gray-400 mb-4">Please select a team to view stats</p>
              <div className="bg-gray-800/50 rounded-lg p-4 max-w-md mx-auto">
                <label className="block text-gray-300 mb-2">Team ID:</label>
                <input
                  type="number"
                  placeholder="Enter team ID"
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                  onChange={(e) => setSelectedTeamId(e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>
            </div>
          )
        }
        return <TeamStats leagueId={leagueId} teamId={selectedTeamId} />
      
      case 'salary-cap':
        if (!selectedTeamId) {
          return (
            <div className="text-center p-8">
              <p className="text-gray-400 mb-4">Please select a team to view salary cap</p>
              <div className="bg-gray-800/50 rounded-lg p-4 max-w-md mx-auto">
                <label className="block text-gray-300 mb-2">Team ID:</label>
                <input
                  type="number"
                  placeholder="Enter team ID"
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                  onChange={(e) => setSelectedTeamId(e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>
            </div>
          )
        }
        return <TeamSalaryCap leagueId={leagueId} teamId={selectedTeamId} />
      
      case 'player-stats':
        if (!selectedPlayerId) {
          return (
            <div className="text-center p-8">
              <p className="text-gray-400 mb-4">Please select a player to view stats</p>
              <div className="bg-gray-800/50 rounded-lg p-4 max-w-md mx-auto">
                <label className="block text-gray-300 mb-2">Player ID:</label>
                <input
                  type="number"
                  placeholder="Enter player ID"
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                  onChange={(e) => setSelectedPlayerId(e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>
            </div>
          )
        }
        return <PlayerStats leagueId={leagueId} playerId={selectedPlayerId} />
      
      default:
        return <LeagueStandings leagueId={leagueId} />
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation Header */}
      <div className="bg-gray-900/50 border-b border-gray-700 sticky top-0 z-10">
        <div className="p-4">
          <h1 className="text-2xl font-bold text-neon-green mb-4">Analytics Dashboard</h1>
          
          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-2">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id as ViewType)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  currentView === item.id
                    ? 'bg-neon-green text-black font-semibold'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>

          {/* Team/Player Selection */}
          {(currentView === 'team-stats' || currentView === 'salary-cap') && (
            <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
              <label className="block text-gray-300 mb-2">Current Team ID: {selectedTeamId || 'None'}</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Enter team ID"
                  className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded text-white"
                  value={selectedTeamId || ''}
                  onChange={(e) => setSelectedTeamId(e.target.value ? Number(e.target.value) : undefined)}
                />
                <button
                  onClick={() => setSelectedTeamId(undefined)}
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-white"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {currentView === 'player-stats' && (
            <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
              <label className="block text-gray-300 mb-2">Current Player ID: {selectedPlayerId || 'None'}</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Enter player ID"
                  className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded text-white"
                  value={selectedPlayerId || ''}
                  onChange={(e) => setSelectedPlayerId(e.target.value ? Number(e.target.value) : undefined)}
                />
                <button
                  onClick={() => setSelectedPlayerId(undefined)}
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-white"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6">
        {renderCurrentView()}
      </div>

      {/* Quick Actions Footer */}
      <div className="bg-gray-900/50 border-t border-gray-700 p-4">
        <div className="flex flex-wrap gap-4 text-sm text-gray-400">
          <div>
            <strong>League ID:</strong> {leagueId}
          </div>
          {selectedTeamId && (
            <div>
              <strong>Team ID:</strong> {selectedTeamId}
            </div>
          )}
          {selectedPlayerId && (
            <div>
              <strong>Player ID:</strong> {selectedPlayerId}
            </div>
          )}
          <div>
            <strong>API Base:</strong> https://api.couchlytics.com
          </div>
        </div>
      </div>
    </div>
  )
} 