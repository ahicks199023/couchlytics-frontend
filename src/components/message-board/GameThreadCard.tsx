'use client'

interface GameThread {
  id: number
  title: string
  content: string
  author: {
    email: string
    name: string
  }
  created_at: string
  last_activity_at: string
  post_count: number
  latest_post_date: string
  event_info: {
    event_date: string
    event_location: string
    event_type: string
  }
}

interface GameThreadCardProps {
  thread: GameThread
  onClick: () => void
}

export default function GameThreadCard({ thread, onClick }: GameThreadCardProps) {
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

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const isUpcoming = new Date(thread.event_info.event_date) > new Date()
  const isLive = !isUpcoming && new Date(thread.event_info.event_date) > new Date(Date.now() - 4 * 60 * 60 * 1000) // Within 4 hours

  return (
    <div className="game-thread-card" onClick={onClick}>
      <div className="game-thread-header">
        <div className="game-icon">🏈</div>
        <div className="game-info">
          <h3 className="game-title">{thread.title}</h3>
          <div className="game-meta">
            <span className="game-author">by {thread.author.name}</span>
            <span className="game-date">{formatRelativeTime(thread.created_at)}</span>
          </div>
        </div>
        <div className="game-status">
          {isUpcoming && <span className="status-badge upcoming">Upcoming</span>}
          {isLive && <span className="status-badge live">LIVE</span>}
        </div>
      </div>
      
      <div className="game-thread-content">
        <p className="game-excerpt">
          {thread.content.length > 120 
            ? `${thread.content.substring(0, 120)}...` 
            : thread.content
          }
        </p>
      </div>
      
      <div className="game-event-info">
        <div className="event-icon">📅</div>
        <div className="event-details">
          <div className="event-type">{thread.event_info.event_type}</div>
          <div className="event-time">
            {formatEventDate(thread.event_info.event_date)}
            {thread.event_info.event_location && (
              <span className="event-location"> • {thread.event_info.event_location}</span>
            )}
          </div>
        </div>
      </div>
      
      <div className="game-thread-stats">
        <div className="stat-item">
          <span className="stat-icon">💬</span>
          <span className="stat-value">{thread.post_count} posts</span>
        </div>
        <div className="stat-item">
          <span className="stat-icon">🕒</span>
          <span className="stat-value">
            Last activity: {formatRelativeTime(thread.last_activity_at)}
          </span>
        </div>
      </div>
    </div>
  )
}
