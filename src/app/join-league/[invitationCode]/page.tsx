'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

interface InvitationData {
  invitation: {
    id: number
    invitation_code: string
    max_uses: number
    current_uses: number
    expires_at: string
    role: string
    invited_email?: string
    metadata?: {
      custom_message?: string
    }
  }
  league: {
    id: number
    name: string
    description: string
    season_year: number
    max_teams: number
  }
}

interface JoinLeaguePageProps {
  params: Promise<{
    invitationCode: string
  }>
}

const JoinLeaguePage = ({ params }: JoinLeaguePageProps) => {
  const router = useRouter()
  const { user, authenticated } = useAuth()
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [invitationCode, setInvitationCode] = useState<string>('')

  const fetchInvitationData = useCallback(async (invitationCode: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/invitations/${invitationCode}/pre-register`)
      const data = await response.json()
      
      if (data.success) {
        setInvitationData(data)
      } else {
        setError(data.error || 'Invalid invitation')
      }
    } catch {
      setError('Failed to validate invitation')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const loadData = async () => {
      const resolvedParams = await params
      setInvitationCode(resolvedParams.invitationCode)
      if (resolvedParams.invitationCode) {
        await fetchInvitationData(resolvedParams.invitationCode)
      }
    }
    loadData()
  }, [params, fetchInvitationData])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading invitation...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-white mb-2">Invalid Invitation</h1>
          <p className="text-gray-400 mb-4">{error}</p>
          <button 
            onClick={() => router.push('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  if (authenticated && user) {
    return <JoinAsExistingUser invitationCode={invitationCode} invitationData={invitationData} />
  } else {
    return <RegisterAndJoin invitationCode={invitationCode} invitationData={invitationData} />
  }
}

const JoinAsExistingUser = ({ invitationCode, invitationData }: { invitationCode: string, invitationData: InvitationData | null }) => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleJoin = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/invitations/${invitationCode}/join`, {
        method: 'POST',
        credentials: 'include'
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Redirect to the league
        router.push(data.redirect_url || `/leagues/${invitationData?.league.id}`)
      } else {
        setError(data.error || 'Failed to join league')
      }
    } catch {
      setError('Failed to join league')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="max-w-md w-full bg-gray-800 rounded-lg p-8">
        <div className="text-center mb-8">
          <div className="text-green-500 text-6xl mb-4">🏈</div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Join {invitationData?.league?.name}
          </h1>
          <p className="text-gray-400">
            You&apos;re already logged in! Click below to join this league.
          </p>
        </div>

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <button
          onClick={handleJoin}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded"
        >
          {loading ? 'Joining...' : 'Join League'}
        </button>
      </div>
    </div>
  )
}

const RegisterAndJoin = ({ invitationCode, invitationData }: { invitationCode: string, invitationData: InvitationData | null }) => {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    display_name: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Pre-fill email if specified in invitation
    if (invitationData?.invitation?.invited_email) {
      setFormData(prev => ({
        ...prev,
        email: invitationData.invitation.invited_email || ''
      }))
    }
  }, [invitationData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/register-with-invitation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          invitation_code: invitationCode
        })
      })

      const data = await response.json()
      
      if (data.success) {
        // Show success message
        alert(`Welcome! You've joined ${data.league_name} successfully!`)
        
        // Redirect to the league
        router.push(data.redirect_url || `/leagues/${invitationData?.league.id}`)
      } else {
        setError(data.error || 'Failed to create account')
      }
    } catch {
      setError('Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="max-w-md w-full bg-gray-800 rounded-lg p-8">
        <div className="text-center mb-8">
          <div className="text-blue-500 text-6xl mb-4">🏈</div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Join {invitationData?.league?.name}
          </h1>
          <p className="text-gray-400">
            Create your account to join this league
          </p>
        </div>

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              First Name
            </label>
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
              required
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Last Name
            </label>
            <input
              type="text"
              value={formData.last_name}
              onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
              required
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={formData.display_name}
              onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
              placeholder="Optional"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              required
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              required
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded"
          >
            {loading ? 'Creating Account...' : 'Create Account & Join League'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default JoinLeaguePage