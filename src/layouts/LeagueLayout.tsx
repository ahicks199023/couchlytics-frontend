// layouts/LeagueLayout.tsx

'use client'

import { useState } from 'react'
import LeagueSidebar from '@/components/LeagueSidebar'

export default function LeagueLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-black text-white">
      {/* Sidebar (desktop + mobile toggleable) */}
      <div
        className={`fixed z-40 inset-y-0 left-0 transform transition-transform duration-200 ease-in-out 
          bg-gray-900 w-64
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:translate-x-0 md:static md:block`}
      >
        <LeagueSidebar />
      </div>

      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 md:ml-64 p-4">
        {/* Mobile Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden text-white bg-gray-800 px-3 py-2 rounded mb-4"
        >
          ☰ Menu
        </button>

        {children}
      </div>
    </div>
  )
}

