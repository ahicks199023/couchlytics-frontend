'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { getAuthStatus, registerUser, RegisterPayload } from './api'

type RegisterResponse = {
  joinedViaInvite?: boolean
  leagueId?: string | number
  league_id?: string | number
} | Record<string, unknown> | undefined

export function useRegister() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  const onRegister = async (payload: RegisterPayload) => {
    setLoading(true)
    setError(null)
    try {
      const res: RegisterResponse = await registerUser(payload)
      const status = await getAuthStatus()
      const inviteCode = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('invite') : null
      const message = encodeURIComponent('Your account has been created. Please sign in to continue.')
      const joinedViaInvite = (res && typeof res === 'object' && 'joinedViaInvite' in res) ? Boolean((res as { joinedViaInvite?: unknown }).joinedViaInvite) : false
      const joinedLeagueIdRaw = (res && typeof res === 'object' && ('leagueId' in res || 'league_id' in res))
        ? ((res as { leagueId?: unknown; league_id?: unknown }).leagueId ?? (res as { league_id?: unknown }).league_id)
        : undefined
      const joinedLeagueId = (typeof joinedLeagueIdRaw === 'string' || typeof joinedLeagueIdRaw === 'number') ? String(joinedLeagueIdRaw) : undefined
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


