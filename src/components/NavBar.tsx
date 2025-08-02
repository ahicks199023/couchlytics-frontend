'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import useAuth from '@/Hooks/useAuth'
import { User } from '@/types/user'

export default function NavBar() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, loading, logout, authenticated } = useAuth()

  const handleLogout = async () => {
    await logout()
    // The logout function will handle clearing the user state
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
        <Link href="/" className="text-xl font-bold text-neon-green">
          Couchlytics
        </Link>
        
        {authenticated && (
          <div className="hidden md:flex space-x-4">
            <Link href="/leagues" className="hover:text-neon-green transition-colors">
              Leagues
            </Link>
            <Link href="/dashboard" className="hover:text-neon-green transition-colors">
              Dashboard
            </Link>
            <Link href="/analytics-engine" className="hover:text-neon-green transition-colors">
              Analytics
            </Link>
            <Link href="/gm-toolkit" className="hover:text-neon-green transition-colors">
              GM Toolkit
            </Link>
            <Link href="/upload" className="hover:text-neon-green transition-colors">
              Upload
            </Link>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-4">
        {loading ? (
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-neon-green"></div>
        ) : authenticated && user ? (
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2">
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
          <Link
            href="/login"
            className="bg-neon-green text-black px-4 py-2 rounded hover:bg-green-400 transition-colors"
          >
            Sign In
          </Link>
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
                  href="/dashboard"
                  className="block py-2 text-gray-300 hover:text-white"
                  onClick={() => setIsOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/analytics-engine"
                  className="block py-2 text-gray-300 hover:text-white"
                  onClick={() => setIsOpen(false)}
                >
                  Analytics
                </Link>
                <Link
                  href="/gm-toolkit"
                  className="block py-2 text-gray-300 hover:text-white"
                  onClick={() => setIsOpen(false)}
                >
                  GM Toolkit
                </Link>
                <Link
                  href="/upload"
                  className="block py-2 text-gray-300 hover:text-white"
                  onClick={() => setIsOpen(false)}
                >
                  Upload
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
    </nav>
  )
}

