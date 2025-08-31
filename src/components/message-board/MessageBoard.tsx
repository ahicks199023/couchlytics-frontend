'use client'

import { useState, useEffect, useCallback } from 'react'
import { API_BASE } from '@/lib/config'
import BoardCard from './BoardCard'
import ThreadList from './ThreadList'
import CreateBoardForm from './CreateBoardForm'
import { useAuth } from '@/contexts/AuthContext'
import { UserRole } from '@/types/user'

interface BoardStats {
  thread_count: number
  post_count: number
  latest_activity: string
}

interface MessageBoard {
  id: number
  name: string
  description: string
  board_type: string
  display_order: number
  can_all_post: boolean
  commissioner_only: boolean
  created_at: string
  stats: BoardStats
}

interface Thread {
  id: number
  title: string
  content: string
  thread_type: string
  is_pinned: boolean
  is_locked: boolean
  author: {
    email: string
    name: string
  }
  created_at: string
  updated_at: string
  last_activity_at: string
  post_count: number
  latest_post_date: string
  event_info?: {
    event_date: string
    event_location: string
    event_type: string
  }
}

interface MessageBoardProps {
  leagueId: string
}

export default function MessageBoard({ leagueId }: MessageBoardProps) {
  const { user, hasRole } = useAuth()
  const [boards, setBoards] = useState<MessageBoard[]>([])
  const [selectedBoard, setSelectedBoard] = useState<MessageBoard | null>(null)
  const [threads, setThreads] = useState<Thread[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCreateBoard, setShowCreateBoard] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 20,
    total: 0,
    pages: 0
  })

  // Check if user can create boards
  const canCreateBoard = user && (
    hasRole(UserRole.ADMIN) || 
    hasRole(UserRole.COMMISSIONER) || 
    hasRole(UserRole.SUPER_ADMIN)
  )

  // Fetch message boards
  const fetchBoards = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`${API_BASE}/leagues/${leagueId}/message-boards`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch boards: ${response.status}`)
      }

      const data = await response.json()
      setBoards(data.boards || [])
      
      // Auto-select first board if none selected
      if (!selectedBoard && data.boards && data.boards.length > 0) {
        setSelectedBoard(data.boards[0])
      }
    } catch (error) {
      console.error('Error fetching boards:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch boards')
    } finally {
      setLoading(false)
    }
  }, [leagueId, selectedBoard])

  // Fetch threads for a board
  const fetchThreads = useCallback(async (boardId: number, page = 1) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(
        `${API_BASE}/leagues/${leagueId}/message-boards/${boardId}/threads?page=${page}&per_page=20`,
        {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch threads: ${response.status}`)
      }

      const data = await response.json()
      setThreads(data.threads || [])
      setPagination(data.pagination || {
        page: 1,
        per_page: 20,
        total: 0,
        pages: 0
      })
    } catch (error) {
      console.error('Error fetching threads:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch threads')
    } finally {
      setLoading(false)
    }
  }, [leagueId])

  // Handle board selection
  const handleBoardSelect = (board: MessageBoard) => {
    setSelectedBoard(board)
    fetchThreads(board.id, 1)
  }

  // Handle thread creation
  const handleThreadCreated = useCallback(() => {
    if (selectedBoard) {
      fetchThreads(selectedBoard.id, 1)
    }
  }, [selectedBoard, fetchThreads])

  // Handle board creation
  const handleBoardCreated = useCallback(() => {
    fetchBoards()
    setShowCreateBoard(false)
  }, [fetchBoards])

  // Handle pagination
  const handlePageChange = useCallback((page: number) => {
    if (selectedBoard) {
      fetchThreads(selectedBoard.id, page)
    }
  }, [selectedBoard, fetchThreads])

  // Initial load
  useEffect(() => {
    fetchBoards()
  }, [leagueId, fetchBoards])

  // Fetch threads when board is selected
  useEffect(() => {
    if (selectedBoard) {
      fetchThreads(selectedBoard.id, 1)
    }
  }, [selectedBoard, fetchThreads])

  if (loading && boards.length === 0) {
    return (
      <div className="message-board-loading">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-400 text-center">Loading message boards...</p>
      </div>
    )
  }

  if (error && boards.length === 0) {
    return (
      <div className="message-board-error">
        <div className="error-message">
          <p>Error loading message boards: {error}</p>
          <button
            onClick={fetchBoards}
            className="retry-btn"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="message-board">
      <div className="boards-sidebar">
        <div className="sidebar-header">
          <h2 className="sidebar-title">Message Boards</h2>
          {canCreateBoard && (
            <button
              onClick={() => setShowCreateBoard(true)}
              className="create-board-btn"
            >
              + New Board
            </button>
          )}
        </div>
        
        <div className="boards-list">
          {boards.map(board => (
            <BoardCard 
              key={board.id} 
              board={board} 
              isSelected={selectedBoard?.id === board.id}
              onClick={() => handleBoardSelect(board)}
            />
          ))}
        </div>
      </div>
      
      <div className="main-content">
        {selectedBoard ? (
          <div className="threads-container">
            <div className="container-header">
              <div className="board-info">
                <h1 className="board-title">{selectedBoard.name}</h1>
                <p className="board-description">{selectedBoard.description}</p>
                <div className="board-stats">
                  <span>{selectedBoard.stats.thread_count} threads</span>
                  <span>•</span>
                  <span>{selectedBoard.stats.post_count} posts</span>
                  {selectedBoard.stats.latest_activity && (
                    <>
                      <span>•</span>
                      <span>Last activity: {new Date(selectedBoard.stats.latest_activity).toLocaleDateString()}</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="container-actions">
                <button
                  onClick={() => {/* Navigate to create thread */}}
                  className="create-thread-btn"
                  disabled={selectedBoard.commissioner_only && !canCreateBoard}
                >
                  + New Thread
                </button>
              </div>
            </div>
            
                          <ThreadList 
                board={selectedBoard}
                threads={threads}
                loading={loading}
                pagination={pagination}
                onThreadClick={() => {/* Navigate to thread */}}
                onPageChange={handlePageChange}
                onThreadCreated={handleThreadCreated}
              />
          </div>
        ) : (
          <div className="no-board-selected">
            <div className="empty-state">
              <div className="empty-icon">💬</div>
              <h3>Select a Message Board</h3>
              <p>Choose a board from the sidebar to view its threads and discussions.</p>
            </div>
          </div>
        )}
      </div>

      {/* Create Board Modal */}
      {showCreateBoard && (
        <CreateBoardForm
          leagueId={leagueId}
          onClose={() => setShowCreateBoard(false)}
          onSuccess={handleBoardCreated}
        />
      )}
    </div>
  )
}
