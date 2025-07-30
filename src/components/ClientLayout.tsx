// components/ClientLayout.tsx
'use client'

import { usePathname } from 'next/navigation'
import NavBar from './NavBar'
import OzzieChat from './OzzieChat'
import ThemeToggle from './ThemeToggle'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const hideNav = ['/login', '/register'].includes(pathname)

  return (
    <>
      {!hideNav && <NavBar />}
      <main className="min-h-screen p-4 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
        {children}
      </main>
      
      {/* Theme Toggle - Show on all pages */}
      <ThemeToggle />
      
      {/* Ozzie Chat - Show on all pages except login/register */}
      {!hideNav && <OzzieChat />}
    </>
  )
}

