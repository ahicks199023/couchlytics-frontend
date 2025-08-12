import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { 
  getAuth, 
  signInWithCustomToken, 
  onAuthStateChanged, 
  User, 
  signOut as firebaseSignOut 
} from 'firebase/auth'
import { http } from '@/lib/http'

// Export User type for use in other components
export type { User } from 'firebase/auth'

// Helper function to get email from Firebase user
export const getFirebaseUserEmail = (user: User | null): string => {
  if (!user) return ''
  
  // Check for custom email property first (from Couchlytics)
  const userWithCustomEmail = user as User & { couchlyticsEmail?: string }
  if (userWithCustomEmail.couchlyticsEmail) {
    return userWithCustomEmail.couchlyticsEmail
  }
  
  // Fall back to standard email field
  return user.email || ''
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyC...", // Replace with your actual config
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "couchlytics-3a2b5.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "couchlytics-3a2b5",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "couchlytics-3a2b5.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firestore
export const db = getFirestore(app)

// Initialize Auth
export const auth = getAuth(app)

// Firebase Authentication Service Class
class FirebaseAuthService {
  private auth = auth
  private user: User | null = null
  private isAuthenticated = false
  private listeners: Array<() => void> = []

  /**
   * Get Firebase custom token from Couchlytics backend
   */
  async getFirebaseToken(): Promise<string> {
    try {
      console.log('🔑 Requesting Firebase token via axios client')
      const response = await http.get('/api/firebase-token')

      console.log('🔑 Token response status:', response.status)
      console.log('🔑 Token response data present:', !!response.data)

      if (response.status !== 200) {
        if (response.status === 302) {
          // Redirect to Couchlytics login
          window.location.href = '/login'
          throw new Error('User not authenticated with Couchlytics')
        }
        
        const errorData = response.data || {}
        console.error('🔑 Token error data:', errorData)
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }

      const data = response.data
      console.log('🔑 Token response data:', data)
      console.log('🔑 Token received:', data.token ? 'Yes' : 'No')
      
      return data.token
    } catch (error) {
      console.error('❌ Error getting Firebase token:', error)
      throw new Error(`Failed to get Firebase token: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Sign into Firebase using custom token
   */
  async signInToFirebase(): Promise<User> {
    try {
      // Get custom token from Couchlytics backend
      const customToken = await this.getFirebaseToken()
      console.log('🔑 Got custom token:', customToken ? 'Token received' : 'No token')
      
      // Sign into Firebase with custom token
      const userCredential = await signInWithCustomToken(this.auth, customToken)
      console.log('👤 User credential:', userCredential)
      console.log('👤 User object:', userCredential.user)
      console.log('👤 User email:', userCredential.user?.email)
      console.log('👤 User UID:', userCredential.user?.uid)
      
      if (userCredential.user) {
        // Get the email from the token response, not from user.email
        const tokenResponse = await http.get('/api/firebase-token')
        
        let tokenData: { email?: string; token?: string } | null = null
        if (tokenResponse.status === 200) {
          tokenData = tokenResponse.data as { email?: string; token?: string }
          console.log('🔑 Token data with email:', tokenData)
          
          // Update the user profile with display name if email is available
          if (tokenData && tokenData.email && !userCredential.user.displayName) {
            try {
              const { updateProfile } = await import('firebase/auth')
              await updateProfile(userCredential.user, {
                displayName: tokenData.email.split('@')[0]
              })
              console.log('✅ Updated Firebase user profile with display name')
            } catch (profileError) {
              console.warn('⚠️ Could not update user profile:', profileError)
            }
          }
        }
        
        // Force refresh the user to get updated claims
        await userCredential.user.reload()
        console.log('👤 After reload - User email:', userCredential.user.email)
        console.log('👤 After reload - User UID:', userCredential.user.uid)
        
        // Get user claims
        const idTokenResult = await userCredential.user.getIdTokenResult()
        console.log('👤 User claims:', idTokenResult.claims)
        
        // Store the email in the user object for later use
        // Note: We can't modify the email field directly, but we can store it in a custom property
        const userWithEmail = userCredential.user as User & { couchlyticsEmail?: string }
        if (tokenData?.email) {
          (userWithEmail as User & { couchlyticsEmail?: string }).couchlyticsEmail = tokenData.email
        }
        
        this.user = userWithEmail
        this.isAuthenticated = true
        
        console.log('✅ Successfully signed into Firebase:', tokenData?.email || userCredential.user.email || 'No email')
        return userWithEmail
      } else {
        throw new Error('Firebase sign-in succeeded but user object is null')
      }
    } catch (error) {
      console.error('❌ Error signing into Firebase:', error)
      this.isAuthenticated = false
      this.user = null
      throw error
    }
  }

  /**
   * Sign out from Firebase
   */
  async signOutFromFirebase(): Promise<void> {
    try {
      await firebaseSignOut(this.auth)
      this.user = null
      this.isAuthenticated = false
      console.log('✅ Successfully signed out from Firebase')
    } catch (error) {
      console.error('❌ Error signing out from Firebase:', error)
      throw error
    }
  }

  /**
   * Check if user is authenticated with Firebase
   */
  isFirebaseAuthenticated(): boolean {
    return this.isAuthenticated && this.auth.currentUser !== null
  }

  /**
   * Get current Firebase user
   */
  getCurrentFirebaseUser(): User | null {
    return this.auth.currentUser
  }

  /**
   * Listen to Firebase authentication state changes
   */
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(this.auth, (user) => {
      this.user = user
      this.isAuthenticated = !!user
      callback(user)
    })
  }

  /**
   * Get user claims (Couchlytics user ID, etc.)
   */
  async getUserClaims(): Promise<Record<string, unknown> | null> {
    if (!this.user) return null
    
    try {
      const idTokenResult = await this.user.getIdTokenResult()
      return idTokenResult.claims
    } catch (error) {
      console.error('Error getting user claims:', error)
      return null
    }
  }

  /**
   * Get Couchlytics user ID from claims
   */
  async getCouchlyticsUserId(): Promise<string | null> {
    const claims = await this.getUserClaims()
    return claims?.couchlytics_user_id as string | null
  }

  /**
   * Force refresh user token
   */
  async refreshToken(): Promise<string | null> {
    if (!this.user) return null
    
    try {
      const token = await this.user.getIdToken(true)
      return token
    } catch (error) {
      console.error('Error refreshing token:', error)
      throw error
    }
  }

  /**
   * Test Firebase health
   */
  async testFirebaseHealth(): Promise<boolean> {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.couchlytics.com'}/api/firebase-token/health`)
      const data = await response.json()
      console.log('Firebase health:', data)
      return data.status === 'healthy'
    } catch (error) {
      console.error('Firebase health check failed:', error)
      return false
    }
  }

  /**
   * Debug Firebase authentication
   */
  async debugFirebaseAuth(): Promise<void> {
    try {
      console.log('🔍 Debugging Firebase Authentication...')
      
      // 1. Check Firebase config
      console.log('Firebase config available:', !!this.auth)
      
      // 2. Get token from backend
        const tokenResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.couchlytics.com'}/api/firebase-token`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json()
        console.log('Token response:', tokenData)
        
        // 3. Sign in with token
        const userCredential = await signInWithCustomToken(this.auth, tokenData.token)
        const user = userCredential.user
        console.log('Firebase user object:', user)
        console.log('User email:', user.email)
        console.log('User UID:', user.uid)
        
        // 4. Check if user is authenticated
        console.log('Is authenticated:', !!user)
        console.log('Auth state:', this.auth.currentUser)
        
        // 5. Get user claims
        const idTokenResult = await user.getIdTokenResult()
        console.log('User claims:', idTokenResult.claims)
        
      } else {
        console.error('Token request failed:', tokenResponse.status, tokenResponse.statusText)
      }
      
    } catch (error) {
      console.error('❌ Debug error:', error)
    }
  }
}

// Export singleton instance
export const firebaseAuthService = new FirebaseAuthService()

// Legacy functions for backward compatibility
export const getFirebaseToken = async (): Promise<string> => {
  return firebaseAuthService.getFirebaseToken()
}

export const signInWithCouchlytics = async (): Promise<User> => {
  return firebaseAuthService.signInToFirebase()
}

export const getCurrentFirebaseUser = (): User | null => {
  return firebaseAuthService.getCurrentFirebaseUser()
}

export const onFirebaseAuthStateChanged = (callback: (user: User | null) => void) => {
  return firebaseAuthService.onAuthStateChanged(callback)
}

export const signOutFromFirebase = async (): Promise<void> => {
  return firebaseAuthService.signOutFromFirebase()
}

export const debugFirebaseAuth = async (): Promise<void> => {
  return firebaseAuthService.debugFirebaseAuth()
}

export default app 