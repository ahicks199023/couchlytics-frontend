'use client'

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

interface ThreadCardProps {
  thread: Thread
  onClick: () => void
}

export default function ThreadCard({ thread, onClick }: ThreadCardProps) {
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

  const getThreadIcon = (threadType: string) => {
    switch (threadType) {
      case 'discussion':
        return '💬'
      case 'announcement':
        return '📢'
      case 'game_thread':
        return '🏈'
      case 'trade':
        return '🔄'
      case 'question':
        return '❓'
      default:
        return '💬'
    }
  }

  return (
    <div 
      className={`thread-card ${thread.is_pinned ? 'pinned' : ''} ${thread.is_locked ? 'locked' : ''}`}
      onClick={onClick}
    >
      <div className="thread-header">
        <div className="thread-icon">
          {getThreadIcon(thread.thread_type)}
        </div>
        <div className="thread-info">
          <h3 className="thread-title">
            {thread.title}
            {thread.is_pinned && <span className="pin-badge">📌</span>}
            {thread.is_locked && <span className="lock-badge">🔒</span>}
          </h3>
          <div className="thread-meta">
            <span className="thread-author">by {thread.author.name}</span>
            <span className="thread-date">{formatRelativeTime(thread.created_at)}</span>
            {thread.thread_type !== 'discussion' && (
              <span className="thread-type">{thread.thread_type}</span>
            )}
          </div>
        </div>
      </div>
      
      <div className="thread-content">
        <p className="thread-excerpt">
          {thread.content.length > 150 
            ? `${thread.content.substring(0, 150)}...` 
            : thread.content
          }
        </p>
      </div>
      
      {thread.event_info && (
        <div className="thread-event">
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
      
      <div className="thread-stats">
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
