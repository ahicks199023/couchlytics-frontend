'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

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

interface PostCardProps {
  post: Post
  onDelete: (postId: number) => void
  canModerate: boolean
}

export default function PostCard({ post, onDelete, canModerate }: PostCardProps) {
  const { user } = useAuth()
  const [isDeleting, setIsDeleting] = useState(false)

  const formatRelativeTime = (timestamp: string) => {
    const now = new Date()
    const postTime = new Date(timestamp)
    const diffInSeconds = Math.floor((now.getTime() - postTime.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`
    
    return postTime.toLocaleDateString()
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return
    
    setIsDeleting(true)
    try {
      // The actual delete API call would be handled by the parent component
      onDelete(post.id)
    } catch (error) {
      console.error('Error deleting post:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const canDeletePost = user && (
    post.author.email === user.email || canModerate
  )

  return (
    <div className="post-card">
      <div className="post-header">
        <div className="post-author">
          <div className="author-avatar">
            {post.author.name?.[0] || post.author.email?.[0] || 'U'}
          </div>
          <div className="author-info">
            <span className="author-name">{post.author.name}</span>
            <span className="post-date">
              {formatRelativeTime(post.created_at)}
              {post.is_edited && <span className="edited-badge">(edited)</span>}
            </span>
          </div>
        </div>
        
        {canDeletePost && (
          <div className="post-actions">
            <button
              onClick={handleDelete}
              className="delete-btn"
              disabled={isDeleting}
              title="Delete post"
            >
              {isDeleting ? 'Deleting...' : '🗑️'}
            </button>
          </div>
        )}
      </div>
      
      <div className="post-content">
        <p className="post-text">{post.content}</p>
      </div>
    </div>
  )
}
