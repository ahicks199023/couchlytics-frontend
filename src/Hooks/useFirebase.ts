import { useState, useEffect, useCallback } from 'react'
import { User } from 'firebase/auth'
import { 
  signInWithCouchlytics, 
  onFirebaseAuthStateChanged,
  signOutFromFirebase 
} from '@/lib/firebase'
import useAuth from './useAuth'

export interface UseFirebaseReturn {
  firebaseUser: User | null
  isFirebaseLoading: boolean
  firebaseError: string | null
  isFirebaseAuthenticated: boolean
  initializeFirebaseAuth: () => Promise<void>
  signOutFromFirebase: () => Promise<void>
  refreshFirebaseAuth: () => Promise<void>
}

export default function useFirebase(): UseFirebaseReturn {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null)
  const [isFirebaseLoading, setIsFirebaseLoading] = useState(true)
  const [firebaseError, setFirebaseError] = useState<string | null>(null)
  const { authenticated, user: couchlyticsUser } = useAuth()

  const initializeFirebaseAuth = useCallback(async () => {
    try {
      setIsFirebaseLoading(true)
      setFirebaseError(null)
      
      const user = await signInWithCouchlytics()
      setFirebaseUser(user)
      
      console.log('✅ Firebase authentication initialized')
    } catch (error) {
      console.error('❌ Firebase authentication failed:', error)
      setFirebaseError(error instanceof Error ? error.message : 'Firebase authentication failed')
    } finally {
      setIsFirebaseLoading(false)
    }
  }, [])

  const handleFirebaseSignOut = useCallback(async () => {
    try {
      await signOutFromFirebase()
      setFirebaseUser(null)
      setFirebaseError(null)
    } catch (error) {
      console.error('❌ Firebase sign-out failed:', error)
      setFirebaseError(error instanceof Error ? error.message : 'Firebase sign-out failed')
    }
  }, [])

  // Initialize Firebase authentication when Couchlytics user is authenticated
  useEffect(() => {
    if (authenticated && couchlyticsUser && !firebaseUser) {
      initializeFirebaseAuth()
    } else if (!authenticated && firebaseUser) {
      // Sign out from Firebase when Couchlytics user is not authenticated
      handleFirebaseSignOut()
    }
  }, [authenticated, couchlyticsUser, firebaseUser, initializeFirebaseAuth, handleFirebaseSignOut])

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onFirebaseAuthStateChanged((user) => {
      setFirebaseUser(user)
      setIsFirebaseLoading(false)
      
      if (user) {
        console.log('Firebase user authenticated:', user.email)
        setFirebaseError(null)
      } else {
        console.log('Firebase user signed out')
      }
    })

    return () => unsubscribe()
  }, [])

  const refreshFirebaseAuth = useCallback(async () => {
    if (authenticated && couchlyticsUser) {
      await initializeFirebaseAuth()
    }
  }, [authenticated, couchlyticsUser, initializeFirebaseAuth])

  return {
    firebaseUser,
    isFirebaseLoading,
    firebaseError,
    isFirebaseAuthenticated: !!firebaseUser,
    initializeFirebaseAuth,
    signOutFromFirebase: handleFirebaseSignOut,
    refreshFirebaseAuth
  }
}