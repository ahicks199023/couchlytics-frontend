'use client'

import { useState, useEffect, useCallback } from 'react'
import { API_BASE } from '@/lib/config'
import Comment from './Comment'
import CommentForm from './CommentForm'

interface CommentUser {
  email: string
  display_name: string
}

interface CommentData {
  id: number
  announcement_id: number
  user_id: number
  parent_comment_id: number | null
  content: string
  created_at: string
  updated_at: string
  is_edited: boolean
  edited_at: string | null
  is_deleted: boolean
  user: CommentUser
  replies?: CommentData[]
  reply_count: number
}

interface CommentsResponse {
  comments: CommentData[]
  total: number
  limit: number
  offset: number
  has_more: boolean
}

interface CommentsListProps {
  announcementId: number
  leagueId: string
  className?: string
}

export default function CommentsList({ 
  announcementId, 
  leagueId, 
  className = "" 
}: CommentsListProps) {
  const [comments, setComments] = useState<CommentData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [limit] = useState(50)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const fetchComments = useCallback(async (newOffset = 0) => {
    try {
      setLoading(true)
      const response = await fetch(
        `${API_BASE}/leagues/${leagueId}/announcements/${announcementId}/comments?limit=${limit}&offset=${newOffset}`,
        { 
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        }
      )
      
      if (!response.ok) {
        if (response.status === 404) {
          // No comments yet, this is normal
          setComments([])
          setHasMore(false)
          setOffset(0)
          return
        }
        throw new Error(`Failed to fetch comments: ${response.status}`)
      }
      
      const data: CommentsResponse = await response.json()
      
      if (newOffset === 0) {
        setComments(data.comments || [])
      } else {
        setComments(prev => [...prev, ...(data.comments || [])])
      }
      
      setHasMore(data.has_more || false)
      setOffset(newOffset + (data.comments?.length || 0))
    } catch (error) {
      console.error('Error fetching comments:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch comments')
    } finally {
      setLoading(false)
    }
  }, [leagueId, announcementId, limit])
  
  const loadMore = () => {
    if (!loading && hasMore) {
      fetchComments(offset)
    }
  }
  
  const handleCommentUpdate = () => {
    // Refresh comments from the beginning
    fetchComments(0)
  }
  
  const handleCommentDelete = (commentId: number) => {
    setComments(prev => removeCommentById(prev, commentId))
  }
  
  const handleAddComment = async (content: string) => {
    try {
      setIsSubmitting(true)
      const response = await fetch(`${API_BASE}/leagues/${leagueId}/announcements/${announcementId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content })
      })
      
      if (response.ok) {
        // Refresh comments to show the new one
        fetchComments(0)
      } else {
        throw new Error('Failed to add comment')
      }
    } catch (error) {
      console.error('Error adding comment:', error)
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Remove comment by ID (including nested replies)
  const removeCommentById = (comments: CommentData[], commentId: number): CommentData[] => {
    return comments.map(comment => {
      if (comment.id === commentId) {
        return null // Remove this comment
      }
      
      if (comment.replies && comment.replies.length > 0) {
        const filteredReplies = comment.replies.filter(reply => reply.id !== commentId)
        return {
          ...comment,
          replies: filteredReplies,
          reply_count: filteredReplies.length
        }
      }
      
      return comment
    }).filter((comment): comment is CommentData => comment !== null) // Remove null comments
  }
  
  useEffect(() => {
    fetchComments(0)
  }, [announcementId, leagueId, fetchComments])
  
  if (error) {
    return (
      <div className={`comments-section ${className}`}>
        <div className="error-message">
          <p>Error loading comments: {error}</p>
          <button 
            onClick={() => fetchComments(0)}
            className="retry-btn"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className={`comments-section ${className}`}>
      <div className="comments-header">
        <h3 className="comments-title">
          💬 Comments ({comments.length})
        </h3>
      </div>
      
      <CommentForm
        onSubmit={handleAddComment}
        placeholder="Share your thoughts on this announcement..."
        submitText="Post Comment"
        isSubmitting={isSubmitting}
        className="main-comment-form"
      />
      
      {loading && comments.length === 0 ? (
        <div className="loading-comments">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading comments...</p>
        </div>
      ) : comments.length > 0 ? (
        <div className="comments-list">
          {comments.map(comment => (
            <Comment
              key={comment.id}
              comment={comment}
              announcementId={announcementId}
              leagueId={leagueId}
              onCommentUpdate={handleCommentUpdate}
              onCommentDelete={handleCommentDelete}
            />
          ))}
        </div>
      ) : (
        <div className="no-comments">
          <p className="text-gray-500 text-center py-8">
            No comments yet. Be the first to share your thoughts!
          </p>
        </div>
      )}
      
      {hasMore && (
        <div className="load-more-container">
          <button 
            onClick={loadMore} 
            disabled={loading}
            className="load-more-btn"
          >
            {loading ? 'Loading...' : 'Load More Comments'}
          </button>
        </div>
      )}
    </div>
  )
}
