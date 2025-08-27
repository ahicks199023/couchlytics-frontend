import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';

class FirebaseAuthManager {
  private isLoggingOut = false;
  private authStateUnsubscribe: (() => void) | null = null;
  private logoutTimestamp: number | null = null;

  constructor() {
    console.log('🔧 FirebaseAuthManager initialized');
  }

  // Initialize Firebase auth state listener
  initAuthStateListener() {
    if (this.authStateUnsubscribe) {
      this.authStateUnsubscribe();
    }

    this.authStateUnsubscribe = onAuthStateChanged(auth, (user) => {
      // Prevent auth state changes during logout
      if (this.isLoggingOut) {
        console.log('🔒 Auth state change blocked - logout in progress');
        return;
      }

      // Check if user recently logged out
      if (this.logoutTimestamp && Date.now() - this.logoutTimestamp < 5000) {
        console.log('🔒 Auth state change blocked - recent logout');
        return;
      }

      if (user) {
        console.log('✅ Firebase user authenticated:', user.email);
        this.handleUserLogin(user);
      } else {
        console.log('🚪 Firebase user signed out');
        this.handleUserLogout();
      }
    });
  }

  // Handle user login
  private async handleUserLogin(firebaseUser: User) {
    try {
      // Only proceed if not logging out
      if (this.isLoggingOut) return;

      console.log('🔄 Syncing Firebase user with backend session...');

      // Sync with backend session
      const response = await fetch('/backend-api/auth/sync-firebase', {
        method: 'POST',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          firebase_uid: firebaseUser.uid,
          email: firebaseUser.email,
          display_name: firebaseUser.displayName
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Firebase and backend session synced:', data);
      } else {
        console.warn('⚠️ Failed to sync Firebase with backend:', response.status);
      }
    } catch (error) {
      console.error('❌ Error syncing Firebase with backend:', error);
    }
  }

  // Handle user logout
  private handleUserLogout() {
    // Only proceed if not logging out
    if (this.isLoggingOut) return;
    
    console.log('🚪 Firebase user logged out - clearing frontend state');
    // Clear any Firebase-specific state
    this.clearLocalState();
  }

  // Start logout process
  startLogout() {
    this.isLoggingOut = true;
    this.logoutTimestamp = Date.now();
    console.log('🔄 Starting Firebase logout process');
  }

  // Complete logout process
  completeLogout() {
    this.isLoggingOut = false;
    this.logoutTimestamp = null;
    console.log('✅ Firebase logout process completed');
  }

  // Clear local storage and state
  private clearLocalState() {
    try {
      localStorage.removeItem('user');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('firebase_user');
      sessionStorage.clear();
      console.log('✅ Local state cleared');
    } catch (error) {
      console.error('❌ Error clearing local state:', error);
    }
  }

  // Get current logout state
  isCurrentlyLoggingOut(): boolean {
    return this.isLoggingOut;
  }

  // Force sign out from Firebase
  async signOutFromFirebase() {
    try {
      await signOut(auth);
      console.log('✅ Firebase signout completed');
    } catch (error) {
      console.error('❌ Error signing out from Firebase:', error);
      throw error;
    }
  }

  // Cleanup
  cleanup() {
    if (this.authStateUnsubscribe) {
      this.authStateUnsubscribe();
      this.authStateUnsubscribe = null;
    }
    console.log('🧹 FirebaseAuthManager cleanup completed');
  }
}

// Create singleton instance
export const firebaseAuthManager = new FirebaseAuthManager();
export default FirebaseAuthManager;
