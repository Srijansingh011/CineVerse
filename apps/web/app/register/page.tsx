'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { Logo } from '../../components/layout/Logo';

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'USER',
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await apiFetch('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(formData),
        skipAuth: true,
      });
      router.push('/login?registered=true');
    } catch {
      setError('Couldn’t create your account. Try a different email.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <Logo />
        <h1 className="font-display text-[32px] text-white mt-8">Join CineVerse</h1>
        <p className="mt-1 text-[14px] text-muted">One account for tickets, reviews, and watch parties.</p>
        {error && <Alert className="mt-5">{error}</Alert>}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-[12px] text-muted">Name</label>
            <Input className="mt-1" name="name" required value={formData.name} onChange={handleChange} />
          </div>
          <div>
            <label className="text-[12px] text-muted">Email</label>
            <Input className="mt-1" type="email" name="email" required value={formData.email} onChange={handleChange} />
          </div>
          <div>
            <label className="text-[12px] text-muted">Password</label>
            <Input className="mt-1" type="password" name="password" required value={formData.password} onChange={handleChange} />
          </div>
          <div>
            <label className="text-[12px] text-muted">Join as</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="mt-1 w-full h-10 rounded-[6px] border border-[var(--border)] bg-surface px-3 text-[14px]"
            >
              <option value="USER">Moviegoer</option>
              <option value="THEATRE_OWNER">Theatre owner</option>
            </select>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading} isLoading={isLoading}>
            Create account
          </Button>
        </form>
        <p className="mt-6 text-[13px] text-muted">
          Already have an account? <Link href="/login" className="text-white font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
