'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { firebaseAuthService, getFirebaseUserEmail } from '@/lib/firebase'
import type { User } from '@/lib/firebase'
import { establishBackendSession, fetchUserLeagues } from '@/lib/api-utils'
import { firebaseAuthManager } from '@/services/firebase-auth-manager'
import { coordinatedLogoutService } from '@/services/coordinated-logout-service'

interface FirebaseAuthContextType {
  isFirebaseAuthenticated: boolean
  firebaseUser: User | null
  isLoading: boolean
  error: string | null
  isLoggingOut: boolean
  authState: 'checking' | 'authenticated' | 'unauthenticated'
  signInToFirebase: () => Promise<void>
  signOutFromFirebase: () => Promise<void>
  refreshToken: () => Promise<void>
  testHealth: () => Promise<boolean>
  clearSignOutState: () => void
  fetchUserLeagues: () => Promise<{ leagues: Array<{ leagueId: string; name: string; seasonYear: number; week: number }> }>
}

interface FirebaseAuthProviderProps {
  children: ReactNode
}

export const FirebaseAuthContext = createContext<FirebaseAuthContextType | undefined>(undefined)

export const FirebaseAuthProvider: React.FC<FirebaseAuthProviderProps> = ({ children }) => {
  const [isFirebaseAuthenticated, setIsFirebaseAuthenticated] = useState(false)
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [authState, setAuthState] = useState<'checking' | 'authenticated' | 'unauthenticated'>('checking')

  // Initialize Firebase Auth Manager and check session
  useEffect(() => {
    console.log('🔧 Initializing Firebase Auth Manager...')
    
    // Initialize the auth manager
    firebaseAuthManager.initAuthStateListener()
    
    const checkAuthStatus = async () => {
      try {
        console.log('🔍 Checking existing backend session...')
        
        // First check if we have a valid backend session
        const response = await fetch('/backend-api/auth/status', {
          credentials: 'include'
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.authenticated) {
            console.log('✅ Backend session valid')
            setAuthState('authenticated')
            setIsFirebaseAuthenticated(true)
            setIsLoading(false)
            return
          }
        }
        
        // If no backend session, check Firebase
        const firebaseUser = firebaseAuthService.getCurrentFirebaseUser()
        if (firebaseUser) {
          console.log('🔥 Firebase user exists, establishing backend session')
          const success = await establishBackendSession(firebaseUser)
          if (success) {
            setAuthState('authenticated')
            setIsFirebaseAuthenticated(true)
          } else {
            setAuthState('unauthenticated')
          }
        } else {
          setAuthState('unauthenticated')
        }
      } catch (error) {
        console.error('❌ Auth check failed:', error)
        setAuthState('unauthenticated')
      } finally {
        setIsLoading(false)
      }
    }
    
    checkAuthStatus()
    
    // Cleanup on unmount
    return () => {
      firebaseAuthManager.cleanup()
    }
  }, [])

  useEffect(() => {
    // Don't listen to auth changes if we're logging out or if Firebase Auth Manager is handling it
    if (isLoggingOut || firebaseAuthManager.isCurrentlyLoggingOut()) {
      console.log('🚫 Firebase auth listener disabled - logout in progress')
      return
    }

    const unsubscribe = firebaseAuthService.onAuthStateChanged(async (user: User | null) => {
      // Double-check logout state (coordinated with Firebase Auth Manager)
      if (firebaseAuthManager.isCurrentlyLoggingOut() || coordinatedLogoutService.isCurrentlyLoggingOut()) {
        console.log('🚫 Auth state change blocked - logout in progress')
        return
      }

      console.log('🔥 Firebase auth state changed:', user ? 'User signed in' : 'User signed out')

      if (user && !getFirebaseUserEmail(user)) {
        console.warn('⚠️ Firebase user missing email, may need re-authentication')
      }

      if (user) {
        console.log('✅ Firebase user authenticated:', getFirebaseUserEmail(user))
        setFirebaseUser(user)
        setIsFirebaseAuthenticated(true)
        
        // Establish backend session when Firebase user signs in
        try {
          const success = await establishBackendSession(user)
          if (success) {
            setAuthState('authenticated')
            console.log('✅ Backend session established from Firebase auth')
          } else {
            setAuthState('unauthenticated')
            console.error('❌ Failed to establish backend session')
          }
        } catch (error) {
          console.error('❌ Error establishing backend session:', error)
          setAuthState('unauthenticated')
        }
      } else {
        console.log('🚪 Firebase user signed out')
        setFirebaseUser(null)
        setIsFirebaseAuthenticated(false)
        setAuthState('unauthenticated')
      }
      
      setIsLoading(false)
      setError(null)
    })

    return () => unsubscribe()
  }, [isLoggingOut])

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
      console.log('🚪 Starting coordinated logout process...')
      setIsLoading(true)
      setError(null)
      setIsLoggingOut(true) // Set logout flag
      
      // Use the coordinated logout service
      await coordinatedLogoutService.logout()
      
      // Force clear Firebase authentication state
      setIsFirebaseAuthenticated(false)
      setFirebaseUser(null)
      setAuthState('unauthenticated')
      console.log('🚪 Cleared Firebase authentication state')
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign out failed'
      setError(errorMessage)
      console.error('❌ Failed to sign out from Firebase:', error)
      
      // Try emergency logout if coordinated logout fails
      try {
        await coordinatedLogoutService.emergencyLogout()
      } catch (emergencyError) {
        console.error('❌ Emergency logout also failed:', emergencyError)
      }
      
      throw error
    } finally {
      setIsLoading(false)
      console.log('🚪 Sign-out process completed, isLoading set to false')
    }
    
    // Keep logout flag active for a longer period to prevent re-auth
    setTimeout(() => {
      setIsLoggingOut(false)
      console.log('🔓 Firebase logout protection disabled')
    }, 5000) // 5 second protection
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

  const fetchUserLeaguesFromContext = async () => {
    try {
      return await fetchUserLeagues()
    } catch (error) {
      console.error('❌ Error fetching user leagues from context:', error)
      throw error
    }
  }

  const value: FirebaseAuthContextType = {
    isFirebaseAuthenticated,
    firebaseUser,
    isLoading,
    error,
    isLoggingOut,
    authState,
    signInToFirebase,
    signOutFromFirebase,
    refreshToken,
    testHealth,
    clearSignOutState,
    fetchUserLeagues: fetchUserLeaguesFromContext
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