import { useAuthStore } from '../store/authStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL 
  ? `${process.env.NEXT_PUBLIC_API_URL}/api` 
  : 'http://localhost:4000/api';

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

export async function apiFetch(endpoint: string, options: FetchOptions = {}): Promise<any> {
  const { accessToken } = useAuthStore.getState();

  const headers = new Headers(options.headers || {});
  
  if (accessToken && !options.skipAuth && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const url = `${API_BASE_URL}${endpoint}`;
  let response = await fetch(url, { ...options, headers });

  // Handle token refresh on 401
  if (response.status === 401 && !options.skipAuth) {
    try {
      // Call refresh endpoint with credentials (so the cookie is sent)
      const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (refreshResponse.ok) {
        const { data } = await refreshResponse.json();
        // Update store
        useAuthStore.getState().setAuth(data.user, data.accessToken);
        
        // Retry failed request with new token
        headers.set('Authorization', `Bearer ${data.accessToken}`);
        response = await fetch(url, { ...options, headers });
      } else {
        useAuthStore.getState().clearAuth();
        throw new Error('Session expired');
      }
    } catch (refreshError) {
      useAuthStore.getState().clearAuth();
      throw new Error('Session expired');
    }
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }
  return data;
}
