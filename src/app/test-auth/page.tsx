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

export default function TestAuthPage() {
  const [authStatus, setAuthStatus] = useState<string>('Loading...')
  const [userData, setUserData] = useState<UserData | null>(null)
  const [leagueMembership, setLeagueMembership] = useState<MembershipData | null>(null)
  const [leagueMembers, setLeagueMembers] = useState<Member[]>([])
  const [membersError, setMembersError] = useState<string | null>(null)

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

        // Test 3: Check league members
        console.log('[TestAuth] Testing league members endpoint...')
        const membersResponse = await authenticatedFetch(`${API_BASE}/leagues/${leagueId}/members`)
        console.log('[TestAuth] Members response status:', membersResponse.status)
        
        if (membersResponse.ok) {
          const membersData = await membersResponse.json()
          console.log('[TestAuth] Members response data:', membersData)
          if (membersData.success) {
            setLeagueMembers(membersData.members || [])
            console.log('[TestAuth] Members loaded:', membersData.members?.length || 0)
          } else {
            setMembersError(membersData.error || 'Unknown error')
          }
        } else {
          const errorText = await membersResponse.text()
          console.error('[TestAuth] Members check failed:', membersResponse.status, errorText)
          setMembersError(`HTTP ${membersResponse.status}: ${errorText}`)
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
          <h2 className="text-xl font-semibold mb-2">League Members</h2>
          {membersError ? (
            <p className="text-red-400">Error: {membersError}</p>
          ) : (
            <div>
              <p className="text-neon-green mb-2">Found {leagueMembers.length} members</p>
              {leagueMembers.length > 0 ? (
                <div className="space-y-2">
                  {leagueMembers.map((member) => (
                    <div key={member.id} className="bg-gray-700 p-2 rounded text-sm">
                      <div><strong>Email:</strong> {member.user?.email || 'Unknown'}</div>
                      <div><strong>Name:</strong> {member.user?.display_name || `${member.user?.first_name || ''} ${member.user?.last_name || ''}`.trim() || 'Unknown'}</div>
                      <div><strong>Role:</strong> {member.role}</div>
                      <div><strong>Joined:</strong> {new Date(member.joined_at).toLocaleDateString()}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No members found</p>
              )}
            </div>
          )}
        </div>

        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">API Configuration</h2>
          <p><strong>API Base:</strong> {API_BASE}</p>
          <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
        </div>
      </div>
    </div>
  )
} 