// components/Login.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/config";
import { useAuth } from "@/contexts/AuthContext";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const router = useRouter();
  const { user, loading, checkAuthStatus } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user) {
      router.push("/leagues");
    }
  }, [user, loading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleNativeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading('native');
    setError(null);

    try {
      console.log('🔐 Attempting native login...');
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      console.log('🔐 Login response status:', response.status);
      console.log('🔐 Response headers:', Object.fromEntries(response.headers.entries()));
      console.log('🔐 Cookies before login:', document.cookie);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔐 Login response data:', data);
        console.log('🔐 Response structure check:', {
          hasUser: !!data.user,
          hasMessage: !!data.message,
          message: data.message,
          hasAuthenticated: 'authenticated' in data,
          authenticated: data.authenticated,
          responseKeys: Object.keys(data)
        });
        
        // Check if we have user data in the response (indicating successful login)
        if (data.user && data.message === 'Login successful') {
          console.log('✅ Couchlytics authentication successful');
          
          // Check if we have a Firebase token in the response
          if (data.firebase_token) {
            console.log('🔥 Firebase token received, signing in with Firebase...');
            
            try {
              // Sign in with Firebase using the custom token
              const userCredential = await signInWithCustomToken(auth, data.firebase_token);
              console.log('✅ Successfully signed in with Firebase:', userCredential.user?.email);
              
              // Update the user profile with the email from the response
              if (data.user?.email && userCredential.user) {
                try {
                  const { updateProfile } = await import('firebase/auth');
                  await updateProfile(userCredential.user, {
                    displayName: data.user.email.split('@')[0]
                  });
                  console.log('✅ Updated Firebase user profile with display name');
                } catch (profileError) {
                  console.warn('⚠️ Could not update user profile:', profileError);
                }
              }
              
              // Force refresh the user to get updated claims
              await userCredential.user.reload();
              console.log('👤 After reload - User email:', userCredential.user.email);
              
            } catch (firebaseError) {
              console.error('❌ Firebase sign-in failed:', firebaseError);
              // Don't fail the login if Firebase fails, just log it
              // The user can still access the app via Couchlytics auth
            }
          }
          
          // Update authentication state and wait for it to be confirmed
          console.log('🔄 Updating authentication state...');
          console.log('🔐 Cookies after login (first path):', document.cookie);
          await checkAuthStatus();
          console.log('✅ Authentication state updated');
          
          // Wait for the next tick to ensure state propagation
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Double-check authentication before redirecting
          console.log('🔐 Cookies before auth status check (first path):', document.cookie);
          const authCheck = await fetch(`${API_BASE}/auth/status`, {
            credentials: "include",
          });
          
          if (authCheck.ok) {
            const authData = await authCheck.json();
            if (authData.authenticated) {
              console.log('🚀 Authentication confirmed, redirecting to leagues page...');
              router.push('/leagues');
            } else {
              console.log('❌ Authentication check failed after login');
              setError('Authentication failed after login. Please try again.');
            }
          } else {
            console.log('❌ Auth status check failed after login');
            setError('Authentication verification failed. Please try again.');
          }
        } else if (data.authenticated && data.user) {
          // Alternative response structure - user is authenticated
          console.log('✅ Couchlytics authentication successful (alternative structure)');
          
          // Update authentication state and wait for it to be confirmed
          console.log('🔄 Updating authentication state...');
          console.log('🔐 Cookies after login (second path):', document.cookie);
          await checkAuthStatus();
          console.log('✅ Authentication state updated');
          
          // Wait for the next tick to ensure state propagation
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Double-check authentication before redirecting
          console.log('🔐 Cookies before auth status check (second path):', document.cookie);
          const authCheck = await fetch(`${API_BASE}/auth/status`, {
            credentials: "include",
          });
          
          if (authCheck.ok) {
            const authData = await authCheck.json();
            if (authData.authenticated) {
              console.log('🚀 Authentication confirmed, redirecting to leagues page...');
              router.push('/leagues');
            } else {
              console.log('❌ Authentication check failed after login');
              setError('Authentication failed after login. Please try again.');
            }
          } else {
            console.log('❌ Auth status check failed after login');
            setError('Authentication verification failed. Please try again.');
          }
        } else {
          console.log('❌ Login response validation failed:', data);
          setError('Invalid email or password');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Login failed. Please try again.');
      }
    } catch (err) {
      console.error("Native login error:", err);
      setError("Login failed. Please try again.");
    } finally {
      setIsLoading(null);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading('google');
    setError(null);
    try {
      console.log('Redirecting to Google OAuth...');
      window.location.href = `${API_BASE}/auth/login/google`;
    } catch (err) {
      console.error("Google login error:", err);
      setError("Google login failed. Please try again.");
      setIsLoading(null);
    }
  };

  const handleDiscordLogin = async () => {
    setIsLoading('discord');
    setError(null);
    try {
      console.log('Redirecting to Discord OAuth...');
      window.location.href = `${API_BASE}/auth/login/discord`;
    } catch (err) {
      console.error("Discord login error:", err);
      setError("Discord login failed. Please try again.");
      setIsLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 bg-white dark:bg-gray-900 rounded-xl shadow-lg">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-green"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-300">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white dark:bg-gray-900 rounded-xl shadow-lg">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome to Couchlytics
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Sign in to manage your Madden franchise
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleNativeLogin} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-neon-green focus:border-neon-green dark:bg-gray-800 dark:text-white"
            placeholder="Enter your email"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-neon-green focus:border-neon-green dark:bg-gray-800 dark:text-white"
            placeholder="Enter your password"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading === 'native'}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-neon-green hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neon-green disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading === 'native' ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Signing in...
            </div>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
              Or continue with
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading === 'google'}
            className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neon-green disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading === 'google' ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-neon-green"></div>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="ml-2">Google</span>
              </>
            )}
          </button>

          <button
            onClick={handleDiscordLogin}
            disabled={isLoading === 'discord'}
            className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neon-green disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading === 'discord' ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-neon-green"></div>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                <span className="ml-2">Discord</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Don&apos;t have an account?{' '}
          <a href="/register" className="font-medium text-neon-green hover:text-green-600">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}

