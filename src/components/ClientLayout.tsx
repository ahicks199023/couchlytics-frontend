// components/ClientLayout.tsx
'use client'

import { usePathname } from 'next/navigation'
import NavBar from './NavBar'
import OzzieChat from './OzzieChat'
import TradeTool from './TradeTool'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const hideNav = ['/login', '/register'].includes(pathname)
  
  // Show floating tools on league pages
  const showFloatingTools = pathname.includes('/leagues/')

  return (
    <>
      {!hideNav && <NavBar />}
      <main className="min-h-screen p-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
        {children}
      </main>
      
      {/* Ozzie Chat - Show on all pages except login/register */}
      {!hideNav && <OzzieChat />}
      
      {/* Trade Tool - Show on league pages */}
      {showFloatingTools && <TradeTool />}
    </>
  )
}

