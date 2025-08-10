'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { firebaseAuthService, getFirebaseUserEmail } from '@/lib/firebase'
import type { User } from '@/lib/firebase'
import useAuth from '@/Hooks/useAuth'

// Global flag to prevent auto-initialization after logout
// This persists across component re-renders and context resets
let globalUserExplicitlySignedOut = false
let globalLastSignOutTime: number | null = null

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
  const [hasAttemptedAutoInit, setHasAttemptedAutoInit] = useState(false)
  const [userExplicitlySignedOut, setUserExplicitlySignedOut] = useState(false)
  const [lastSignOutTime, setLastSignOutTime] = useState<number | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false) // Add explicit logout state
  const { authenticated, user: couchlyticsUser } = useAuth()

  // Check if enough time has passed since last sign-out to allow auto-initialization
  const canAutoInitialize = useCallback(() => {
    // Check both local and global flags
    if (globalUserExplicitlySignedOut || userExplicitlySignedOut) return false
    if (globalLastSignOutTime || lastSignOutTime) {
      const timeSinceSignOut = Date.now() - (globalLastSignOutTime || lastSignOutTime || 0)
      const minDelay = 10000 // 10 seconds minimum delay
      return timeSinceSignOut > minDelay
    }
    return true
  }, [lastSignOutTime, userExplicitlySignedOut])

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
      
      // If user signs in, clear the explicit sign-out flag
      if (user) {
        setUserExplicitlySignedOut(false)
      }
    })

    return () => unsubscribe()
  }, [])

  // Auto-initialize Firebase authentication when Couchlytics user is authenticated
  // BUT only if the user hasn't explicitly signed out
  useEffect(() => {
    console.log('🔄 FirebaseAuthContext useEffect triggered:', {
      authenticated,
      hasCouchlyticsUser: !!couchlyticsUser,
      isFirebaseAuthenticated,
      isLoading,
      hasAttemptedAutoInit,
      userExplicitlySignedOut,
      isLoggingOut,
      globalUserExplicitlySignedOut,
      globalLastSignOutTime,
      canAutoInit: canAutoInitialize(),
      lastSignOutTime
    })
    
    // Don't auto-initialize if user explicitly signed out (check both local and global)
    if (userExplicitlySignedOut || globalUserExplicitlySignedOut) {
      console.log('🚫 Skipping auto-initialization - user explicitly signed out (local or global)')
      return
    }
    
    // Don't auto-initialize if we're in the process of logging out
    if (isLoggingOut) {
      console.log('🚫 Skipping auto-initialization - user is logging out')
      return
    }
    
    // Don't auto-initialize if it's too soon since last sign-out
    if (!canAutoInitialize()) {
      console.log('⏰ Skipping auto-initialization - too soon since last sign-out')
      return
    }
    
    // Only auto-initialize if all conditions are met
    if (
      authenticated && 
      couchlyticsUser && 
      !isFirebaseAuthenticated && 
      !isLoading && 
      !hasAttemptedAutoInit
    ) {
      console.log('🔄 Auto-initializing Firebase authentication...')
      setHasAttemptedAutoInit(true)
      signInToFirebase().catch(console.error)
    } else {
      console.log('🔄 Skipping auto-initialization - conditions not met:', {
        authenticated,
        hasCouchlyticsUser: !!couchlyticsUser,
        isFirebaseAuthenticated,
        isLoading,
        hasAttemptedAutoInit
      })
    }
  }, [authenticated, couchlyticsUser, isFirebaseAuthenticated, isLoading, hasAttemptedAutoInit, userExplicitlySignedOut, isLoggingOut, canAutoInitialize, lastSignOutTime])

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
      console.log('🚪 Starting Firebase sign-out process...')
      setIsLoading(true)
      setError(null)
      setIsLoggingOut(true) // Set explicit logout state
      setUserExplicitlySignedOut(true) // Mark that user explicitly signed out
      setLastSignOutTime(Date.now()) // Record the time of the sign-out
      
      // Set global flags to prevent auto-initialization across re-renders
      globalUserExplicitlySignedOut = true
      globalLastSignOutTime = Date.now()
      
      console.log('🚪 Set userExplicitlySignedOut to true and isLoggingOut to true')
      console.log('🚪 Set global flags to prevent auto-initialization')
      
      await firebaseAuthService.signOutFromFirebase()
      console.log('🚪 Firebase sign-out completed successfully')
      
      setHasAttemptedAutoInit(false) // Reset flag on sign out
      console.log('🚪 Reset hasAttemptedAutoInit to false')
      
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

  const manualSignInToFirebase = async () => {
    setHasAttemptedAutoInit(false) // Reset flag for manual sign-in
    setUserExplicitlySignedOut(false) // Clear explicit sign-out flag for manual sign-in
    setLastSignOutTime(null) // Clear the last sign-out time for manual sign-in
    setIsLoggingOut(false) // Clear logout state for manual sign-in
    
    // Clear global flags as well
    globalUserExplicitlySignedOut = false
    globalLastSignOutTime = null
    
    return signInToFirebase()
  }

  const clearSignOutState = () => {
    setUserExplicitlySignedOut(false)
    setLastSignOutTime(null)
    setHasAttemptedAutoInit(false)
    setIsLoggingOut(false) // Also clear the logout state
    
    // Clear global flags as well
    globalUserExplicitlySignedOut = false
    globalLastSignOutTime = null
    
    console.log('🧹 Cleared sign-out state - ready for new authentication')
  }

  const value: FirebaseAuthContextType = {
    isFirebaseAuthenticated,
    firebaseUser,
    isLoading,
    error,
    signInToFirebase: manualSignInToFirebase,
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
  if (!context) {
    throw new Error('useFirebaseAuth must be used within a FirebaseAuthProvider')
  }
  return context
} 