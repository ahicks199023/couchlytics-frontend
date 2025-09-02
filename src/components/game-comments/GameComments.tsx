'use client'

import { useCallback } from 'react'
import CommentsList from '../comments/CommentsList'

interface GameCommentsProps {
  leagueId: string
  gameId: string
  gameTitle: string
}

export default function GameComments({ leagueId, gameId, gameTitle }: GameCommentsProps) {
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
      </div>
    </div>
  )
}
