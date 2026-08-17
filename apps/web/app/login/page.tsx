'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore(state => state.setAuth);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [showRegisteredAlert, setShowRegisteredAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setShowRegisteredAlert(true);
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setShowRegisteredAlert(false);
    setIsLoading(true);

    try {
      const response = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify(formData),
        skipAuth: true,
      });

      if (response.data) {
        setAuth(response.data.user, response.data.accessToken);
        
        const redirect = searchParams.get('redirect');
        if (redirect) {
          router.push(redirect);
        } else if (response.data.user.role === 'THEATRE_OWNER') {
          router.push('/theatre-owner');
        } else if (response.data.user.role === 'ADMIN' || response.data.user.role === 'SUPER_ADMIN') {
          router.push('/admin');
        } else {
          router.push('/');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950/40 p-8 shadow-2xl backdrop-blur-xl">
      <div className="text-center">
        <h1 className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
          Welcome Back
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Sign in to discover movies, check reviews & book shows
        </p>
      </div>

      {showRegisteredAlert && (
        <div className="mt-4 rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-400 border border-emerald-500/20">
          Registration successful! Please sign in below.
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg bg-rose-500/10 p-3 text-sm text-rose-400 border border-rose-500/20">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Email Address
          </label>
          <input
            type="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder="srijan@example.com"
            className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition duration-200"
          />
        </div>

        <div>
          <div className="flex justify-between items-center">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Password
            </label>
            <a href="#" className="text-xs text-indigo-400 hover:text-indigo-300">
              Forgot password?
            </a>
          </div>
          <input
            type="password"
            name="password"
            required
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition duration-200"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 py-3 text-sm font-semibold text-white shadow-lg hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-55 transition-all duration-200 mt-2"
        >
          {isLoading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-slate-400">
        New to CineVerse?   {' '}
        <Link href="/register" className="font-semibold text-indigo-400 hover:text-indigo-300 transition duration-150">
          Create an Account
        </Link>
      </p>
    </div>
  );
}

export default function Login() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950 via-slate-900 to-black p-4">
      <Suspense fallback={
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950/40 p-8 shadow-2xl backdrop-blur-xl flex flex-col items-center justify-center min-h-[300px]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <p className="mt-4 text-sm text-slate-400">Loading form...</p>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}
