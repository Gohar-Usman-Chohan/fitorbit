'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { authAPI } from '@/lib/api';
import { validateEmail } from '@/lib/validation';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validationError = validateEmail(email);
      if (validationError) {
        toast.error(validationError);
        return;
      }

      await authAPI.forgotPassword(email.trim());
      setIsSubmitted(true);
      toast.success('If that email exists, a reset link has been sent.');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send reset link');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          FitOrbit
        </h1>
        <h2 className="text-2xl font-semibold text-center text-gray-700 mb-2">
          Forgot Password
        </h2>
        <p className="text-center text-gray-600 mb-8 text-sm">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>

        {isSubmitted ? (
          <p className="text-center text-green-700 text-sm mb-6">
            Check your inbox for a password reset link.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={isLoading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 rounded-lg transition"
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <p className="text-center text-gray-600 mt-6">
          Remember your password?{' '}
          <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
