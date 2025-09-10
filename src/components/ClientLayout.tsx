// components/ClientLayout.tsx
'use client'

import { usePathname } from 'next/navigation'
import NavBar from './NavBar'
import EnhancedOzzieChat from './EnhancedOzzieChat'
import TradeTool from './TradeTool'
import ChatPopout from './ChatPopout'
import InvitationProcessor from './InvitationProcessor'
import { AuthProvider } from '@/contexts/AuthContext'
import { FirebaseAuthProvider } from '@/contexts/FirebaseAuthContext'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const hideNav = ['/login', '/register'].includes(pathname)
  
  // Show floating tools on league pages
  const showFloatingTools = pathname.includes('/leagues/')

  return (
    <AuthProvider>
      <FirebaseAuthProvider>
        {/* Invitation Processor - Handles invitation links for authenticated users */}
        <InvitationProcessor />
        
        {!hideNav && <NavBar />}
        <main className="min-h-screen p-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
          {children}
        </main>
        
        {/* Enhanced Ozzie Chat - Show on all pages except login/register */}
        {!hideNav && <EnhancedOzzieChat />}
        
        {/* Trade Tool - Show on league pages */}
        {showFloatingTools && <TradeTool />}
        
        {/* Chat Popout - Show on all pages except login/register */}
        {!hideNav && <ChatPopout leagueId={pathname.includes('/leagues/') ? pathname.split('/leagues/')[1]?.split('/')[0] : undefined} />}
      </FirebaseAuthProvider>
    </AuthProvider>
  )
}

