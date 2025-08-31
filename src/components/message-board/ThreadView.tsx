'use client'

import { useState, useEffect, useCallback } from 'react'
import { API_BASE } from '@/lib/config'
import PostCard from './PostCard'
import CreatePostForm from './CreatePostForm'
import Pagination from '../common/Pagination'
import { useAuth } from '@/contexts/AuthContext'
import { UserRole } from '@/types/user'

interface Thread {
  id: number
  title: string
  is_locked: boolean
  is_pinned: boolean
  thread_type: string
  author: {
    email: string
    name: string
  }
  created_at: string
  event_info?: {
    event_date: string
    event_location: string
    event_type: string
  }
}

interface Post {
  id: number
  content: string
  author: {
    email: string
    name: string
  }
  created_at: string
  updated_at: string
  is_edited: boolean
}

interface ThreadViewProps {
  leagueId: string
  threadId: string
  onBack: () => void
}

export default function ThreadView({ leagueId, threadId, onBack }: ThreadViewProps) {
  const { user, hasRole } = useAuth()
  const [thread, setThread] = useState<Thread | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 50,
    total: 0,
    pages: 0
  })
  // const [showCreatePost, setShowCreatePost] = useState(false)

  // Check if user can moderate
  const canModerate = user && (
    hasRole(UserRole.ADMIN) || 
    hasRole(UserRole.COMMISSIONER) || 
    hasRole(UserRole.SUPER_ADMIN)
  )

  // Fetch thread and posts
  const fetchThreadData = useCallback(async (page = 1) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(
        `${API_BASE}/leagues/${leagueId}/threads/${threadId}/posts?page=${page}&per_page=50`,
        {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch thread: ${response.status}`)
      }

      const data = await response.json()
      setThread(data.thread)
      setPosts(data.posts || [])
      setPagination(data.pagination || {
        page: 1,
        per_page: 50,
        total: 0,
        pages: 0
      })
    } catch (error) {
      console.error('Error fetching thread:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch thread')
    } finally {
      setLoading(false)
    }
  }, [leagueId, threadId])

  // Handle post creation
  const handlePostCreated = useCallback(() => {
    fetchThreadData(pagination.page)
  }, [pagination.page, fetchThreadData])

  // Handle post deletion
  const handlePostDeleted = (postId: number) => {
    setPosts(prev => prev.filter(post => post.id !== postId))
  }

  // Handle thread moderation
  const handlePinThread = async () => {
    if (!thread) return
    
    try {
      const response = await fetch(`${API_BASE}/leagues/${leagueId}/threads/${threadId}/pin`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_pinned: !thread.is_pinned })
      })

      if (response.ok) {
        setThread(prev => prev ? { ...prev, is_pinned: !prev.is_pinned } : null)
      }
    } catch (error) {
      console.error('Error pinning thread:', error)
    }
  }

  const handleLockThread = async () => {
    if (!thread) return
    
    try {
      const response = await fetch(`${API_BASE}/leagues/${leagueId}/threads/${threadId}/lock`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_locked: !thread.is_locked })
      })

      if (response.ok) {
        setThread(prev => prev ? { ...prev, is_locked: !prev.is_locked } : null)
      }
    } catch (error) {
      console.error('Error locking thread:', error)
    }
  }

  // Handle pagination
  const handlePageChange = (page: number) => {
    fetchThreadData(page)
  }

  // Initial load
  useEffect(() => {
    fetchThreadData(1)
  }, [leagueId, threadId, fetchThreadData])

  if (loading && !thread) {
    return (
      <div className="thread-loading">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-400 text-center">Loading thread...</p>
      </div>
    )
  }

  if (error && !thread) {
    return (
      <div className="thread-error">
        <div className="error-message">
          <p>Error loading thread: {error}</p>
          <button
            onClick={() => fetchThreadData(1)}
            className="retry-btn"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!thread) {
    return (
      <div className="thread-not-found">
        <div className="empty-state">
          <div className="empty-icon">❓</div>
          <h3>Thread Not Found</h3>
          <p>The thread you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <button onClick={onBack} className="back-btn">
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="thread-view">
      <div className="thread-header">
        <div className="header-content">
          <button onClick={onBack} className="back-btn">
            ← Back to Threads
          </button>
          
          <div className="thread-title-section">
            <h1 className="thread-title">
              {thread.title}
              {thread.is_pinned && <span className="pin-badge">📌</span>}
              {thread.is_locked && <span className="lock-badge">🔒</span>}
            </h1>
            
            <div className="thread-meta">
              <span className="thread-author">by {thread.author.name}</span>
              <span className="thread-date">
                {new Date(thread.created_at).toLocaleDateString()}
              </span>
              <span className="thread-type">{thread.thread_type}</span>
            </div>
          </div>
        </div>
        
        {canModerate && (
          <div className="moderation-actions">
            <button
              onClick={handlePinThread}
              className={`mod-btn ${thread.is_pinned ? 'active' : ''}`}
              title={thread.is_pinned ? 'Unpin Thread' : 'Pin Thread'}
            >
              📌 {thread.is_pinned ? 'Unpin' : 'Pin'}
            </button>
            <button
              onClick={handleLockThread}
              className={`mod-btn ${thread.is_locked ? 'active' : ''}`}
              title={thread.is_locked ? 'Unlock Thread' : 'Lock Thread'}
            >
              🔒 {thread.is_locked ? 'Unlock' : 'Lock'}
            </button>
          </div>
        )}
      </div>

      {thread.event_info && (
        <div className="thread-event-banner">
          <div className="event-icon">📅</div>
          <div className="event-info">
            <div className="event-type">{thread.event_info.event_type}</div>
            <div className="event-details">
              {new Date(thread.event_info.event_date).toLocaleDateString()}
              {thread.event_info.event_location && (
                <span> • {thread.event_info.event_location}</span>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="posts-container">
        {posts.length === 0 ? (
          <div className="no-posts">
            <div className="empty-state">
              <div className="empty-icon">💬</div>
              <h3>No Posts Yet</h3>
              <p>Be the first to reply to this thread!</p>
            </div>
          </div>
        ) : (
          <div className="posts-list">
            {posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onDelete={handlePostDeleted}
                canModerate={canModerate || false}
              />
            ))}
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="posts-pagination">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>

      {!thread.is_locked && (
        <div className="post-form-section">
          <CreatePostForm
            leagueId={leagueId}
            threadId={threadId}
            onSuccess={handlePostCreated}
          />
        </div>
      )}

      {thread.is_locked && (
        <div className="thread-locked-message">
          <div className="locked-icon">🔒</div>
          <p>This thread is locked. No new posts can be added.</p>
        </div>
      )}
    </div>
  )
}
