'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { API_BASE } from '@/lib/config'
import GameThreadCard from './GameThreadCard'
import CreateGameThreadForm from './CreateGameThreadForm'
import { useAuth } from '@/contexts/AuthContext'
import { UserRole } from '@/types/user'

interface GameThread {
  id: number
  title: string
  content: string
  author: {
    email: string
    name: string
  }
  created_at: string
  last_activity_at: string
  post_count: number
  latest_post_date: string
  event_info: {
    event_date: string
    event_location: string
    event_type: string
  }
}

interface GameThreadsData {
  [week: string]: GameThread[]
}

interface GameThreadsProps {
  leagueId: string
}

export default function GameThreads({ leagueId }: GameThreadsProps) {
  const { user, hasRole } = useAuth()
  const router = useRouter()
  const [gameThreads, setGameThreads] = useState<GameThreadsData>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null)

  // Check if user can create game threads
  const canCreateGameThread = user && (
    hasRole(UserRole.ADMIN) || 
    hasRole(UserRole.COMMISSIONER) || 
    hasRole(UserRole.SUPER_ADMIN)
  )

  // Fetch game threads
  const fetchGameThreads = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`${API_BASE}/leagues/${leagueId}/game-threads`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch game threads: ${response.status}`)
      }

      const data = await response.json()
      setGameThreads(data.game_threads || {})
      
      // Auto-select first week if none selected
      if (!selectedWeek && data.game_threads) {
        const weeks = Object.keys(data.game_threads)
        if (weeks.length > 0) {
          setSelectedWeek(weeks[0])
        }
      }
    } catch (error) {
      console.error('Error fetching game threads:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch game threads')
    } finally {
      setLoading(false)
    }
  }, [leagueId, selectedWeek])

  // Handle game thread creation
  const handleGameThreadCreated = useCallback(() => {
    fetchGameThreads()
    setShowCreateForm(false)
  }, [fetchGameThreads])

  // Handle game thread navigation
  const handleGameThreadClick = useCallback((thread: GameThread) => {
    router.push(`/leagues/${leagueId}/threads/${thread.id}`)
  }, [router, leagueId])

  // Initial load
  useEffect(() => {
    fetchGameThreads()
  }, [leagueId, fetchGameThreads])

  if (loading && Object.keys(gameThreads).length === 0) {
    return (
      <div className="game-threads-loading">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-400 text-center">Loading game threads...</p>
      </div>
    )
  }

  if (error && Object.keys(gameThreads).length === 0) {
    return (
      <div className="game-threads-error">
        <div className="error-message">
          <p>Error loading game threads: {error}</p>
          <button
            onClick={fetchGameThreads}
            className="retry-btn"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const weeks = Object.keys(gameThreads).sort((a, b) => {
    // Sort weeks by extracting week number and year
    const weekA = a.match(/Week (\d+) (\d+)/)
    const weekB = b.match(/Week (\d+) (\d+)/)
    
    if (!weekA || !weekB) return 0
    
    const yearA = parseInt(weekA[2])
    const yearB = parseInt(weekB[2])
    const weekNumA = parseInt(weekA[1])
    const weekNumB = parseInt(weekB[1])
    
    if (yearA !== yearB) return yearB - yearA // Newer years first
    return weekNumB - weekNumA // Higher week numbers first
  })

  return (
    <div className="game-threads">
      <div className="game-threads-header">
        <div className="header-content">
          <h1 className="page-title">Game Threads</h1>
          <p className="page-description">
            Weekly game discussions and live game threads
          </p>
        </div>
        
        {canCreateGameThread && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="create-game-thread-btn"
          >
            + Create Game Thread
          </button>
        )}
      </div>

      {weeks.length === 0 ? (
        <div className="no-game-threads">
          <div className="empty-state">
            <div className="empty-icon">🏈</div>
            <h3>No Game Threads Yet</h3>
            <p>Game threads will appear here as the season progresses.</p>
            {canCreateGameThread && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="create-first-game-thread-btn"
              >
                Create First Game Thread
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="game-threads-content">
          {/* Week Navigation */}
          <div className="week-navigation">
            <div className="week-tabs">
              {weeks.map(week => (
                <button
                  key={week}
                  className={`week-tab ${selectedWeek === week ? 'active' : ''}`}
                  onClick={() => setSelectedWeek(week)}
                >
                  {week}
                  <span className="thread-count">
                    {gameThreads[week]?.length || 0}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Game Threads for Selected Week */}
          {selectedWeek && gameThreads[selectedWeek] && (
            <div className="week-threads">
              <div className="week-header">
                <h2>{selectedWeek}</h2>
                <span className="thread-count">
                  {gameThreads[selectedWeek].length} game thread{gameThreads[selectedWeek].length !== 1 ? 's' : ''}
                </span>
              </div>
              
              <div className="game-threads-grid">
                {gameThreads[selectedWeek].map(thread => (
                  <GameThreadCard
                    key={thread.id}
                    thread={thread}
                    onClick={() => handleGameThreadClick(thread)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Game Thread Modal */}
      {showCreateForm && (
        <CreateGameThreadForm
          leagueId={leagueId}
          onClose={() => setShowCreateForm(false)}
          onSuccess={handleGameThreadCreated}
        />
      )}
    </div>
  )
}
