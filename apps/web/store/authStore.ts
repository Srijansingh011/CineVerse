import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'USER' | 'THEATRE_OWNER' | 'ADMIN' | 'SUPER_ADMIN';
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, accessToken: string) => void;
  clearAuth: () => void;
  setLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false, // Default to false when hydrating from storage
      setAuth: (user, accessToken) => set({ user, accessToken, isAuthenticated: true, isLoading: false }),
      clearAuth: () => set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false }),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'cineverse-auth',
    }
  )
);
