import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { 
  getAuth, 
  signInWithCustomToken, 
  onAuthStateChanged, 
  User, 
  signOut as firebaseSignOut 
} from 'firebase/auth'
import { API_BASE } from './config'

// Export User type for use in other components
export type { User } from 'firebase/auth'

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
      const response = await fetch(`${API_BASE}/api/firebase-token`, {
        method: 'GET',
        credentials: 'include', // Important: Include session cookies
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        if (response.status === 302) {
          // Redirect to Couchlytics login
          window.location.href = '/login'
          throw new Error('User not authenticated with Couchlytics')
        }
        
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data.token
    } catch (error) {
      console.error('Error getting Firebase token:', error)
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
      
      // Sign into Firebase with custom token
      const userCredential = await signInWithCustomToken(this.auth, customToken)
      this.user = userCredential.user
      this.isAuthenticated = true
      
      console.log('✅ Successfully signed into Firebase:', userCredential.user.email)
      return userCredential.user
    } catch (error) {
      console.error('❌ Error signing into Firebase:', error)
      this.isAuthenticated = false
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
      const response = await fetch(`${API_BASE}/api/firebase-token/health`)
      const data = await response.json()
      console.log('Firebase health:', data)
      return data.status === 'healthy'
    } catch (error) {
      console.error('Firebase health check failed:', error)
      return false
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

export default app 