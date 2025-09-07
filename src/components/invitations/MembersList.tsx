'use client'

import React from 'react'
import { API_BASE_URL } from '../../lib/http'

interface Member {
  id: string
  user_id: string
  league_id: string
  role: string
  joined_at: string
  user?: {
    id: string
    email: string
    display_name?: string
    first_name?: string
    last_name?: string
  }
}

interface MembersListProps {
  members: Member[]
  onRefresh: () => void
}

const MembersList: React.FC<MembersListProps> = ({ members, onRefresh }) => {
  console.log('🔍 MembersList received members:', members)
  console.log('🔍 Members count:', members?.length || 0)
  const updateMemberRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/leagues/${members[0]?.league_id}/members/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ role: newRole })
      })

      if (response.ok) {
        onRefresh()
        showToast('Member role updated successfully')
      }
    } catch {
      showToast('Failed to update member role', 'error')
    }
  }

  const removeMember = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to remove ${userName} from the league?`)) return

    try {
      const response = await fetch(`${API_BASE_URL}/leagues/${members[0]?.league_id}/members/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        onRefresh()
        showToast('Member removed successfully')
      }
    } catch {
      showToast('Failed to remove member', 'error')
    }
  }

  const getDisplayName = (member: Member) => {
    if (member.user?.display_name) return member.user.display_name
    if (member.user?.first_name && member.user?.last_name) {
      return `${member.user.first_name} ${member.user.last_name}`
    }
    return member.user?.email || 'Unknown User'
  }

  return (
    <div className="members-list mt-8">
      <h4 className="text-lg font-semibold mb-4">League Members</h4>
      
      {members.length === 0 ? (
        <div className="text-gray-400 text-center py-8">
          <p>No members found in this league.</p>
          <p className="text-sm mt-2">If you just joined, try refreshing the page.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {members.map((member) => (
          <div key={member.id} className="member-card bg-gray-700/50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div>
                  <div className="font-medium">{getDisplayName(member)}</div>
                  <div className="text-sm text-gray-400">
                    Joined {new Date(member.joined_at).toLocaleDateString()}
                  </div>
                  {member.user?.email && (
                    <div className="text-xs text-gray-500">
                      {member.user.email}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <select
                  value={member.role}
                  onChange={(e) => updateMemberRole(member.user_id, e.target.value)}
                  className="px-3 py-1 bg-gray-600 border border-gray-500 rounded text-sm"
                >
                  <option value="member">Member</option>
                  <option value="co_commissioner">Co-Commissioner</option>
                </select>
                
                <button
                  onClick={() => removeMember(member.user_id, getDisplayName(member))}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
        </div>
      )}
    </div>
  )
}


// Helper function to show toast notifications
const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  // This should match your existing toast notification system
  console.log(`${type.toUpperCase()}: ${message}`)
}

export default MembersList
