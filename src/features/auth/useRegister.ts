'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { getAuthStatus, registerUser, RegisterPayload } from './api'

export function useRegister() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  const onRegister = async (payload: RegisterPayload) => {
    setLoading(true)
    setError(null)
    try {
      const res = await registerUser(payload)
      const status = await getAuthStatus()
      const inviteCode = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('invite') : null
      const message = encodeURIComponent('Your account has been created. Please sign in to continue.')
      const joinedViaInvite = (res as any)?.joinedViaInvite
      const joinedLeagueId = (res as any)?.leagueId || (res as any)?.league_id
      if (status?.authenticated) {
        if (joinedLeagueId) {
          router.replace(`/leagues/${joinedLeagueId}`)
        } else {
          router.replace('/leagues')
        }
      } else if (inviteCode) {
        router.replace(`/login?invite=${encodeURIComponent(inviteCode)}&message=${message}`)
      } else if (joinedViaInvite && joinedLeagueId) {
        router.replace(`/login?message=${message}`)
      } else {
        router.replace(`/login?message=${message}`)
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Registration failed.'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }

  return { onRegister, loading, error }
}


