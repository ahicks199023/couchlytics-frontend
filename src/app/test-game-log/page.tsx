'use client'

import GameLogTab from '@/components/GameLogTab'
import OzzieChat from '@/components/OzzieChat'

export default function TestGameLogPage() {
  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Game Log Test Page</h1>
        <p className="text-gray-400 mb-8">
          Testing the game log component with C.J. Stroud (QB) - Player ID: 551029279
        </p>
        
        <div className="bg-gray-900 rounded-lg p-6">
          <GameLogTab 
            playerId="551029279"
            leagueId="12335716" 
          />
        </div>
      </div>
      
      {/* Ozzie Chat Component */}
      <OzzieChat 
        leagueId="12335716"
        teamId="1" // You can update this with the actual team ID
      />
    </main>
  )
} 