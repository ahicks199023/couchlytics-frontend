'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { API_BASE_URL } from '../../../lib/http'

interface InvitationData {
  invitation: {
    id: string
    invitation_code: string
    max_uses: number
    current_uses: number
    expires_at: string
    is_active: boolean
    is_valid: boolean
    role: string
    invited_email?: string
    metadata?: {
      custom_message?: string
    }
  }
  league: {
    id: string
    name: string
    description?: string
    season_year: number
    max_teams: number
  }
}

const JoinLeaguePage: React.FC = () => {
  const params = useParams()
  const router = useRouter()
  const invitationCode = params.invitationCode as string
  
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [joining, setJoining] = useState(false)

  const validateInvitation = useCallback(async () => {
    try {
      console.log('🔍 Validating invitation:', invitationCode)
      const response = await fetch(`${API_BASE_URL}/invitations/${invitationCode}/validate`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      console.log('📡 Validate invitation response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Invitation validation success:', data)
        if (data.success) {
          setInvitationData(data)
        } else {
          setError(data.error || 'Invalid invitation')
        }
      } else {
        const errorText = await response.text()
        console.error('❌ Invitation validation error:', errorText)
        setError(`Failed to validate invitation (${response.status})`)
      }
    } catch (error) {
      console.error('❌ Invitation validation error:', error)
      setError('Failed to validate invitation')
    } finally {
      setLoading(false)
    }
  }, [invitationCode])

  useEffect(() => {
    if (invitationCode) {
      validateInvitation()
      checkLoginStatus()
    }
  }, [invitationCode, validateInvitation])



  const checkLoginStatus = async () => {
    // Check if user is logged in by making a request to the backend
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        credentials: 'include'
      })
      setIsLoggedIn(response.ok)
    } catch {
      setIsLoggedIn(false)
    }
  }

  const handleJoinLeague = async () => {
    setJoining(true)
    
    try {
      console.log('🔗 Attempting to join league with invitation:', invitationCode)
      console.log('🍪 Current cookies:', document.cookie)
      
      const response = await fetch(`${API_BASE_URL}/invitations/${invitationCode}/join`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      console.log('📡 Join league response status:', response.status)
      console.log('📡 Join league response headers:', Object.fromEntries(response.headers.entries()))

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Join league success:', data)
        showToast('Successfully joined the league!')
        router.push(`/leagues/${data.league_id}`)
      } else {
        const errorText = await response.text()
        console.error('❌ Join league error response:', errorText)
        
        try {
          const errorData = JSON.parse(errorText)
          setError(errorData.error || `Failed to join league (${response.status})`)
        } catch {
          setError(`Failed to join league (${response.status}): ${errorText}`)
        }
      }
    } catch (error) {
      console.error('❌ Join league error:', error)
      setError('Failed to join league: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setJoining(false)
    }
  }

  const handleRegisterAndJoin = () => {
    // Redirect to registration page with invitation code
    router.push(`/register?invitation=${invitationCode}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Validating invitation...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold mb-2">Invalid Invitation</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-lg w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-green-400 text-6xl mb-4">🎯</div>
          <h1 className="text-2xl font-bold mb-2">Join League</h1>
                     <p className="text-gray-400">You&apos;ve been invited to join a league!</p>
        </div>

        {invitationData && (
          <div className="bg-gray-700/50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold mb-2">{invitationData.league.name}</h3>
            <p className="text-sm text-gray-400 mb-3">{invitationData.league.description}</p>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Season:</span>
                <span className="ml-2">{invitationData.league.season_year}</span>
              </div>
              <div>
                <span className="text-gray-400">Max Teams:</span>
                <span className="ml-2">{invitationData.league.max_teams}</span>
              </div>
            </div>
            
            {invitationData.invitation.metadata?.custom_message && (
              <div className="mt-3 p-3 bg-blue-900/20 border border-blue-500 rounded">
                <p className="text-sm text-blue-300">
                  {invitationData.invitation.metadata.custom_message}
                </p>
              </div>
            )}
          </div>
        )}

        {isLoggedIn ? (
          <button
            onClick={handleJoinLeague}
            disabled={joining}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-3 rounded-lg font-medium"
          >
            {joining ? 'Joining...' : 'Join League'}
          </button>
        ) : (
          <div className="space-y-3">
            <button
              onClick={handleRegisterAndJoin}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium"
            >
              Create Account & Join League
            </button>
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-medium"
            >
              I Already Have an Account
            </button>
          </div>
        )}
      </div>
    </div>
  )
}


// Helper function to show toast notifications
const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  // This should match your existing toast notification system
  console.log(`${type.toUpperCase()}: ${message}`)
}

export default JoinLeaguePage
