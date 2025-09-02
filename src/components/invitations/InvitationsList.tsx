'use client'

import React, { useState } from 'react'

interface Invitation {
  id: string
  invitation_code: string
  max_uses: number
  current_uses: number
  expires_at: string
  is_active: boolean
  is_valid: boolean
  role: string
  invited_email?: string
  league_id: string
  created_at: string
}

interface InvitationsListProps {
  invitations: Invitation[]
  onRefresh: () => void
}

const InvitationsList: React.FC<InvitationsListProps> = ({ invitations, onRefresh }) => {
  const [editingInvite, setEditingInvite] = useState<Invitation | null>(null)

  const copyInviteLink = (invitation: Invitation) => {
    const inviteUrl = `${window.location.origin}/join-league/${invitation.invitation_code}`
    navigator.clipboard.writeText(inviteUrl)
    // Show toast notification
    showToast('Invitation link copied to clipboard!')
  }

  const deleteInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to delete this invitation?')) return

    try {
      const response = await fetch(`/api/leagues/${invitations[0]?.league_id}/invitations/${invitationId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      })

      if (response.ok) {
        onRefresh()
        showToast('Invitation deleted successfully')
      }
    } catch (error) {
      showToast('Failed to delete invitation', 'error')
    }
  }

  const toggleInvitationStatus = async (invitationId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/leagues/${invitations[0]?.league_id}/invitations/${invitationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ is_active: !isActive })
      })

      if (response.ok) {
        onRefresh()
        showToast(`Invitation ${!isActive ? 'activated' : 'deactivated'}`)
      }
    } catch (error) {
      showToast('Failed to update invitation', 'error')
    }
  }

  return (
    <div className="invitations-list">
      <h4 className="text-lg font-semibold mb-4">Active Invitations</h4>
      
      {invitations.length === 0 ? (
        <div className="text-gray-400 text-center py-8">
          No invitations created yet. Create your first invitation to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {invitations.map((invitation) => (
            <div key={invitation.id} className="invitation-card bg-gray-700/50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    invitation.is_valid ? 'status-active' : 'status-expired'
                  }`}>
                    {invitation.is_valid ? 'Active' : 'Expired'}
                  </span>
                  <span className="text-sm text-gray-400">
                    {invitation.current_uses}/{invitation.max_uses} uses
                  </span>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => copyInviteLink(invitation)}
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    Copy Link
                  </button>
                  <button
                    onClick={() => setEditingInvite(invitation)}
                    className="text-yellow-400 hover:text-yellow-300 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => toggleInvitationStatus(invitation.id, invitation.is_active)}
                    className={`text-sm ${
                      invitation.is_active 
                        ? 'text-orange-400 hover:text-orange-300' 
                        : 'text-green-400 hover:text-green-300'
                    }`}
                  >
                    {invitation.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => deleteInvitation(invitation.id)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Expires:</span>
                  <span className="ml-2">{new Date(invitation.expires_at).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-gray-400">Role:</span>
                  <span className="ml-2 capitalize">{invitation.role.replace('_', ' ')}</span>
                </div>
                {invitation.invited_email && (
                  <div className="col-span-2">
                    <span className="text-gray-400">For:</span>
                    <span className="ml-2">{invitation.invited_email}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Invitation Modal */}
      {editingInvite && (
        <EditInvitationModal
          invitation={editingInvite}
          onClose={() => setEditingInvite(null)}
          onSuccess={() => {
            setEditingInvite(null)
            onRefresh()
          }}
        />
      )}
    </div>
  )
}

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('authToken') || ''
}

// Helper function to show toast notifications
const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  // This should match your existing toast notification system
  console.log(`${type.toUpperCase()}: ${message}`)
}

// Placeholder for EditInvitationModal component
const EditInvitationModal: React.FC<{
  invitation: Invitation
  onClose: () => void
  onSuccess: () => void
}> = ({ invitation, onClose, onSuccess }) => {
  // This would be implemented similarly to CreateInvitationModal
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">Edit Invitation</h3>
        <p className="text-gray-400 mb-4">Edit functionality coming soon...</p>
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md"
        >
          Close
        </button>
      </div>
    </div>
  )
}

export default InvitationsList
