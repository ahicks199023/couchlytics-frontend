'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react'
import { User, UserRole, Permission } from '@/types/user'
import { http, API_BASE_URL } from '@/lib/http'
import { firebaseAuthService } from '@/lib/firebase'
import { User as FirebaseUser } from 'firebase/auth'
import { establishBackendSession } from '@/lib/api-utils'

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

interface AuthProviderProps {
  children: ReactNode
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

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
      const data = response.data
      
      if (data.authenticated) {
        console.log('✅ Couchlytics user is authenticated:', data.user)
        setUser(data.user)
        setAuthenticated(true)
      } else {
        console.log('❌ Couchlytics user is not authenticated')
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
      // Use new endpoint that includes memberships and isAdmin
      const response = await http.get('/auth/me')
      
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

    const unsubscribe = firebaseAuthService.onAuthStateChanged(async (user: FirebaseUser | null) => {
      console.log('🔥 Firebase auth state changed:', user ? 'User signed in' : 'User signed out')
      
      setFirebaseUser(user)
      setIsFirebaseAuthenticated(!!user)
      
      if (user) {
        console.log('✅ Firebase user authenticated:', user.email)
        // Try to establish backend session
        try {
          const success = await establishBackendSession(user)
          if (success) {
            console.log('✅ Backend session established from Firebase auth')
            // Refresh auth status
            await checkAuthStatus()
          }
        } catch (error) {
          console.error('❌ Failed to establish backend session:', error)
        }
      } else {
        console.log('🚪 Firebase user signed out')
      }
    })

    return () => unsubscribe()
  }, [checkAuthStatus])

  // Check for existing session on app load
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        console.log('🔍 Checking for existing session...')
        const response = await http.get('/auth/status')
        const data = response.data
        
        if (data.authenticated) {
          console.log('✅ Existing session found')
          setUser(data.user)
          setAuthenticated(true)
        }
      } catch (error) {
        console.error('❌ Session check failed:', error)
      } finally {
        setLoading(false)
      }
    }
    
    checkExistingSession()
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
    // Check for specific developer email
    if (user?.email === 'antoinehickssales@gmail.com') {
      return true
    }
    return hasRole(UserRole.ADMIN) || hasRole(UserRole.SUPER_ADMIN)
  }, [hasRole, user?.email])

  const logout = useCallback(async () => {
    // Set logging out flag to prevent auth checks
    isLoggingOut.current = true

    try {
      console.log('🚪 Starting logout process...')
      
      // 1. Call backend logout endpoint FIRST to terminate session
      try {
        console.log('🔗 Calling backend logout endpoint...')
        const response = await http.post('/auth/logout')
        console.log('✅ Backend logout successful:', response.status)
      } catch (backendError) {
        console.error('❌ Backend logout failed:', backendError)
        // Continue with logout even if backend fails
      }
      
      // 2. Sign out from Firebase
      try {
        console.log('🔥 Signing out from Firebase...')
        await firebaseAuthService.signOutFromFirebase()
        console.log('✅ Firebase logout successful')
      } catch (firebaseError) {
        console.error('❌ Firebase logout failed:', firebaseError)
        // Continue with logout even if Firebase fails
      }
      
      // 3. Clear local state
      console.log('🧹 Clearing local authentication state...')
      setUser(null)
      setAuthenticated(false)
      setFirebaseUser(null)
      setIsFirebaseAuthenticated(false)
      
      // 4. Clear any cached data
      if (typeof window !== 'undefined') {
        // Clear localStorage/sessionStorage
        localStorage.removeItem('auth_token')
        sessionStorage.removeItem('auth_token')
        localStorage.removeItem('user')
        
        // Clear any cached API responses
        if ('caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => {
              caches.delete(name)
            })
          })
        }
      }
      
      console.log('✅ Logout completed successfully')
      
      // 5. Redirect to home
      setTimeout(() => {
        window.location.href = '/'
      }, 100)
      
    } catch (error) {
      console.error('❌ Logout error:', error)
      // Even if logout fails, redirect to home
      setTimeout(() => {
        window.location.href = '/'
      }, 100)
    } finally {
      // Reset logout flag after a delay
      setTimeout(() => {
        isLoggingOut.current = false
      }, 2000)
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