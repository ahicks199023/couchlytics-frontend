'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { firebaseAuthService } from '@/lib/firebase'
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
      setIsFirebaseAuthenticated(!!user)
      setFirebaseUser(user)
      setIsLoading(false)
      setError(null)
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
      setIsLoading(true)
      setError(null)
      await firebaseAuthService.signOutFromFirebase()
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

  const value: FirebaseAuthContextType = {
    isFirebaseAuthenticated,
    firebaseUser,
    isLoading,
    error,
    signInToFirebase,
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