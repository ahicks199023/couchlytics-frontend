import { useEffect, useState, useCallback, useRef } from "react";
import { User, UserRole, Permission } from "@/types/user";
import { API_BASE } from '@/lib/config';

export default function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const isLoggingOut = useRef<boolean>(false);

  const checkAuthStatus = useCallback(async () => {
    // Don't check auth status if we're in the process of logging out
    if (isLoggingOut.current) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/auth/status`, {
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated) {
          setUser(data.user);
          setAuthenticated(true);
        } else {
          setUser(null);
          setAuthenticated(false);
        }
      } else {
        setUser(null);
        setAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth status check failed:', error);
      setUser(null);
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUser = useCallback(async () => {
    // Don't fetch user if we're logging out
    if (isLoggingOut.current) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/auth/user`, {
        credentials: "include",
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setAuthenticated(true);
      } else {
        setUser(null);
        setAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth error:', error);
      setUser(null);
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const hasPermission = useCallback((permission: Permission): boolean => {
    if (!user) return false;
    return user.permissions.includes(permission);
  }, [user]);

  const hasRole = useCallback((role: UserRole): boolean => {
    if (!user) return false;
    return user.role === role;
  }, [user]);

  const isCommissioner = useCallback((): boolean => {
    return hasRole(UserRole.COMMISSIONER) || hasRole(UserRole.ADMIN) || hasRole(UserRole.SUPER_ADMIN);
  }, [hasRole]);

  const isAdmin = useCallback((): boolean => {
    return hasRole(UserRole.ADMIN) || hasRole(UserRole.SUPER_ADMIN);
  }, [hasRole]);

  const logout = useCallback(async () => {
    // Set logging out flag to prevent auth checks
    isLoggingOut.current = true;
    
    try {
      // Clear local state immediately
      setUser(null);
      setAuthenticated(false);
      setLoading(false);
      
      // Call logout endpoint
      await fetch(`${API_BASE}/auth/logout`, {
        credentials: 'include',
        method: 'GET',
      });
      
      // Clear any cached data
      if (typeof window !== 'undefined') {
        // Clear any localStorage/sessionStorage if used
        localStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_token');
        
        // Clear any cached API responses
        if ('caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => {
              caches.delete(name);
            });
          });
        }
      }
      
      // Add a small delay before redirect to ensure logout completes
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
      
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, redirect to home
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
    }
  }, []);

  const loginWithGoogle = useCallback(() => {
    window.location.href = `${API_BASE}/auth/login/google`;
  }, []);

  const loginWithDiscord = useCallback(() => {
    window.location.href = `${API_BASE}/auth/login/discord`;
  }, []);

  return { 
    user, 
    loading, 
    authenticated,
    hasPermission, 
    hasRole, 
    isCommissioner, 
    isAdmin, 
    logout,
    loginWithGoogle,
    loginWithDiscord,
    refetch: fetchUser,
    checkAuthStatus
  };
}
