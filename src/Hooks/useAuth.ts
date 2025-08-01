import { useEffect, useState, useCallback } from "react";
import { User, UserRole, Permission } from "@/types/user";
import { API_BASE } from '@/lib/config';

export default function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authenticated, setAuthenticated] = useState<boolean>(false);

  const checkAuthStatus = useCallback(async () => {
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
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        credentials: 'include',
        method: 'GET',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setAuthenticated(false);
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
