'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function TestSeasonSchedulePage() {
  const [leagueId, setLeagueId] = useState('12335716')

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Test Season Schedule</h1>
        
        <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Links</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                League ID:
              </label>
              <input
                type="text"
                value={leagueId}
                onChange={(e) => setLeagueId(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 dark:focus:ring-neon-green focus:border-transparent"
                placeholder="Enter League ID"
              />
            </div>
            
            <div className="flex flex-wrap gap-4">
              <Link
                href={`/leagues/${leagueId}/schedule`}
                className="px-4 py-2 bg-green-600 dark:bg-neon-green text-white rounded-md hover:bg-green-700 dark:hover:bg-green-500 transition-colors"
              >
                📅 View Season Schedule
              </Link>
              
              <Link
                href={`/leagues/${leagueId}/schedule/box-score/test-game-123`}
                className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-500 transition-colors"
              >
                📊 View Sample Box Score
              </Link>
              
              <Link
                href={`/leagues/${leagueId}`}
                className="px-4 py-2 bg-gray-600 dark:bg-gray-500 text-white rounded-md hover:bg-gray-700 dark:hover:bg-gray-400 transition-colors"
              >
                🏠 Back to League Home
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">API Endpoints to Test</h2>
          
          <div className="space-y-3 text-sm">
            <div className="bg-white dark:bg-gray-800 p-3 rounded">
              <div className="font-medium text-gray-900 dark:text-white">Complete Season Schedule</div>
              <div className="text-gray-600 dark:text-gray-400 font-mono">
                GET /leagues/{leagueId}/season-schedule
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-3 rounded">
              <div className="font-medium text-gray-900 dark:text-white">Week Schedule</div>
              <div className="text-gray-600 dark:text-gray-400 font-mono">
                GET /leagues/{leagueId}/season-schedule/week/1
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-3 rounded">
              <div className="font-medium text-gray-900 dark:text-white">Game Detail</div>
              <div className="text-gray-600 dark:text-gray-400 font-mono">
                GET /leagues/{leagueId}/season-schedule/game/game_123
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-3 rounded">
              <div className="font-medium text-gray-900 dark:text-white">Box Score</div>
              <div className="text-gray-600 dark:text-gray-400 font-mono">
                GET /leagues/{leagueId}/season-schedule/box-score/game_123
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Features Implemented</h2>
          
          <ul className="space-y-2 text-sm">
            <li className="flex items-center">
              <span className="text-green-600 dark:text-neon-green mr-2">✅</span>
              Complete Season Schedule page with filtering and pagination
            </li>
            <li className="flex items-center">
              <span className="text-green-600 dark:text-neon-green mr-2">✅</span>
              Box Score page for individual games
            </li>
            <li className="flex items-center">
              <span className="text-green-600 dark:text-neon-green mr-2">✅</span>
              Support for both completed games (actual stats) and scheduled games (projected stats)
            </li>
            <li className="flex items-center">
              <span className="text-green-600 dark:text-neon-green mr-2">✅</span>
              Team branding with colors and logos
            </li>
            <li className="flex items-center">
              <span className="text-green-600 dark:text-neon-green mr-2">✅</span>
              Weather information display
            </li>
            <li className="flex items-center">
              <span className="text-green-600 dark:text-neon-green mr-2">✅</span>
              Player statistics for completed games
            </li>
            <li className="flex items-center">
              <span className="text-green-600 dark:text-neon-green mr-2">✅</span>
              Dark/light mode support
            </li>
            <li className="flex items-center">
              <span className="text-green-600 dark:text-neon-green mr-2">✅</span>
              Responsive design for mobile and desktop
            </li>
            <li className="flex items-center">
              <span className="text-green-600 dark:text-neon-green mr-2">✅</span>
              Navigation links from league home page
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
} 