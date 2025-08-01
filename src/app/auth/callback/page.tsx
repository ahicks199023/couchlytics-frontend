'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { API_BASE } from '@/lib/config'

export default function AuthCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Processing authentication...')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check if we have OAuth callback parameters
        const code = searchParams.get('code')
        const state = searchParams.get('state')
        const error = searchParams.get('error')

        if (error) {
          setStatus('error')
          setMessage(`Authentication failed: ${error}`)
          return
        }

        if (!code) {
          setStatus('error')
          setMessage('No authorization code received')
          return
        }

        // The backend should handle the OAuth callback at /auth/callback
        // Let's check if the session was established
        console.log('Checking authentication status after OAuth callback...')
        
        const response = await fetch(`${API_BASE}/auth/status`, {
          credentials: 'include'
        })

        console.log('Auth status response:', response.status)

        if (response.ok) {
          const data = await response.json()
          console.log('Auth status data:', data)
          
          if (data.authenticated) {
            setStatus('success')
            setMessage('Authentication successful! Redirecting...')
            
            // Redirect to leagues page after successful authentication
            setTimeout(() => {
              router.push('/leagues')
            }, 1500)
          } else {
            setStatus('error')
            setMessage('Authentication failed. Session not established.')
          }
        } else {
          const errorText = await response.text()
          console.error('Auth status error:', errorText)
          setStatus('error')
          setMessage('Authentication failed. Please try again.')
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        setStatus('error')
        setMessage('Authentication failed. Please try again.')
      }
    }

    handleCallback()
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="max-w-md w-full mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <div className="text-center">
          {status === 'loading' && (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-green"></div>
              <span className="text-gray-600 dark:text-gray-300">{message}</span>
            </div>
          )}
          
          {status === 'success' && (
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-green-600 dark:text-green-400">{message}</span>
            </div>
          )}
          
          {status === 'error' && (
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="text-red-600 dark:text-red-400">{message}</span>
            </div>
          )}
          
          {status === 'error' && (
            <button
              onClick={() => router.push('/login')}
              className="mt-4 bg-neon-green text-black px-4 py-2 rounded hover:bg-green-400 transition-colors"
            >
              Back to Login
            </button>
          )}
        </div>
      </div>
    </div>
  )
} 