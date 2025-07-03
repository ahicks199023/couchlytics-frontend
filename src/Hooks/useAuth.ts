import { useEffect, useState, useCallback } from "react";
import { User, UserRole, Permission } from "@/types/user";
import { API_BASE } from '@/lib/config';

export default function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/me`, {
        credentials: "include",
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth error:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

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
      await fetch(`${API_BASE}/logout`, {
        credentials: 'include',
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  }, []);

  return { 
    user, 
    loading, 
    hasPermission, 
    hasRole, 
    isCommissioner, 
    isAdmin, 
    logout,
    refetch: fetchUser 
  };
}
