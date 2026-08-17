'use client';

import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { apiFetch } from '../lib/api';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setAuth, clearAuth, setLoading } = useAuthStore();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const response = await apiFetch('/auth/refresh', { 
          method: 'POST', 
          skipAuth: true 
        });
        
        if (response.data) {
          setAuth(response.data.user, response.data.accessToken);
        } else {
          clearAuth();
        }
      } catch (error) {
        clearAuth();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [setAuth, clearAuth, setLoading]);

  return <>{children}</>;
}
