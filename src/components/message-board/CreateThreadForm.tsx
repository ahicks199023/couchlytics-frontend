'use client'

import { useState } from 'react'
import { API_BASE } from '@/lib/config'

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

interface CreateThreadFormProps {
  board: MessageBoard
  onClose: () => void
  onSuccess: () => void
}

export default function CreateThreadForm({ board, onClose, onSuccess }: CreateThreadFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    thread_type: 'discussion',
    event_date: '',
    event_location: '',
    event_type: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const threadTypes = [
    { value: 'discussion', label: 'Discussion', icon: '💬' },
    { value: 'announcement', label: 'Announcement', icon: '📢' },
    { value: 'game_thread', label: 'Game Thread', icon: '🏈' },
    { value: 'trade', label: 'Trade Discussion', icon: '🔄' },
    { value: 'question', label: 'Question', icon: '❓' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const threadData = {
        title: formData.title,
        content: formData.content,
        thread_type: formData.thread_type,
        ...(formData.event_date && {
          event_date: formData.event_date,
          event_location: formData.event_location,
          event_type: formData.event_type
        })
      }

      const response = await fetch(`${API_BASE}/leagues/${board.id}/message-boards/${board.id}/threads`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(threadData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create thread')
      }

      await response.json()
      onSuccess()
    } catch (error) {
      console.error('Error creating thread:', error)
      setError(error instanceof Error ? error.message : 'Failed to create thread')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const isEventThread = formData.thread_type === 'game_thread' || formData.thread_type === 'announcement'

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Create New Thread</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <div className="board-info">
          <span className="board-name">{board.name}</span>
          <span className="board-description">{board.description}</span>
        </div>

        <form onSubmit={handleSubmit} className="create-thread-form">
          <div className="form-group">
            <label htmlFor="title">Thread Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter thread title"
              required
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label htmlFor="thread_type">Thread Type</label>
            <select
              id="thread_type"
              name="thread_type"
              value={formData.thread_type}
              onChange={handleInputChange}
            >
              {threadTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="content">Content *</label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              placeholder="Write your thread content..."
              rows={8}
              required
              maxLength={5000}
            />
            <small>{formData.content.length}/5000 characters</small>
          </div>

          {isEventThread && (
            <div className="event-fields">
              <h3>Event Information</h3>
              
              <div className="form-group">
                <label htmlFor="event_date">Event Date</label>
                <input
                  type="datetime-local"
                  id="event_date"
                  name="event_date"
                  value={formData.event_date}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="event_location">Event Location</label>
                <input
                  type="text"
                  id="event_location"
                  name="event_location"
                  value={formData.event_location}
                  onChange={handleInputChange}
                  placeholder="e.g., Arrowhead Stadium, Online"
                  maxLength={100}
                />
              </div>

              <div className="form-group">
                <label htmlFor="event_type">Event Type</label>
                <input
                  type="text"
                  id="event_type"
                  name="event_type"
                  value={formData.event_type}
                  onChange={handleInputChange}
                  placeholder="e.g., Week 1 2024 - Chiefs vs Ravens"
                  maxLength={100}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="cancel-btn"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-btn"
              disabled={loading || !formData.title.trim() || !formData.content.trim()}
            >
              {loading ? 'Creating...' : 'Create Thread'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
