'use client'

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

interface BoardCardProps {
  board: MessageBoard
  isSelected: boolean
  onClick: () => void
}

export default function BoardCard({ board, isSelected, onClick }: BoardCardProps) {
  const formatRelativeTime = (timestamp: string) => {
    const now = new Date()
    const activityTime = new Date(timestamp)
    const diffInSeconds = Math.floor((now.getTime() - activityTime.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`
    
    return activityTime.toLocaleDateString()
  }

  const getBoardIcon = (boardType: string) => {
    switch (boardType) {
      case 'general':
        return '💬'
      case 'announcements':
        return '📢'
      case 'trades':
        return '🔄'
      case 'game_threads':
        return '🏈'
      case 'rules':
        return '📋'
      default:
        return '💬'
    }
  }

  return (
    <div 
      className={`board-card ${isSelected ? 'active' : ''} ${board.commissioner_only ? 'commissioner-only' : ''}`}
      onClick={onClick}
    >
      <div className="board-header">
        <div className="board-icon">
          {getBoardIcon(board.board_type)}
        </div>
        <div className="board-info">
          <h3 className="board-name">{board.name}</h3>
          {board.commissioner_only && (
            <span className="commissioner-badge">Commissioner Only</span>
          )}
        </div>
      </div>
      
      <p className="board-description">{board.description}</p>
      
      <div className="board-stats">
        <div className="stat-item">
          <span className="stat-label">Threads:</span>
          <span className="stat-value">{board.stats.thread_count}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Posts:</span>
          <span className="stat-value">{board.stats.post_count}</span>
        </div>
        {board.stats.latest_activity && (
          <div className="stat-item">
            <span className="stat-label">Activity:</span>
            <span className="stat-value">{formatRelativeTime(board.stats.latest_activity)}</span>
          </div>
        )}
      </div>
      
      {board.commissioner_only && (
        <div className="permission-indicator">
          <span className="permission-icon">👑</span>
          <span className="permission-text">Commissioner Only</span>
        </div>
      )}
    </div>
  )
}
