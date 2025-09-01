'use client'

import { useCallback } from 'react'
import { API_BASE } from '@/lib/config'
import { useAuth } from '@/contexts/AuthContext'
import CommentForm from '../comments/CommentForm'
import CommentsList from '../comments/CommentsList'

interface GameCommentsProps {
  leagueId: string
  gameId: string
  gameTitle: string
}

export default function GameComments({ leagueId, gameId, gameTitle }: GameCommentsProps) {
  const { user } = useAuth()

  // Update comment count when comments are added/removed
  const handleCommentCountChange = useCallback((count: number) => {
    // Comment count updated - could be used for display purposes
    console.log('Comment count:', count)
  }, [])

  return (
    <div className="game-comments">
      <div className="comments-header">
        <h2 className="comments-title">Game Comments</h2>
        <p className="comments-subtitle">{gameTitle}</p>
      </div>
      
      <div className="comments-content">
        <CommentsList
          leagueId={leagueId}
          announcementId={gameId} // Reuse announcement comments structure for games
          onCommentCountChange={handleCommentCountChange}
          isGameComment={true} // Flag to indicate this is for game comments
        />
        
        {user && (
          <div className="comment-form-section">
            <CommentForm
              onSubmit={async (content: string) => {
                try {
                  const response = await fetch(`${API_BASE}/leagues/${leagueId}/games/${gameId}/comments`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content })
                  })

                  if (!response.ok) {
                    throw new Error(`Failed to post comment: ${response.status}`)
                  }

                  // Refresh comments list
                  window.location.reload()
                } catch (error) {
                  console.error('Error posting comment:', error)
                  throw error
                }
              }}
              placeholder="Share your thoughts about this game..."
              submitText="Post Comment"
            />
          </div>
        )}
      </div>
    </div>
  )
}
