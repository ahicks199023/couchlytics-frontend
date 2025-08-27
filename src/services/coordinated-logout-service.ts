import { firebaseAuthManager } from './firebase-auth-manager';

class CoordinatedLogoutService {
  private isLoggingOut = false;

  constructor() {
    console.log('🔧 CoordinatedLogoutService initialized');
  }

  async logout(): Promise<void> {
    if (this.isLoggingOut) {
      console.log('Logout already in progress, skipping...');
      return;
    }

    try {
      this.isLoggingOut = true;
      console.log('🔄 Starting coordinated logout...');

      // 1. Start Firebase logout process
      firebaseAuthManager.startLogout();

      // 2. Call backend logout first (to clear sessions)
      try {
        console.log('🔄 Calling backend logout...');
        const response = await fetch('/backend-api/auth/logout', {
          method: 'POST',
          credentials: 'include',
          headers: { 
            'Content-Type': 'application/json' 
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Backend logout completed:', data);
        } else {
          console.warn('⚠️ Backend logout failed, continuing...', response.status);
        }
      } catch (backendError) {
        console.warn('⚠️ Backend logout error, continuing with Firebase logout:', backendError);
      }

      // 3. Sign out from Firebase
      try {
        console.log('🔄 Signing out from Firebase...');
        await firebaseAuthManager.signOutFromFirebase();
      } catch (firebaseError) {
        console.error('❌ Firebase signout error:', firebaseError);
      }

      // 4. Complete Firebase logout process
      firebaseAuthManager.completeLogout();

      // 5. Clear frontend state and redirect
      this.clearFrontendState();

      console.log('✅ Coordinated logout completed successfully');

    } catch (error) {
      console.error('❌ Error during coordinated logout:', error);
    } finally {
      this.isLoggingOut = false;
    }
  }

  private clearFrontendState(): void {
    try {
      console.log('🧹 Clearing frontend state...');
      
      // Clear localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('firebase_user');
      localStorage.removeItem('league_id');
      localStorage.removeItem('user_permissions');

      // Clear sessionStorage
      sessionStorage.clear();

      // Clear any other application-specific storage
      this.clearApplicationState();

      console.log('✅ Frontend state cleared');

      // Redirect to login page after a short delay to ensure cleanup
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);

    } catch (error) {
      console.error('❌ Error clearing frontend state:', error);
      // Force redirect even if cleanup fails
      window.location.href = '/login';
    }
  }

  private clearApplicationState(): void {
    // Add any application-specific state clearing here
    // For example, clearing Zustand stores, Redux state, etc.
    console.log('🧹 Clearing application-specific state...');
  }

  // Get current logout state
  isCurrentlyLoggingOut(): boolean {
    return this.isLoggingOut;
  }

  // Emergency logout (force logout even if things fail)
  async emergencyLogout(): Promise<void> {
    console.log('🚨 Emergency logout initiated');
    
    try {
      // Force Firebase logout
      firebaseAuthManager.startLogout();
      await firebaseAuthManager.signOutFromFirebase();
      firebaseAuthManager.completeLogout();
    } catch (error) {
      console.error('❌ Emergency Firebase logout failed:', error);
    }

    // Clear everything and redirect
    this.clearFrontendState();
  }
}

// Create singleton instance
export const coordinatedLogoutService = new CoordinatedLogoutService();
export default CoordinatedLogoutService;
