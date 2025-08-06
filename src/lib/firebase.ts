import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth, signInWithCustomToken, onAuthStateChanged, User } from 'firebase/auth'
import { API_BASE } from './config'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firestore
export const db = getFirestore(app)

// Initialize Auth
export const auth = getAuth(app)

// Firebase Authentication Functions
export const getFirebaseToken = async (): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE}/api/firebase-token`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Failed to get Firebase token')
    }

    const data = await response.json()
    return data.token
  } catch (error) {
    console.error('Error getting Firebase token:', error)
    throw error
  }
}

export const signInWithCouchlytics = async (): Promise<User> => {
  try {
    // Get Firebase token from Couchlytics backend
    const token = await getFirebaseToken()
    
    // Sign in to Firebase with custom token
    const userCredential = await signInWithCustomToken(auth, token)
    const user = userCredential.user
    
    console.log('✅ Signed in to Firebase:', user.email)
    return user
  } catch (error) {
    console.error('❌ Firebase sign-in failed:', error)
    throw error
  }
}

export const getCurrentFirebaseUser = (): User | null => {
  return auth.currentUser
}

export const onFirebaseAuthStateChanged = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback)
}

export const signOutFromFirebase = async (): Promise<void> => {
  try {
    await auth.signOut()
    console.log('✅ Signed out from Firebase')
  } catch (error) {
    console.error('❌ Firebase sign-out failed:', error)
    throw error
  }
}

export default app 