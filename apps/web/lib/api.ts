import { useAuthStore } from '../store/authStore';
import { getDemoResponse } from './demoData';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL 
  ? `${process.env.NEXT_PUBLIC_API_URL}/api` 
  : 'http://localhost:4000/api';

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

/**
 * When the real backend is unreachable (e.g. in preview environments where
 * http://localhost:4000 does not exist), fall back to bundled demo data for
 * read-only endpoints so the UI stays fully presentable. The live API always
 * takes precedence — this only runs after a genuine network failure.
 */
function demoFallback(endpoint: string, options: FetchOptions): any {
  const method = (options.method || 'GET').toUpperCase();
  if (method !== 'GET') {
    // Non-GET actions (booking, reviews, etc.) require the real backend.
    throw new Error('Backend unavailable. Connect the CineVerse API to enable this action.');
  }
  const demo = getDemoResponse(endpoint);
  if (demo !== undefined) {
    if (typeof console !== 'undefined') {
      console.log(`[v0] Serving demo data for ${endpoint} (backend unreachable)`);
    }
    return demo;
  }
  throw new Error('Backend unavailable');
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
  let response: Response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch {
    // Network-level failure (backend not running / unreachable).
    return demoFallback(endpoint, options);
  }

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
