'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import { Dumbbell } from 'lucide-react';
import { toast } from 'sonner';
import Cookies from 'js-cookie';
import { loginSuccess } from '@/redux/slices/authSlice';
import { authAPI } from '@/lib/api';
import { validateLogin } from '@/lib/validation';
import type { RootState } from '@/redux/store';

const roleRoutes: Record<string, string> = {
  client: '/client/dashboard',
  trainer: '/trainer/dashboard',
  nutritionist: '/nutritionist/dashboard',
  admin: '/admin/approvals',
};

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const auth = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const reason = searchParams.get('reason');
    if (!reason) return;

    if (reason.includes('suspended') || reason.includes('Suspended')) {
      toast.error('Your account has been suspended. Contact support or wait for admin to reopen it.');
    } else {
      toast.error(reason);
    }
  }, [searchParams]);

  useEffect(() => {
    if (auth.isAuthenticated && auth.user?.role) {
      router.replace(roleRoutes[auth.user.role] || '/client/dashboard');
    }
  }, [auth.isAuthenticated, auth.user, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validationError = validateLogin(formData);
      if (validationError) {
        toast.error(validationError);
        return;
      }

      const response = await authAPI.login({
        email: formData.email,
        password: formData.password,
      });

      const { data } = response.data;

      Cookies.set('token', data.token, { expires: 7, path: '/', sameSite: 'Lax' });
      Cookies.set('refreshToken', data.refreshToken, { expires: 30, path: '/', sameSite: 'Lax' });

      dispatch(
        loginSuccess({
          user: {
            id: data.user.id,
            email: data.user.email,
            role: data.user.role,
            name: data.user.name,
            isEmailVerified: data.user.isEmailVerified,
          },
          token: data.token,
          refreshToken: data.refreshToken,
        })
      );

      toast.success('Login successful!');
      router.replace(roleRoutes[data.user.role] || '/client/dashboard');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      toast.error(message);

      if (message.toLowerCase().includes('verify your email') && formData.email.trim()) {
        router.push(`/verify-email/sent?email=${encodeURIComponent(formData.email.trim())}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-72px)] items-center justify-center hero-gradient px-4 py-12">
      <div className="card w-full max-w-md card-body shadow-card-hover">
        <div className="mb-8 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-600/25">
            <Dumbbell size={22} />
          </span>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">
            Welcome to <span className="text-blue-600">FitOrbit</span>
          </h1>
          <p className="mt-2 text-sm text-slate-500">Sign in to continue your fitness journey</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="label-field">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
              placeholder="you@example.com"
              className="input-field"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="password" className="label-field">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
              placeholder="Enter your password"
              className="input-field"
              disabled={isLoading}
            />
          </div>

          <button type="submit" disabled={isLoading} className="btn-primary w-full py-2.5">
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-700">
            Register here
          </Link>
        </p>
        <p className="mt-2 text-center">
          <Link href="/forgot-password" className="text-sm text-slate-500 hover:text-blue-600">
            Forgot password?
          </Link>
        </p>
      </div>
    </div>
  );
}
