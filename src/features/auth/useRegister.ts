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
      await registerUser(payload)
      const status = await getAuthStatus()
      const message = encodeURIComponent('You are registered, please try logging in.')
      if (status?.authenticated) {
        router.replace('/leagues')
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


