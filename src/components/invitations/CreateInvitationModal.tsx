'use client'

import React, { useState } from 'react'
import { API_BASE_URL } from '../../lib/http'

interface CreateInvitationModalProps {
  leagueId: string
  onClose: () => void
  onSuccess: () => void
}

interface FormData {
  max_uses: number
  expires_in_days: number
  invited_email: string
  role: string
  custom_message: string
}

const CreateInvitationModal: React.FC<CreateInvitationModalProps> = ({ 
  leagueId, 
  onClose, 
  onSuccess 
}) => {
  const [formData, setFormData] = useState<FormData>({
    max_uses: 1,
    expires_in_days: 7,
    invited_email: '',
    role: 'member',
    custom_message: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE_URL}/leagues/${leagueId}/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      })

      const data = await response.json()
      
      if (data.success) {
        onSuccess()
        // Show success message with invitation link
        showInvitationCreated(data.invitation)
      } else {
        setError(data.error || 'Failed to create invitation')
      }
    } catch {
      setError('Failed to create invitation')
    } finally {
      setLoading(false)
    }
  }

  const showInvitationCreated = (invitation: { invitation_code: string }) => {
    const inviteUrl = `${window.location.origin}/join-league/${invitation.invitation_code}`
    
    // Show modal with invitation details
    alert(`Invitation created successfully!\n\nInvitation Link:\n${inviteUrl}\n\nShare this link with users to join your league.`)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">Create League Invitation</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Max Uses */}
          <div>
            <label className="block text-sm font-medium mb-1">Max Uses</label>
            <input
              type="number"
              min="1"
              max="100"
              value={formData.max_uses}
              onChange={(e) => setFormData({...formData, max_uses: parseInt(e.target.value)})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md"
              required
            />
          </div>

          {/* Expires In Days */}
          <div>
            <label className="block text-sm font-medium mb-1">Expires In (Days)</label>
            <input
              type="number"
              min="1"
              max="30"
              value={formData.expires_in_days}
              onChange={(e) => setFormData({...formData, expires_in_days: parseInt(e.target.value)})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md"
              required
            />
          </div>

          {/* Invited Email (Optional) */}
          <div>
            <label className="block text-sm font-medium mb-1">Specific Email (Optional)</label>
            <input
              type="email"
              value={formData.invited_email}
              onChange={(e) => setFormData({...formData, invited_email: e.target.value})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md"
              placeholder="Leave empty for anyone to use"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md"
            >
              <option value="member">Member</option>
              <option value="co_commissioner">Co-Commissioner</option>
            </select>
          </div>

          {/* Custom Message */}
          <div>
            <label className="block text-sm font-medium mb-1">Custom Message (Optional)</label>
            <textarea
              value={formData.custom_message}
              onChange={(e) => setFormData({...formData, custom_message: e.target.value})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md"
              rows={3}
              placeholder="Welcome message for invited users..."
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm">{error}</div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-md"
            >
              {loading ? 'Creating...' : 'Create Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


export default CreateInvitationModal
