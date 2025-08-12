'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react'
import { User, UserRole, Permission } from '@/types/user'
import { http, API_BASE_URL } from '@/lib/http'
import { firebaseAuthService } from '@/lib/firebase'
import { User as FirebaseUser } from 'firebase/auth'

interface AuthContextType {
  // Couchlytics authentication state
  user: User | null
  loading: boolean
  authenticated: boolean
  
  // Firebase authentication state
  firebaseUser: FirebaseUser | null
  isFirebaseAuthenticated: boolean
  
  // Authentication methods
  checkAuthStatus: () => Promise<void>
  logout: () => Promise<void>
  hasPermission: (permission: Permission) => boolean
  hasRole: (role: UserRole) => boolean
  isCommissioner: () => boolean
  isAdmin: () => boolean
  loginWithGoogle: () => void
  loginWithDiscord: () => void
  refetch: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [authenticated, setAuthenticated] = useState<boolean>(false)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [isFirebaseAuthenticated, setIsFirebaseAuthenticated] = useState<boolean>(false)
  const isLoggingOut = useRef<boolean>(false)

  const checkAuthStatus = useCallback(async () => {
    // Don't check auth status if we're in the process of logging out
    if (isLoggingOut.current) {
      console.log('🚫 Auth check blocked - logout in progress')
      return
    }

    try {
      console.log('🔍 Checking Couchlytics auth status...')
      const response = await http.get('/auth/status')
      
      console.log('🔍 Auth status response:', response.status, response.statusText)
      
      if (response.status === 200) {
        const data = response.data
        console.log('🔍 Auth status data:', data)
        
        if (data.authenticated) {
          console.log('✅ Couchlytics user is authenticated:', data.user)
          setUser(data.user)
          setAuthenticated(true)
        } else {
          console.log('❌ Couchlytics user is not authenticated')
          setUser(null)
          setAuthenticated(false)
        }
      } else {
        console.log('❌ Auth status check failed with status:', response.status)
        setUser(null)
        setAuthenticated(false)
      }
    } catch (error) {
      console.error('❌ Auth status check failed:', error)
      setUser(null)
      setAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchUser = useCallback(async () => {
    // Don't fetch user if we're logging out
    if (isLoggingOut.current) {
      return
    }

    try {
      const response = await http.get('/auth/user')
      
      if (response.status === 200) {
        const userData = response.data
        setUser(userData)
        setAuthenticated(true)
      } else {
        setUser(null)
        setAuthenticated(false)
      }
    } catch (error) {
      console.error('Auth error:', error)
      setUser(null)
      setAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }, [])

  // Listen to Firebase auth state changes
  useEffect(() => {
    if (isLoggingOut.current) {
      console.log('🚫 Firebase auth listener disabled - logout in progress')
      return
    }

    const unsubscribe = firebaseAuthService.onAuthStateChanged((user: FirebaseUser | null) => {
      console.log('🔥 Firebase auth state changed:', user ? 'User signed in' : 'User signed out')
      
      setFirebaseUser(user)
      setIsFirebaseAuthenticated(!!user)
      
      if (user) {
        console.log('✅ Firebase user authenticated:', user.email)
      } else {
        console.log('🚪 Firebase user signed out')
      }
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    // Only check auth status if we're not in the process of logging out
    if (!isLoggingOut.current) {
      checkAuthStatus()
    }
  }, [checkAuthStatus])

  const hasPermission = useCallback((permission: Permission): boolean => {
    if (!user) return false
    return user.permissions.includes(permission)
  }, [user])

  const hasRole = useCallback((role: UserRole): boolean => {
    if (!user) return false
    return user.role === role
  }, [user])

  const isCommissioner = useCallback((): boolean => {
    return hasRole(UserRole.COMMISSIONER) || hasRole(UserRole.ADMIN) || hasRole(UserRole.SUPER_ADMIN)
  }, [hasRole])

  const isAdmin = useCallback((): boolean => {
    return hasRole(UserRole.ADMIN) || hasRole(UserRole.SUPER_ADMIN)
  }, [hasRole])

  const logout = useCallback(async () => {
    // Set logging out flag to prevent auth checks
    isLoggingOut.current = true
    
    try {
      // Clear local state immediately
      setUser(null)
      setAuthenticated(false)
      setLoading(false)
      setFirebaseUser(null)
      setIsFirebaseAuthenticated(false)
      
      // Sign out from Firebase first
      try {
        console.log('🚪 Signing out from Firebase...')
        await firebaseAuthService.signOutFromFirebase()
        console.log('✅ Firebase sign-out successful')
      } catch (firebaseError) {
        console.warn('⚠️ Firebase sign-out failed:', firebaseError)
        // Continue with logout even if Firebase fails
      }
      
      // Call logout endpoint
      await http.post('/auth/logout')
      
      // Clear any cached data
      if (typeof window !== 'undefined') {
        // Clear any localStorage/sessionStorage if used
        localStorage.removeItem('auth_token')
        sessionStorage.removeItem('auth_token')
        
        // Clear any cached API responses
        if ('caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => {
              caches.delete(name)
            })
          })
        }
      }
      
      // Keep the logout flag active for a longer period to prevent re-auth
      setTimeout(() => {
        isLoggingOut.current = false
        console.log('🔓 Logout protection disabled')
      }, 5000) // 5 second protection
      
      // Add a small delay before redirect to ensure logout completes
      setTimeout(() => {
        window.location.href = '/'
      }, 100)
      
    } catch (error) {
      console.error('Logout error:', error)
      // Even if logout fails, redirect to home
      setTimeout(() => {
        window.location.href = '/'
      }, 100)
    }
  }, [])

  const loginWithGoogle = useCallback(() => {
    window.location.href = `${API_BASE_URL}/auth/login/google`
  }, [])

  const loginWithDiscord = useCallback(() => {
    window.location.href = `${API_BASE_URL}/auth/login/discord`
  }, [])

  const value: AuthContextType = {
    user,
    loading,
    authenticated,
    firebaseUser,
    isFirebaseAuthenticated,
    hasPermission,
    hasRole,
    isCommissioner,
    isAdmin,
    logout,
    loginWithGoogle,
    loginWithDiscord,
    refetch: fetchUser,
    checkAuthStatus
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 