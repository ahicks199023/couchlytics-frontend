'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { firebaseAuthService, getFirebaseUserEmail } from '@/lib/firebase'
import type { User } from '@/lib/firebase'
import useAuth from '@/Hooks/useAuth'

interface FirebaseAuthContextType {
  isFirebaseAuthenticated: boolean
  firebaseUser: User | null
  isLoading: boolean
  error: string | null
  signInToFirebase: () => Promise<void>
  signOutFromFirebase: () => Promise<void>
  refreshToken: () => Promise<void>
  testHealth: () => Promise<boolean>
}

const FirebaseAuthContext = createContext<FirebaseAuthContextType | undefined>(undefined)

interface FirebaseAuthProviderProps {
  children: ReactNode
}

export const FirebaseAuthProvider: React.FC<FirebaseAuthProviderProps> = ({ children }) => {
  const [isFirebaseAuthenticated, setIsFirebaseAuthenticated] = useState(false)
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasAttemptedAutoInit, setHasAttemptedAutoInit] = useState(false)
  const { authenticated, user: couchlyticsUser } = useAuth()

  useEffect(() => {
    // Listen to Firebase auth state changes
    const unsubscribe = firebaseAuthService.onAuthStateChanged((user: User | null) => {
      // Ensure user has email from our custom property
      if (user && !getFirebaseUserEmail(user)) {
        console.warn('⚠️ Firebase user missing email, may need re-authentication')
      }
      
      setIsFirebaseAuthenticated(!!user)
      setFirebaseUser(user)
      setIsLoading(false)
      setError(null)
    })

    return () => unsubscribe()
  }, [])

  // Auto-initialize Firebase authentication when Couchlytics user is authenticated
  useEffect(() => {
    if (authenticated && couchlyticsUser && !isFirebaseAuthenticated && !isLoading && !hasAttemptedAutoInit) {
      console.log('🔄 Auto-initializing Firebase authentication...')
      setHasAttemptedAutoInit(true)
      signInToFirebase().catch(console.error)
    }
  }, [authenticated, couchlyticsUser, isFirebaseAuthenticated, isLoading, hasAttemptedAutoInit])

  const signInToFirebase = async () => {
    try {
      setIsLoading(true)
      setError(null)
      await firebaseAuthService.signInToFirebase()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed'
      setError(errorMessage)
      console.error('Failed to sign into Firebase:', error)
      setHasAttemptedAutoInit(false) // Reset flag on error so user can retry
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signOutFromFirebase = async () => {
    try {
      setIsLoading(true)
      setError(null)
      await firebaseAuthService.signOutFromFirebase()
      setHasAttemptedAutoInit(false) // Reset flag on sign out
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign out failed'
      setError(errorMessage)
      console.error('Failed to sign out from Firebase:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const refreshToken = async () => {
    try {
      setError(null)
      const token = await firebaseAuthService.refreshToken()
      if (token) {
        console.log('✅ Token refreshed successfully')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Token refresh failed'
      setError(errorMessage)
      console.error('Failed to refresh token:', error)
      throw error
    }
  }

  const testHealth = async (): Promise<boolean> => {
    try {
      return await firebaseAuthService.testFirebaseHealth()
    } catch (error) {
      console.error('Health check failed:', error)
      return false
    }
  }

  const manualSignInToFirebase = async () => {
    setHasAttemptedAutoInit(false) // Reset flag for manual sign-in
    return signInToFirebase()
  }

  const value: FirebaseAuthContextType = {
    isFirebaseAuthenticated,
    firebaseUser,
    isLoading,
    error,
    signInToFirebase: manualSignInToFirebase,
    signOutFromFirebase,
    refreshToken,
    testHealth
  }

  return (
    <FirebaseAuthContext.Provider value={value}>
      {children}
    </FirebaseAuthContext.Provider>
  )
}

export const useFirebaseAuth = (): FirebaseAuthContextType => {
  const context = useContext(FirebaseAuthContext)
  if (!context) {
    throw new Error('useFirebaseAuth must be used within a FirebaseAuthProvider')
  }
  return context
} 