'use client'

import { useState } from 'react'
import { API_BASE } from '@/lib/config'

interface CreateGameThreadFormProps {
  leagueId: string
  onClose: () => void
  onSuccess: () => void
}

export default function CreateGameThreadForm({ leagueId, onClose, onSuccess }: CreateGameThreadFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    week: 1,
    season_year: new Date().getFullYear(),
    game_description: '',
    game_date: '',
    game_location: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const threadData = {
        title: formData.title,
        content: formData.content,
        week: formData.week,
        season_year: formData.season_year,
        game_description: formData.game_description,
        game_date: formData.game_date,
        game_location: formData.game_location
      }

      const response = await fetch(`${API_BASE}/leagues/${leagueId}/game-threads`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(threadData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create game thread')
      }

      await response.json()
      onSuccess()
    } catch (error) {
      console.error('Error creating game thread:', error)
      setError(error instanceof Error ? error.message : 'Failed to create game thread')
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

  const currentYear = new Date().getFullYear()
  const years = [currentYear - 1, currentYear, currentYear + 1]
  const weeks = Array.from({ length: 18 }, (_, i) => i + 1) // NFL regular season weeks

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Create Game Thread</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <form onSubmit={handleSubmit} className="create-game-thread-form">
          <div className="form-group">
            <label htmlFor="title">Thread Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., Week 1: Chiefs vs Ravens"
              required
              maxLength={100}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="week">Week *</label>
              <select
                id="week"
                name="week"
                value={formData.week}
                onChange={handleInputChange}
                required
              >
                {weeks.map(week => (
                  <option key={week} value={week}>
                    Week {week}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="season_year">Season Year *</label>
              <select
                id="season_year"
                name="season_year"
                value={formData.season_year}
                onChange={handleInputChange}
                required
              >
                {years.map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="game_description">Game Description *</label>
            <input
              type="text"
              id="game_description"
              name="game_description"
              value={formData.game_description}
              onChange={handleInputChange}
              placeholder="e.g., Chiefs vs Ravens"
              required
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label htmlFor="game_date">Game Date & Time *</label>
            <input
              type="datetime-local"
              id="game_date"
              name="game_date"
              value={formData.game_date}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="game_location">Game Location</label>
            <input
              type="text"
              id="game_location"
              name="game_location"
              value={formData.game_location}
              onChange={handleInputChange}
              placeholder="e.g., Arrowhead Stadium"
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label htmlFor="content">Thread Content *</label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              placeholder="Write the initial content for this game thread..."
              rows={8}
              required
              maxLength={5000}
            />
            <small>{formData.content.length}/5000 characters</small>
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
              disabled={loading || !formData.title.trim() || !formData.content.trim() || !formData.game_description.trim()}
            >
              {loading ? 'Creating...' : 'Create Game Thread'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
