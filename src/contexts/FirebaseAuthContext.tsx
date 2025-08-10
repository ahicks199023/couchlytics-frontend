'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { firebaseAuthService, getFirebaseUserEmail } from '@/lib/firebase'
import type { User } from '@/lib/firebase'

interface FirebaseAuthContextType {
  isFirebaseAuthenticated: boolean
  firebaseUser: User | null
  isLoading: boolean
  error: string | null
  signInToFirebase: () => Promise<void>
  signOutFromFirebase: () => Promise<void>
  refreshToken: () => Promise<void>
  testHealth: () => Promise<boolean>
  clearSignOutState: () => void
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

  useEffect(() => {
    // Listen to Firebase auth state changes
    const unsubscribe = firebaseAuthService.onAuthStateChanged((user: User | null) => {
      console.log('🔥 Firebase auth state changed:', user ? 'User signed in' : 'User signed out')
      
      // Ensure user has email from our custom property
      if (user && !getFirebaseUserEmail(user)) {
        console.warn('⚠️ Firebase user missing email, may need re-authentication')
      }
      
      setIsFirebaseAuthenticated(!!user)
      setFirebaseUser(user)
      setIsLoading(false)
      setError(null)
      
      if (user) {
        console.log('✅ Firebase user authenticated:', getFirebaseUserEmail(user))
      } else {
        console.log('🚪 Firebase user signed out')
      }
    })

    return () => unsubscribe()
  }, [])

  const signInToFirebase = async () => {
    try {
      setIsLoading(true)
      setError(null)
      await firebaseAuthService.signInToFirebase()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed'
      setError(errorMessage)
      console.error('Failed to sign into Firebase:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signOutFromFirebase = async () => {
    try {
      console.log('🚪 Starting Firebase sign-out process...')
      setIsLoading(true)
      setError(null)
      
      await firebaseAuthService.signOutFromFirebase()
      console.log('🚪 Firebase sign-out completed successfully')
      
      // Force clear Firebase authentication state
      setIsFirebaseAuthenticated(false)
      setFirebaseUser(null)
      console.log('🚪 Cleared Firebase authentication state')
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign out failed'
      setError(errorMessage)
      console.error('❌ Failed to sign out from Firebase:', error)
      throw error
    } finally {
      setIsLoading(false)
      console.log('🚪 Sign-out process completed, isLoading set to false')
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

  const clearSignOutState = () => {
    // This function is kept for compatibility but no longer needed
    console.log('🔄 clearSignOutState called (no longer needed)')
  }

  const value: FirebaseAuthContextType = {
    isFirebaseAuthenticated,
    firebaseUser,
    isLoading,
    error,
    signInToFirebase,
    signOutFromFirebase,
    refreshToken,
    testHealth,
    clearSignOutState
  }

  return (
    <FirebaseAuthContext.Provider value={value}>
      {children}
    </FirebaseAuthContext.Provider>
  )
}

export const useFirebaseAuth = (): FirebaseAuthContextType => {
  const context = useContext(FirebaseAuthContext)
  if (context === undefined) {
    throw new Error('useFirebaseAuth must be used within a FirebaseAuthProvider')
  }
  return context
} 