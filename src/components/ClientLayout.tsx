// components/ClientLayout.tsx
'use client'

import { usePathname } from 'next/navigation'
import NavBar from './NavBar'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const hideNav = ['/login', '/register'].includes(pathname)

  return (
    <>
      {!hideNav && <NavBar />}
      <main className="min-h-screen p-4 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
        {children}
      </main>
    </>
  )
}

