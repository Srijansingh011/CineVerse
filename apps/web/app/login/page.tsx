'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { Logo } from '../../components/layout/Logo';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore(state => state.setAuth);

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [showRegisteredAlert, setShowRegisteredAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get('registered') === 'true') setShowRegisteredAlert(true);
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
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
        if (redirect) router.push(redirect);
        else if (response.data.user.role === 'THEATRE_OWNER') router.push('/theatre-owner');
        else if (response.data.user.role === 'ADMIN' || response.data.user.role === 'SUPER_ADMIN') router.push('/admin');
        else router.push('/');
      }
    } catch {
      setError('Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <Logo />
      <h1 className="font-display text-[32px] text-white mt-8">Welcome back</h1>
      <p className="mt-1 text-[14px] text-muted">Sign in to book seats and join the community.</p>

      {showRegisteredAlert && <Alert variant="success" className="mt-5">Account created. Sign in below.</Alert>}
      {error && <Alert className="mt-5">{error}</Alert>}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="text-[12px] text-muted">Email</label>
          <Input className="mt-1" type="email" name="email" required value={formData.email} onChange={handleChange} />
        </div>
        <div>
          <label className="text-[12px] text-muted">Password</label>
          <Input className="mt-1" type="password" name="password" required value={formData.password} onChange={handleChange} />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading} isLoading={isLoading}>
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-[13px] text-muted">
        New here? <Link href="/register" className="text-white font-medium">Create an account</Link>
      </p>
    </div>
  );
}

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Suspense fallback={<p className="text-muted text-sm">Loading…</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
