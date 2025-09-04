'use client'

import React, { useState, useEffect, useCallback } from 'react'
import CreateInvitationModal from './CreateInvitationModal'
import InvitationsList from './InvitationsList'
import MembersList from './MembersList'
import { API_BASE_URL } from '../../lib/http'

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

interface InvitationManagementProps {
  leagueId: string
}

const InvitationManagement: React.FC<InvitationManagementProps> = ({ leagueId }) => {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [showCreateInvite, setShowCreateInvite] = useState(false)


  // Fetch invitations and members
  const fetchInvitations = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/leagues/${leagueId}/invitations`, {
        credentials: 'include'
      })
      const data = await response.json()
      if (data.success) {
        setInvitations(data.invitations)
      }
    } catch (error) {
      console.error('Error fetching invitations:', error)
    }
  }, [leagueId])

  const fetchMembers = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/leagues/${leagueId}/members`, {
        credentials: 'include'
      })
      const data = await response.json()
      if (data.success) {
        setMembers(data.members)
      }
    } catch (error) {
      console.error('Error fetching members:', error)
    }
  }, [leagueId])

  useEffect(() => {
    fetchInvitations()
    fetchMembers()
  }, [fetchInvitations, fetchMembers])



  return (
    <div className="invitation-management mt-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold">Invitation Management</h3>
        <button
          onClick={() => setShowCreateInvite(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
        >
          Create Invitation
        </button>
      </div>

      {/* Active Invitations */}
      <InvitationsList 
        invitations={invitations}
        onRefresh={fetchInvitations}
      />

      {/* League Members */}
      <MembersList 
        members={members}
        onRefresh={fetchMembers}
      />

      {/* Create Invitation Modal */}
      {showCreateInvite && (
        <CreateInvitationModal
          leagueId={leagueId}
          onClose={() => setShowCreateInvite(false)}
          onSuccess={() => {
            setShowCreateInvite(false)
            fetchInvitations()
          }}
        />
      )}
    </div>
  )
}


export default InvitationManagement
