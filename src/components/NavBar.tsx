'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

import { useAuth } from '@/contexts/AuthContext'
import { User } from '@/types/user'
import { login as loginApi } from '@/features/auth/api'
import { API_BASE_URL } from '@/lib/http'
import { useInbox } from '@/Hooks/useInbox'
import { NotificationBell } from './notifications/NotificationBell'
import { NotificationPanel } from './notifications/NotificationPanel'
import { getFirebaseUserEmail } from '@/lib/firebase'


export default function NavBar() {
  const [showLoginDropdown, setShowLoginDropdown] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [loginFormData, setLoginFormData] = useState({ email: '', password: '' })
  const [isLoginLoading, setIsLoginLoading] = useState<'native' | 'google' | 'discord' | null>(null)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false)
  const loginDropdownRef = useRef<HTMLDivElement>(null)

  const { user, authenticated, loading, logout, firebaseUser, checkAuthStatus, isAdmin } = useAuth()
  const router = useRouter()
  
  const currentUser = getFirebaseUserEmail(firebaseUser) || user?.email || ''
  const { totalUnreadCount } = useInbox(currentUser)



  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (loginDropdownRef.current && !loginDropdownRef.current.contains(event.target as Node)) {
        setShowLoginDropdown(false)
      }
    }

    if (showLoginDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showLoginDropdown])

  const handleLogout = async () => {
    await logout()
    // The logout function will handle clearing the user state
  }

  const handleLoginInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setLoginFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (loginError) setLoginError(null)
  }

  const handleNativeLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoginLoading('native')
    setLoginError(null)

    try {
      const data = await loginApi(loginFormData.email, loginFormData.password)
      if (data?.authenticated || data?.user) {
        setShowLoginDropdown(false)
        setLoginFormData({ email: '', password: '' })
        // Immediately refresh auth status so the navbar updates without a page reload
        await checkAuthStatus()

        // Give the session cookie time to settle, then verify and redirect
        await new Promise((r) => setTimeout(r, 1500))
        let redirected = false
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const res = await fetch(`${API_BASE_URL}/auth/status`, { credentials: 'include' })
            if (res.ok) {
              const json = await res.json()
              if (json?.authenticated) {
                try {
                  router.push('/')
                } catch {
                  window.location.href = '/'
                }
                redirected = true
                break
              }
            }
          } catch {}
          await new Promise((r) => setTimeout(r, 1000))
        }
        if (!redirected) {
          // Last resort hard redirect; avoids stale UI if auth became valid but context didn't refresh yet
          try {
            router.push('/leagues')
          } catch {
            window.location.href = '/'
          }
        }
      } else {
        setLoginError('Invalid email or password')
      }
    } catch (err) {
      console.error("Native login error:", err)
      setLoginError("Login failed. Please try again.")
    } finally {
      setIsLoginLoading(null)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoginLoading('google')
    setLoginError(null)
    try {
      console.log('Redirecting to Google OAuth...')
      window.location.href = `${API_BASE_URL}/auth/login/google`
    } catch (err) {
      console.error("Google login error:", err)
      setLoginError("Google login failed. Please try again.")
      setIsLoginLoading(null)
    }
  }

  const handleDiscordLogin = async () => {
    setIsLoginLoading('discord')
    setLoginError(null)
    try {
      console.log('Redirecting to Discord OAuth...')
      window.location.href = `${API_BASE_URL}/auth/login/discord`
    } catch (err) {
      console.error("Discord login error:", err)
      setLoginError("Discord login failed. Please try again.")
      setIsLoginLoading(null)
    }
  }

  const getUserDisplayName = (user: User) => {
    if (user.name) return user.name
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`
    return user.email
  }

  const getUserAvatar = (user: User) => {
    if (user.avatar) return user.avatar
    if (user.providerData?.picture) return user.providerData.picture
    return '/default-avatar.png'
  }

  return (
    <nav className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center relative">
      <div className="flex items-center space-x-4">
        <Link href="/" className="flex items-center space-x-2 hover:text-neon-green transition-colors">
          <Image
            src="/couch-commish-logo.png"
            alt="Couchlytics Logo"
            width={128}
            height={128}
            className="h-32 w-auto"
          />
          <span className="text-xl font-bold text-neon-green">
            Couchlytics
          </span>
        </Link>
        
        {authenticated && (
          <div className="hidden md:flex space-x-4">
            <Link href="/leagues" className="hover:text-neon-green transition-colors">
              Leagues
            </Link>
            <Link href="/central" className="hover:text-neon-green transition-colors">
              🏠 Couchlytics Central
            </Link>
            {isAdmin() && (
              <Link href="/admin/dashboard" className="hover:text-neon-green transition-colors">
                Admin
              </Link>
            )}
            <Link href="/chat" className="hover:text-neon-green transition-colors">
              💬 Chat
            </Link>
            <NotificationBell
              onClick={() => setIsNotificationPanelOpen(true)}
              className="hover:bg-gray-700 rounded-full"
            />
          </div>
        )}
      </div>

      <div className="flex items-center space-x-4">
        {loading ? (
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-neon-green"></div>
        ) : authenticated && user ? (
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2">
              <div className="relative">
                <Image
                  src={getUserAvatar(user)}
                  alt="User avatar"
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full"
                  onError={(e) => {
                    e.currentTarget.src = '/default-avatar.png'
                  }}
                />
              </div>
              <span className="text-sm">{getUserDisplayName(user)}</span>
              {user.authProvider && (
                <span className="text-xs bg-gray-700 px-2 py-1 rounded">
                  {user.authProvider}
                </span>
              )}
            </div>
            
            <div className="relative">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 hover:text-neon-green transition-colors"
              >
                <span className="md:hidden">Menu</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-50">
                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                    onClick={() => setIsOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    href="/inbox"
                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                    onClick={() => setIsOpen(false)}
                  >
                    💬 Direct Messages
                    {totalUnreadCount > 0 && (
                      <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                        {totalUnreadCount}
                      </span>
                    )}
                  </Link>

                  <button
                    onClick={() => {
                      handleLogout()
                      setIsOpen(false)
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="relative">
            <button
              onClick={() => setShowLoginDropdown(!showLoginDropdown)}
              className="bg-neon-green text-black px-4 py-2 rounded hover:bg-green-400 transition-colors"
            >
              Sign In
            </button>

            {/* Login Dropdown */}
            {showLoginDropdown && (
              <div className="absolute right-0 mt-2 w-80 bg-gray-800 rounded-md shadow-lg p-4 z-50" ref={loginDropdownRef}>
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-white">Sign In/Register</h3>
                  <p className="text-sm text-gray-400">Welcome to Couchlytics</p>
                </div>

                {loginError && (
                  <div className="mb-4 p-3 bg-red-900/20 border border-red-500 rounded-md">
                    <p className="text-red-400 text-sm">{loginError}</p>
                  </div>
                )}

                {/* Native Login Form */}
                <form onSubmit={handleNativeLogin} className="space-y-3 mb-4">
                  <div>
                    <label htmlFor="dropdown-email" className="block text-sm font-medium text-gray-300 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      id="dropdown-email"
                      name="email"
                      value={loginFormData.email}
                      onChange={handleLoginInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-neon-green focus:border-transparent text-sm"
                      placeholder="Enter your email"
                    />
                  </div>

                  <div>
                    <label htmlFor="dropdown-password" className="block text-sm font-medium text-gray-300 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      id="dropdown-password"
                      name="password"
                      value={loginFormData.password}
                      onChange={handleLoginInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-neon-green focus:border-transparent text-sm"
                      placeholder="Enter your password"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoginLoading !== null}
                    className="w-full bg-neon-green text-black font-semibold py-2 px-4 rounded-md hover:bg-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neon-green disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    {isLoginLoading === 'native' ? 'Signing in...' : 'Sign In'}
                  </button>
                </form>

                {/* Divider */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-600"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-gray-800 text-gray-400">Or continue with</span>
                  </div>
                </div>

                {/* OAuth Options */}
                <div className="space-y-2">
                  <button
                    onClick={handleGoogleLogin}
                    disabled={isLoginLoading !== null}
                    className="w-full flex items-center justify-center px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-gray-200 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    {isLoginLoading === 'google' ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                    ) : (
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                    )}
                    {isLoginLoading === 'google' ? 'Signing in...' : 'Google'}
                  </button>

                  <button
                    onClick={handleDiscordLogin}
                    disabled={isLoginLoading !== null}
                    className="w-full flex items-center justify-center px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-[#5865F2] text-white hover:bg-[#4752C4] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5865F2] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    {isLoginLoading === 'discord' ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.019 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1568 2.4189Z"/>
                      </svg>
                    )}
                    {isLoginLoading === 'discord' ? 'Signing in...' : 'Discord'}
                  </button>
                </div>

                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-400">
                                         Don&apos;t have an account?{" "}
                    <a href="/register" className="text-neon-green hover:underline">
                      Sign up
                    </a>
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile menu */}
      {authenticated && (
        <div className="md:hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-gray-300 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {isOpen && (
            <div className="absolute top-full left-0 right-0 bg-gray-800 border-t border-gray-700">
              <div className="px-4 py-2 space-y-2">
                <Link
                  href="/leagues"
                  className="block py-2 text-gray-300 hover:text-white"
                  onClick={() => setIsOpen(false)}
                >
                  Leagues
                </Link>
                <Link
                  href="/central"
                  className="block py-2 text-gray-300 hover:text-white"
                  onClick={() => setIsOpen(false)}
                >
                  🏠 Couchlytics Central
                </Link>
                {isAdmin() && (
                  <Link
                    href="/admin/dashboard"
                    className="block py-2 text-gray-300 hover:text-white"
                    onClick={() => setIsOpen(false)}
                >
                    Admin
                  </Link>
                )}
                
                <Link
                  href="/chat"
                  className="block py-2 text-gray-300 hover:text-white"
                  onClick={() => setIsOpen(false)}
                >
                  💬 Chat
                </Link>
                <Link
                  href="/profile"
                  className="block py-2 text-gray-300 hover:text-white"
                  onClick={() => setIsOpen(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={() => {
                    handleLogout()
                    setIsOpen(false)
                  }}
                  className="block w-full text-left py-2 text-gray-300 hover:text-white"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Global Notification Panel */}
      <NotificationPanel
        isOpen={isNotificationPanelOpen}
        onClose={() => setIsNotificationPanelOpen(false)}
      />
    </nav>
  )
}

