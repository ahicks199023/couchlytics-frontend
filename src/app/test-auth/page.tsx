'use client'

import { useEffect, useState } from 'react'
import { API_BASE, authenticatedFetch } from '@/lib/config'

interface UserData {
  id: number
  email: string
  isAdmin?: boolean
  isCommissioner?: boolean
  isPremium?: boolean
  [key: string]: unknown
}

interface MembershipData {
  isMember: boolean
  [key: string]: unknown
}

export default function TestAuthPage() {
  const [authStatus, setAuthStatus] = useState<string>('Loading...')
  const [userData, setUserData] = useState<UserData | null>(null)
  const [leagueMembership, setLeagueMembership] = useState<MembershipData | null>(null)

  useEffect(() => {
    const testAuth = async () => {
      try {
        // Test 1: Check if user is authenticated
        console.log('[TestAuth] Testing /me endpoint...')
        const meResponse = await authenticatedFetch(`${API_BASE}/me`)
        console.log('[TestAuth] /me response status:', meResponse.status)
        
        if (meResponse.ok) {
          const userData = await meResponse.json() as UserData
          console.log('[TestAuth] User data:', userData)
          setUserData(userData)
          setAuthStatus('✅ User authenticated')
        } else {
          console.error('[TestAuth] /me failed:', meResponse.status)
          setAuthStatus('❌ User not authenticated')
        }

        // Test 2: Check league membership
        console.log('[TestAuth] Testing league membership...')
        const leagueId = '12335716' // Test league ID
        const membershipResponse = await authenticatedFetch(`${API_BASE}/leagues/${leagueId}/is-member`)
        console.log('[TestAuth] Membership response status:', membershipResponse.status)
        
        if (membershipResponse.ok) {
          const membershipData = await membershipResponse.json() as MembershipData
          console.log('[TestAuth] Membership data:', membershipData)
          setLeagueMembership(membershipData)
        } else {
          console.error('[TestAuth] Membership check failed:', membershipResponse.status)
          const errorText = await membershipResponse.text()
          console.error('[TestAuth] Error response:', errorText)
        }

      } catch (error) {
        console.error('[TestAuth] Test failed:', error)
        setAuthStatus('❌ Test failed')
      }
    }

    testAuth()
  }, [])

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Authentication Test</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Status</h2>
          <p className="text-neon-green">{authStatus}</p>
        </div>

        {userData && (
          <div className="bg-gray-800 p-4 rounded">
            <h2 className="text-xl font-semibold mb-2">User Data</h2>
            <pre className="text-sm overflow-auto">{JSON.stringify(userData, null, 2)}</pre>
          </div>
        )}

        {leagueMembership && (
          <div className="bg-gray-800 p-4 rounded">
            <h2 className="text-xl font-semibold mb-2">League Membership</h2>
            <pre className="text-sm overflow-auto">{JSON.stringify(leagueMembership, null, 2)}</pre>
          </div>
        )}

        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">API Configuration</h2>
          <p><strong>API Base:</strong> {API_BASE}</p>
          <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
        </div>
      </div>
    </div>
  )
} 