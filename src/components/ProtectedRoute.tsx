'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useAuth from '@/Hooks/useAuth'

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, authenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !authenticated) {
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
    return null; // Will redirect to login
  }

  return <>{children}</>;
}
