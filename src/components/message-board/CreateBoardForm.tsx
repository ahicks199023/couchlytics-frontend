'use client'

import { useState } from 'react'
import { API_BASE } from '@/lib/config'

interface CreateBoardFormProps {
  leagueId: string
  onClose: () => void
  onSuccess: () => void
}

export default function CreateBoardForm({ leagueId, onClose, onSuccess }: CreateBoardFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    board_type: 'general',
    display_order: 5,
    can_all_post: true,
    commissioner_only: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const boardTypes = [
    { value: 'general', label: 'General Discussion', icon: '💬' },
    { value: 'announcements', label: 'Announcements', icon: '📢' },
    { value: 'trades', label: 'Trade Discussion', icon: '🔄' },
    { value: 'game_threads', label: 'Game Threads', icon: '🏈' },
    { value: 'rules', label: 'Rules & Guidelines', icon: '📋' },
    { value: 'custom', label: 'Custom', icon: '🎯' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE}/leagues/${leagueId}/message-boards`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create board')
      }

      await response.json()
      onSuccess()
    } catch (error) {
      console.error('Error creating board:', error)
      setError(error instanceof Error ? error.message : 'Failed to create board')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }))
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Create New Message Board</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <form onSubmit={handleSubmit} className="create-board-form">
          <div className="form-group">
            <label htmlFor="name">Board Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter board name"
              required
              maxLength={50}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe what this board is for"
              rows={3}
              maxLength={200}
            />
          </div>

          <div className="form-group">
            <label htmlFor="board_type">Board Type</label>
            <select
              id="board_type"
              name="board_type"
              value={formData.board_type}
              onChange={handleInputChange}
            >
              {boardTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="display_order">Display Order</label>
            <input
              type="number"
              id="display_order"
              name="display_order"
              value={formData.display_order}
              onChange={handleInputChange}
              min="0"
              max="100"
            />
            <small>Lower numbers appear first in the list</small>
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="can_all_post"
                checked={formData.can_all_post}
                onChange={handleCheckboxChange}
              />
              <span className="checkmark"></span>
              Allow all members to post
            </label>
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="commissioner_only"
                checked={formData.commissioner_only}
                onChange={handleCheckboxChange}
              />
              <span className="checkmark"></span>
              Commissioner only (restricts posting to commissioners)
            </label>
          </div>

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
              disabled={loading || !formData.name.trim()}
            >
              {loading ? 'Creating...' : 'Create Board'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
