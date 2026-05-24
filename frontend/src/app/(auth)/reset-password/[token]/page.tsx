'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { authAPI } from '@/lib/api';
import { validatePassword } from '@/lib/validation';

export default function ResetPasswordPage() {
  const params = useParams();
  const router = useRouter();
  const token = String(params.token || '');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!token) {
      toast.error('Reset link is invalid.');
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      await authAPI.resetPassword(token, password);
      setIsSuccess(true);
      toast.success('Password updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg text-center">
          <h1 className="text-2xl font-bold text-gray-900">Invalid reset link</h1>
          <p className="mt-3 text-sm text-gray-600">
            This password reset link is invalid. Please request a new one.
          </p>
          <Link
            href="/forgot-password"
            className="mt-6 inline-block w-full rounded-lg bg-blue-600 py-2.5 font-semibold text-white hover:bg-blue-700"
          >
            Request new link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">FitOrbit</h1>
        <h2 className="text-2xl font-semibold text-center text-gray-700 mb-2">Reset Password</h2>

        {isSuccess ? (
          <>
            <p className="text-center text-green-700 text-sm mb-6">
              Your password has been updated. You can now sign in with your new password.
            </p>
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="w-full rounded-lg bg-blue-600 py-2.5 font-semibold text-white hover:bg-blue-700 transition"
            >
              Go to login
            </button>
          </>
        ) : (
          <>
            <p className="text-center text-gray-600 mb-8 text-sm">
              Enter a new password for your account. This link expires in 1 hour.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  New password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  disabled={isLoading}
                  autoComplete="new-password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Confirm password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  disabled={isLoading}
                  autoComplete="new-password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 rounded-lg transition"
              >
                {isLoading ? 'Updating...' : 'Update password'}
              </button>
            </form>
          </>
        )}

        {!isSuccess && (
          <p className="text-center text-gray-600 mt-6">
            Link expired?{' '}
            <Link href="/forgot-password" className="text-blue-600 hover:text-blue-700 font-semibold">
              Request a new one
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
