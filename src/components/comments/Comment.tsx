'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { UserRole } from '@/types/user'
import { API_BASE } from '@/lib/config'
import CommentForm from './CommentForm'

interface CommentUser {
  email: string
  display_name: string
}



interface CommentProps {
  comment: {
    id: number
    announcement_id: number | string
    user_id: number
    parent_comment_id: number | null
    content: string
    created_at: string
    updated_at: string
    is_edited: boolean
    edited_at: string | null
    is_deleted: boolean
    user: CommentUser
    replies?: unknown[]
    reply_count: number
  }
  announcementId: number | string
  leagueId: string
  onCommentUpdate: () => void
  onCommentDelete: (commentId: number) => void
  isReply?: boolean
  isGameComment?: boolean
}

export default function Comment({ 
  comment, 
  announcementId, 
  leagueId, 
  onCommentUpdate, 
  onCommentDelete,
  isReply = false,
  isGameComment = false
}: CommentProps) {
  const { user, hasRole } = useAuth()
  const [isReplying, setIsReplying] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [showReplies, setShowReplies] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Check permissions
  const canEditComment = user && comment.user_id === user.id
  const canDeleteComment = user && (
    comment.user_id === user.id || 
    hasRole(UserRole.ADMIN) || 
    hasRole(UserRole.COMMISSIONER) || 
    hasRole(UserRole.SUPER_ADMIN)
  )
  
  const handleReply = async (content: string) => {
    try {
      setIsSubmitting(true)
      const endpoint = isGameComment 
        ? `${API_BASE}/leagues/${leagueId}/games/${announcementId}/comments`
        : `${API_BASE}/leagues/${leagueId}/announcements/${announcementId}/comments`
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          content,
          parent_comment_id: comment.id
        })
      })
      
      if (response.ok) {
        setIsReplying(false)
        onCommentUpdate()
      } else {
        throw new Error('Failed to add reply')
      }
    } catch (error) {
      console.error('Error adding reply:', error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleEdit = async () => {
    try {
      setIsSubmitting(true)
      const endpoint = isGameComment 
        ? `${API_BASE}/leagues/${leagueId}/games/${announcementId}/comments/${comment.id}`
        : `${API_BASE}/leagues/${leagueId}/announcements/${announcementId}/comments/${comment.id}`
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: editContent })
      })
      
      if (response.ok) {
        setIsEditing(false)
        onCommentUpdate()
      } else {
        throw new Error('Failed to update comment')
      }
    } catch (error) {
      console.error('Error updating comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return
    
    try {
      setIsSubmitting(true)
      const endpoint = isGameComment 
        ? `${API_BASE}/leagues/${leagueId}/games/${announcementId}/comments/${comment.id}`
        : `${API_BASE}/leagues/${leagueId}/announcements/${announcementId}/comments/${comment.id}`
      
      const response = await fetch(endpoint, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (response.ok) {
        onCommentDelete(comment.id)
      } else {
        throw new Error('Failed to delete comment')
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const formatRelativeTime = (timestamp: string) => {
    const commentTime = new Date(timestamp)
    
    // Show full timestamp in user's local timezone
    return commentTime.toLocaleString('en-US', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    })
  }
  
  return (
    <div className={`comment-card ${isReply ? 'comment-reply' : ''}`}>
      <div className="comment-header">
        <div className="user-info">
          <span className="user-avatar">
            {comment.user.display_name?.[0] || comment.user.email?.[0] || 'U'}
          </span>
          <span className="user-name">
            {comment.user.display_name || comment.user.email}
          </span>
          <span className="timestamp">
            {formatRelativeTime(comment.created_at)}
          </span>
          {comment.is_edited && (
            <span className="edited-badge">(edited)</span>
          )}
        </div>
        
        <div className="comment-actions">
          <button 
            onClick={() => setIsReplying(!isReplying)}
            className="action-btn reply-btn"
            disabled={isSubmitting}
          >
            Reply
          </button>
          {canEditComment && (
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="action-btn edit-btn"
              disabled={isSubmitting}
            >
              Edit
            </button>
          )}
          {canDeleteComment && (
            <button 
              onClick={handleDelete}
              className="action-btn delete-btn"
              disabled={isSubmitting}
            >
              Delete
            </button>
          )}
        </div>
      </div>
      
      <div className="comment-content">
        {isEditing ? (
          <div className="edit-form">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={3}
              className="edit-textarea"
              disabled={isSubmitting}
            />
            <div className="edit-actions">
              <button 
                onClick={handleEdit}
                className="save-btn"
                disabled={!editContent.trim() || isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
              <button 
                onClick={() => setIsEditing(false)}
                className="cancel-btn"
                disabled={isSubmitting}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="comment-text">{comment.content}</p>
        )}
      </div>
      
      {isReplying && (
        <div className="reply-form-container">
          <CommentForm
            onSubmit={handleReply}
            placeholder="Write a reply..."
            submitText="Reply"
            isSubmitting={isSubmitting}
            className="reply-form"
          />
        </div>
      )}
      
      {comment.replies && comment.replies.length > 0 && (
        <div className="replies-section">
          <button 
            onClick={() => setShowReplies(!showReplies)}
            className="toggle-replies-btn"
          >
            {showReplies ? 'Hide' : 'Show'} {comment.reply_count} replies
          </button>
          
          {showReplies && (
            <div className="replies-list">
                             {comment.replies.map((reply) => {
                 const replyData = reply as Record<string, unknown>
                 return (
                   <Comment
                     key={replyData.id as number}
                     comment={{
                       id: replyData.id as number,
                       announcement_id: announcementId,
                       user_id: replyData.user_id as number,
                       parent_comment_id: replyData.parent_comment_id as number | null,
                       content: replyData.content as string,
                       created_at: replyData.created_at as string,
                       updated_at: replyData.updated_at as string,
                       is_edited: replyData.is_edited as boolean,
                       edited_at: replyData.edited_at as string | null,
                       is_deleted: replyData.is_deleted as boolean,
                       user: replyData.user as CommentUser,
                       replies: [],
                       reply_count: 0
                     }}
                     announcementId={announcementId}
                     leagueId={leagueId}
                     onCommentUpdate={onCommentUpdate}
                     onCommentDelete={onCommentDelete}
                     isReply={true}
                     isGameComment={isGameComment}
                   />
                 )
               })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
