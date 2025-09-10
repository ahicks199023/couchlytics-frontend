'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { API_BASE_URL } from '@/lib/http'

interface InvitationData {
  success: boolean
  league: {
    id: string
    name: string
  }
  error?: string
}

export default function InvitationProcessor() {
  const { authenticated, user } = useAuth()
  const router = useRouter()
  const [processing, setProcessing] = useState(false)
  const [processed, setProcessed] = useState(false)

  useEffect(() => {
    const processInvitation = async () => {
      // Only process if user is authenticated and we haven't processed yet
      if (!authenticated || !user || processing || processed) {
        return
      }

      // Check for invitation code in URL
      const urlParams = new URLSearchParams(window.location.search)
      const inviteCode = urlParams.get('invite') || urlParams.get('invitation_code')
      
      if (!inviteCode) {
        setProcessed(true)
        return
      }

      console.log('🎯 Processing invitation for authenticated user:', user.email)
      console.log('🔍 Invitation code:', inviteCode)
      
      setProcessing(true)

      try {
        // Step 1: Validate the invitation
        console.log('📋 Step 1: Validating invitation...')
        const validateResponse = await fetch(`${API_BASE_URL}/invitations/${inviteCode}/validate`, {
          credentials: 'include'
        })
        
        if (!validateResponse.ok) {
          throw new Error(`Invitation validation failed: ${validateResponse.status}`)
        }
        
        const validateData: InvitationData = await validateResponse.json()
        console.log('📋 Validation response:', validateData)
        
        if (!validateData.success) {
          throw new Error(validateData.error || 'Invalid invitation')
        }

        const leagueId = validateData.league.id
        const leagueName = validateData.league.name
        
        console.log('✅ Invitation is valid for league:', leagueName, '(ID:', leagueId, ')')

        // Step 2: Check if user is already a member of the league
        console.log('📋 Step 2: Checking league membership...')
        const membershipResponse = await fetch(`${API_BASE_URL}/leagues/${leagueId}/members/me`, {
          credentials: 'include'
        })
        
        const isAlreadyMember = membershipResponse.ok
        console.log('📋 Membership check result:', isAlreadyMember ? 'Already a member' : 'Not a member')

        if (isAlreadyMember) {
          // User is already a member, redirect directly to the league
          console.log('✅ User is already a member, redirecting to league...')
          router.push(`/leagues/${leagueId}`)
        } else {
          // User is not a member, join the league first
          console.log('📋 Step 3: Joining league...')
          const joinResponse = await fetch(`${API_BASE_URL}/invitations/${inviteCode}/join`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include'
          })
          
          if (!joinResponse.ok) {
            throw new Error(`Failed to join league: ${joinResponse.status}`)
          }
          
          const joinData = await joinResponse.json()
          console.log('📋 Join response:', joinData)
          
          if (joinData.success) {
            console.log('✅ Successfully joined league, redirecting...')
            router.push(`/leagues/${leagueId}`)
          } else {
            throw new Error(joinData.error || 'Failed to join league')
          }
        }

        // Clean up URL parameters
        const newUrl = new URL(window.location.href)
        newUrl.searchParams.delete('invite')
        newUrl.searchParams.delete('invitation_code')
        window.history.replaceState({}, '', newUrl.toString())

      } catch (error) {
        console.error('❌ Invitation processing failed:', error)
        
        // Show error message to user
        const errorMessage = error instanceof Error ? error.message : 'Failed to process invitation'
        alert(`Invitation Error: ${errorMessage}`)
        
        // Redirect to leagues page as fallback
        router.push('/leagues')
      } finally {
        setProcessing(false)
        setProcessed(true)
      }
    }

    processInvitation()
  }, [authenticated, user, processing, processed, router])

  // Show loading indicator while processing
  if (processing) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-6 max-w-md mx-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-neon-green"></div>
            <div>
              <h3 className="text-white font-semibold">Processing Invitation</h3>
              <p className="text-gray-400 text-sm">Please wait while we add you to the league...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
