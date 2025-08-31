'use client'

import { useState } from 'react'
import { API_BASE } from '@/lib/config'

interface CreatePostFormProps {
  leagueId: string
  threadId: string
  onSuccess: () => void
}

export default function CreatePostForm({ leagueId, threadId, onSuccess }: CreatePostFormProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE}/leagues/${leagueId}/threads/${threadId}/posts`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create post')
      }

      setContent('')
      onSuccess()
    } catch (error) {
      console.error('Error creating post:', error)
      setError(error instanceof Error ? error.message : 'Failed to create post')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="create-post-form">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="post-content">Your Reply</label>
          <textarea
            id="post-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your reply..."
            rows={4}
            maxLength={5000}
            disabled={loading}
            required
          />
          <div className="form-footer">
            <small className="character-count">
              {content.length}/5000 characters
            </small>
            {error && (
              <div className="error-message">
                <p>{error}</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="form-actions">
          <button
            type="submit"
            className="submit-btn"
            disabled={loading || !content.trim()}
          >
            {loading ? 'Posting...' : 'Post Reply'}
          </button>
        </div>
      </form>
    </div>
  )
}
