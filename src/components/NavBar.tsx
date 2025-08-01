'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import NotificationDropdown from '@/components/NotificationDropdown'
import LogoutButton from '@/components/LogoutButton'
import ThemeToggle from '@/components/ThemeToggle'
import { API_BASE } from '@/lib/config'

type User = {
  is_commissioner?: boolean
  is_admin?: boolean
}

export default function NavBar() {
  const [user, setUser] = useState<User | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${API_BASE}/me`, { 
          credentials: 'include',
          headers: {
            'Accept': 'application/json'
          }
        })
        
        if (res.ok) {
          const data = await res.json()
          setUser(data)
        } else if (res.status === 401) {
          // User is not authenticated, this is normal
          setUser(null)
        } else {
          console.error('Failed to fetch user:', res.status)
          setUser(null)
        }
      } catch (error) {
        console.error('Failed to fetch current user:', error)
        setUser(null)
      }
    }

    fetchUser()
  }, [])

  return (
    <nav className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center relative">
      {/* Logo + Brand */}
      <Link href="/" className="flex items-center space-x-3">
        <Image
          src="/logo.png"
          alt="Couchlytics"
          width={96}
          height={96}
          className="h-20 w-auto"
        />
        <span className="text-2xl font-bold">Couchlytics</span>
      </Link>

      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <NotificationDropdown />

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Hamburger Toggle */}
        <button
          className="sm:hidden focus:outline-none"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle Menu"
        >
          <div className="relative w-6 h-6">
            <span
              className={`absolute h-0.5 w-full bg-white left-0 transform transition duration-300 ease-in-out ${
                isOpen ? 'rotate-45 top-2.5' : 'top-1'
              }`}
            />
            <span
              className={`absolute h-0.5 w-full bg-white left-0 transition-opacity duration-300 ease-in-out ${
                isOpen ? 'opacity-0' : 'top-2.5'
              }`}
            />
            <span
              className={`absolute h-0.5 w-full bg-white left-0 transform transition duration-300 ease-in-out ${
                isOpen ? '-rotate-45 bottom-2.5' : 'bottom-1'
              }`}
            />
          </div>
        </button>
      </div>

      {/* Menu */}
      <div
        className={`sm:flex sm:items-center sm:space-x-4 absolute sm:static top-16 left-0 w-full sm:w-auto bg-gray-900 sm:bg-transparent z-50 transform transition-all duration-300 ease-in-out ${
          isOpen
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 -translate-y-4 pointer-events-none sm:opacity-100 sm:translate-y-0 sm:pointer-events-auto'
        }`}
      >
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 px-6 py-4 sm:p-0">
          {user ? (
            <>
              <Link href="/dashboard" onClick={() => setIsOpen(false)}>Dashboard</Link>
              <Link href="/leagues" onClick={() => setIsOpen(false)}>Leagues</Link>
              {user.is_commissioner && (
                <>
                  <Link href="/commissioner" onClick={() => setIsOpen(false)}>Commissioner Hub</Link>
                  <Link href="/import" onClick={() => setIsOpen(false)}>Import Madden League</Link>
                </>
              )}
              {user.is_admin && (
                <>
                  <Link href="/upload" onClick={() => setIsOpen(false)}>Upload</Link>
                  <Link href="/admin/upload-logs" onClick={() => setIsOpen(false)}>Logs</Link>
                </>
              )}
              <Link href="/profile" onClick={() => setIsOpen(false)}>Profile</Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setIsOpen(false)}>Login</Link>
              <Link href="/register" onClick={() => setIsOpen(false)}>Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

