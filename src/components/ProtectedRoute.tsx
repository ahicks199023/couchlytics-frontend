'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, authenticated } = useAuth();
  const router = useRouter();

  const isPublicPath = () => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname;
    const search = window.location.search || '';
    // Whitelist invite/join/login paths so the invite landing page does not immediately redirect
    if (path.startsWith('/join')) return true;
    if (path.startsWith('/invites')) return true;
    if (path.startsWith('/login')) return true;
    if (path.startsWith('/register')) return true;
    // Also allow login/join variants that include ?invite=
    if (search.includes('invite=')) return true;
    return false;
  }

  useEffect(() => {
    if (!loading && !authenticated && !isPublicPath()) {
      router.push('/login');
    }
  }, [loading, authenticated, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-lg">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-neon-green"></div>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!authenticated || !user) {
    // If public path, render children (UI can self-gate)
    if (isPublicPath()) {
      return <>{children}</>;
    }
    return null; // Will redirect to login
  }

  return <>{children}</>;
}
