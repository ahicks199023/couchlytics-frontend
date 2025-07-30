'use client'

import { useState } from 'react'
import TeamLogo from '@/components/TeamLogo'
import TeamBadge from '@/components/TeamBadge'
import { NFL_TEAMS } from '@/lib/team-config'

export default function TestTeamLogos() {
  const [selectedTeam, setSelectedTeam] = useState(NFL_TEAMS[0])

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Team Logo Test Page</h1>
        
        {/* Team Selector */}
        <div className="mb-8">
          <label className="block text-sm font-medium mb-2">Select Team:</label>
          <select 
            value={selectedTeam.id}
            onChange={(e) => {
              const team = NFL_TEAMS.find(t => t.id === parseInt(e.target.value))
              if (team) setSelectedTeam(team)
            }}
            className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
          >
            {NFL_TEAMS.map(team => (
              <option key={team.id} value={team.id}>
                {team.fullName}
              </option>
            ))}
          </select>
        </div>

        {/* Selected Team Display */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">{selectedTeam.fullName}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Logo (256x256)</h3>
              <TeamLogo teamId={selectedTeam.id} size="lg" variant="logo" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Helmet (512x512)</h3>
              <TeamLogo teamId={selectedTeam.id} size="xl" variant="helmet" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Initials</h3>
              <TeamLogo teamId={selectedTeam.id} size="lg" variant="initials" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Badge</h3>
              <TeamBadge teamId={selectedTeam.id} size="lg" variant="logo" showAbbr={true} />
            </div>
          </div>
        </div>

        {/* All Teams Grid */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-6">All 32 NFL Teams</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {NFL_TEAMS.map(team => (
              <div 
                key={team.id} 
                className="text-center p-3 bg-gray-700 rounded cursor-pointer hover:bg-gray-600 transition-colors"
                onClick={() => setSelectedTeam(team)}
              >
                <TeamLogo teamId={team.id} size="md" variant="logo" />
                <p className="text-xs mt-2 text-gray-300">{team.abbreviation}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Team Information */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Team Configuration Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Basic Info</h3>
              <p><strong>ID:</strong> {selectedTeam.id}</p>
              <p><strong>Name:</strong> {selectedTeam.name}</p>
              <p><strong>Full Name:</strong> {selectedTeam.fullName}</p>
              <p><strong>Abbreviation:</strong> {selectedTeam.abbreviation}</p>
              <p><strong>City:</strong> {selectedTeam.city}</p>
              <p><strong>Conference:</strong> {selectedTeam.conference}</p>
              <p><strong>Division:</strong> {selectedTeam.division}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Colors</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-6 h-6 rounded border border-gray-600"
                    style={{ backgroundColor: selectedTeam.colors.primary }}
                  ></div>
                  <span>Primary: {selectedTeam.colors.primary}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-6 h-6 rounded border border-gray-600"
                    style={{ backgroundColor: selectedTeam.colors.secondary }}
                  ></div>
                  <span>Secondary: {selectedTeam.colors.secondary}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-6 h-6 rounded border border-gray-600"
                    style={{ backgroundColor: selectedTeam.colors.accent }}
                  ></div>
                  <span>Accent: {selectedTeam.colors.accent}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-6 h-6 rounded border border-gray-600"
                    style={{ backgroundColor: selectedTeam.colors.text }}
                  ></div>
                  <span>Text: {selectedTeam.colors.text}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 