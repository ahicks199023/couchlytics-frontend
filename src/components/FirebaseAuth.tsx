'use client'

import React, { useState, useEffect } from 'react'
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext'
import type { User } from '@/lib/firebase'

interface FirebaseAuthProps {
  onAuthStateChange?: (user: User | null) => void
  showUserInfo?: boolean
  className?: string
}

interface UserClaims {
  couchlytics_user_id?: string
  provider?: string
  [key: string]: unknown
}

export default function FirebaseAuth({ 
  onAuthStateChange, 
  showUserInfo = true,
  className = '' 
}: FirebaseAuthProps) {
  const {
    isFirebaseAuthenticated,
    firebaseUser,
    isLoading,
    error,
    signInToFirebase,
    signOutFromFirebase,
    refreshToken,
    testHealth
  } = useFirebaseAuth()

  const [claims, setClaims] = useState<UserClaims | null>(null)
  const [couchlyticsUserId, setCouchlyticsUserId] = useState<string | null>(null)
  const [healthStatus, setHealthStatus] = useState<boolean | null>(null)

  // Notify parent component of auth state changes
  useEffect(() => {
    if (onAuthStateChange) {
      onAuthStateChange(firebaseUser)
    }
  }, [firebaseUser, onAuthStateChange])

  // Load user claims when user changes
  useEffect(() => {
    const loadUserInfo = async () => {
      if (firebaseUser) {
        try {
          const { firebaseAuthService } = await import('@/lib/firebase')
          const userClaims = await firebaseAuthService.getUserClaims()
          setClaims(userClaims as UserClaims)
          
          const userId = await firebaseAuthService.getCouchlyticsUserId()
          setCouchlyticsUserId(userId)
        } catch (err) {
          console.error('Error loading user info:', err)
        }
      } else {
        setClaims(null)
        setCouchlyticsUserId(null)
      }
    }

    loadUserInfo()
  }, [firebaseUser])

  const handleSignIn = async () => {
    try {
      await signInToFirebase()
    } catch (error) {
      // Error is already handled by the context
      console.error('Sign in failed:', error)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOutFromFirebase()
    } catch (error) {
      // Error is already handled by the context
      console.error('Sign out failed:', error)
    }
  }

  const handleRefreshToken = async () => {
    try {
      await refreshToken()
    } catch (error) {
      // Error is already handled by the context
      console.error('Token refresh failed:', error)
    }
  }

  const handleTestHealth = async () => {
    const isHealthy = await testHealth()
    setHealthStatus(isHealthy)
  }

  if (isLoading) {
    return (
      <div className={`firebase-auth-loading ${className}`}>
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`firebase-auth ${className}`}>
      {error && (
        <div className="firebase-auth-error mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center space-x-2">
            <span className="text-red-600">⚠️</span>
            <span className="text-red-800 font-medium">Error:</span>
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}
      
      {isFirebaseAuthenticated && firebaseUser ? (
        <div className="firebase-auth-success p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-green-600">✅</span>
            <h3 className="text-lg font-semibold text-green-800">Firebase User Authenticated</h3>
          </div>
          
          {showUserInfo && (
            <div className="user-info mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Email:</span>
                  <span className="ml-2 text-gray-900">{firebaseUser.email}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">UID:</span>
                  <span className="ml-2 text-gray-900 font-mono">{firebaseUser.uid}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Provider:</span>
                  <span className="ml-2 text-gray-900">{firebaseUser.providerData[0]?.providerId || 'custom'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Email Verified:</span>
                  <span className="ml-2 text-gray-900">{firebaseUser.emailVerified ? 'Yes' : 'No'}</span>
                </div>
                {couchlyticsUserId && (
                  <div className="md:col-span-2">
                    <span className="font-medium text-gray-700">Couchlytics User ID:</span>
                    <span className="ml-2 text-gray-900 font-mono">{couchlyticsUserId}</span>
                  </div>
                )}
              </div>
              
              {claims && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                    View Custom Claims
                  </summary>
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                    {JSON.stringify(claims, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}
          
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={handleRefreshToken}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
            >
              Refresh Token
            </button>
            <button 
              onClick={handleTestHealth}
              className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors"
            >
              Test Health
            </button>
            <button 
              onClick={handleSignOut}
              className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
            >
              Sign Out from Firebase
            </button>
          </div>

          {healthStatus !== null && (
            <div className={`mt-3 p-2 rounded text-sm ${healthStatus ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              <span className="font-medium">Health Status:</span> {healthStatus ? '✅ Healthy' : '❌ Unhealthy'}
            </div>
          )}
        </div>
      ) : (
        <div className="firebase-auth-prompt p-4 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-blue-600">🔐</span>
            <h3 className="text-lg font-semibold text-blue-800">Firebase Authentication</h3>
          </div>
          <p className="text-blue-700 mb-3">
            You&apos;re logged into Couchlytics but not Firebase. Click below to authenticate with Firebase services.
          </p>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={handleSignIn} 
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign in to Firebase'
              )}
            </button>
            <button 
              onClick={handleTestHealth}
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
            >
              Test Health
            </button>
          </div>

          {healthStatus !== null && (
            <div className={`mt-3 p-2 rounded text-sm ${healthStatus ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              <span className="font-medium">Health Status:</span> {healthStatus ? '✅ Healthy' : '❌ Unhealthy'}
            </div>
          )}
        </div>
      )}
    </div>
  )
} 