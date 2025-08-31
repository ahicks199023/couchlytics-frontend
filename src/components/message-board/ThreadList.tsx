'use client'

import { useState } from 'react'
import ThreadCard from './ThreadCard'
import CreateThreadForm from './CreateThreadForm'
import Pagination from '../common/Pagination'

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

interface ThreadListProps {
  board: MessageBoard
  threads: Thread[]
  loading: boolean
  pagination: {
    page: number
    per_page: number
    total: number
    pages: number
  }
  onThreadClick: (thread: Thread) => void
  onPageChange: (page: number) => void
  onThreadCreated: () => void
}

export default function ThreadList({
  board,
  threads,
  loading,
  pagination,
  onThreadClick,
  onPageChange,
  onThreadCreated
}: ThreadListProps) {
  const [showCreateThread, setShowCreateThread] = useState(false)

  const handleCreateThread = () => {
    setShowCreateThread(true)
  }

  const handleThreadCreated = () => {
    setShowCreateThread(false)
    onThreadCreated()
  }

  if (loading) {
    return (
      <div className="threads-loading">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-400 text-center">Loading threads...</p>
      </div>
    )
  }

  return (
    <div className="threads-list">
      <div className="threads-header">
        <div className="threads-count">
          {pagination.total > 0 ? (
            <span>Showing {threads.length} of {pagination.total} threads</span>
          ) : (
            <span>No threads yet</span>
          )}
        </div>
        
        <button
          onClick={handleCreateThread}
          className="create-thread-btn"
          disabled={board.commissioner_only}
        >
          + New Thread
        </button>
      </div>

      {threads.length === 0 ? (
        <div className="no-threads">
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>No Threads Yet</h3>
            <p>Be the first to start a discussion in this board!</p>
            <button
              onClick={handleCreateThread}
              className="create-first-thread-btn"
              disabled={board.commissioner_only}
            >
              Create First Thread
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="threads-grid">
            {/* Pinned threads first */}
            {threads
              .filter(thread => thread.is_pinned)
              .map(thread => (
                <ThreadCard
                  key={thread.id}
                  thread={thread}
                  onClick={() => onThreadClick(thread)}
                />
              ))}
            
            {/* Regular threads */}
            {threads
              .filter(thread => !thread.is_pinned)
              .map(thread => (
                <ThreadCard
                  key={thread.id}
                  thread={thread}
                  onClick={() => onThreadClick(thread)}
                />
              ))}
          </div>

          {pagination.pages > 1 && (
            <div className="threads-pagination">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.pages}
                onPageChange={onPageChange}
              />
            </div>
          )}
        </>
      )}

      {/* Create Thread Modal */}
      {showCreateThread && (
        <CreateThreadForm
          board={board}
          onClose={() => setShowCreateThread(false)}
          onSuccess={handleThreadCreated}
        />
      )}
    </div>
  )
}
