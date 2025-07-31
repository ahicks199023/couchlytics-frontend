// components/ClientLayout.tsx
'use client'

import { usePathname } from 'next/navigation'
import { Suspense } from 'react'
import NavBar from './NavBar'
import OzzieChat from './OzzieChat'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const hideNav = ['/login', '/register'].includes(pathname)

  return (
    <>
      {!hideNav && <NavBar />}
      <main className="min-h-screen p-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
        {children}
      </main>
      
      {/* Ozzie Chat - Show on all pages except login/register */}
      {!hideNav && (
        <Suspense fallback={null}>
          <OzzieChat />
        </Suspense>
      )}
    </>
  )
}

