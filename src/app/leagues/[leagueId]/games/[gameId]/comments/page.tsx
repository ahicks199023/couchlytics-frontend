'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { API_BASE } from '@/lib/config'
import GameComments from '@/components/game-comments/GameComments'

interface GameData {
  game_id: string
  week: number
  home_team: {
    name: string
    abbreviation: string
  }
  away_team: {
    name: string
    abbreviation: string
  }
  score?: {
    home_score: number | null
    away_score: number | null
  }
}

export default function GameCommentsPage() {
  const { leagueId, gameId } = useParams()
  const router = useRouter()
  const [gameData, setGameData] = useState<GameData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchGameData = async () => {
      if (!leagueId || typeof leagueId !== 'string' || !gameId || typeof gameId !== 'string') {
        setError('Invalid league or game ID')
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`${API_BASE}/leagues/${leagueId}/games/${gameId}`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch game data: ${response.status}`)
        }

        const data = await response.json()
        setGameData(data.game)
      } catch (error) {
        console.error('Error fetching game data:', error)
        setError(error instanceof Error ? error.message : 'Failed to load game data')
      } finally {
        setLoading(false)
      }
    }

    fetchGameData()
  }, [leagueId, gameId])

  if (!leagueId || typeof leagueId !== 'string' || !gameId || typeof gameId !== 'string') {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-400 mb-2">Invalid Game</h2>
            <p className="text-red-300">League ID and Game ID are required to view game comments.</p>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            <span className="ml-4 text-gray-400">Loading game data...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error || !gameData) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-400 mb-2">Error Loading Game</h2>
            <p className="text-red-300">{error || 'Game data not found'}</p>
            <button
              onClick={() => router.back()}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Create game title
  const gameTitle = `${gameData.away_team.name} vs ${gameData.home_team.name} - Week ${gameData.week + 1}`
  
  // Add score if available
  const fullGameTitle = gameData.score && gameData.score.home_score !== null && gameData.score.away_score !== null
    ? `${gameTitle} (${gameData.score.away_score} - ${gameData.score.home_score})`
    : gameTitle

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-green-600 hover:text-green-400 transition-colors mb-4"
          >
            ← Back to Schedule
          </button>
          <h1 className="text-3xl font-bold text-white mb-2">Game Comments</h1>
          <p className="text-gray-400">{fullGameTitle}</p>
        </div>

        {/* Game Comments Component */}
        <GameComments
          leagueId={leagueId}
          gameId={gameId}
          gameTitle={fullGameTitle}
        />
      </div>
    </div>
  )
}
