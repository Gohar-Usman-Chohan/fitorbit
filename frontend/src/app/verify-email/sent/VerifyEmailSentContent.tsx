'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Mail } from 'lucide-react';
import { toast } from 'sonner';
import { authAPI } from '@/lib/api';

export default function VerifyEmailSentContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const [isResending, setIsResending] = useState(false);

  const handleResend = async () => {
    if (!email) {
      toast.error('Email address is missing. Please register again.');
      return;
    }

    try {
      setIsResending(true);
      await authAPI.resendVerification(email);
      toast.success('Verification email sent again. Please check your inbox.');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to resend verification email');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-600">
          <Mail size={28} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Verify your email</h1>
        <p className="mt-3 text-sm text-gray-600">
          We sent a verification link to
          {email ? (
            <>
              <br />
              <span className="font-semibold text-gray-900">{email}</span>
            </>
          ) : (
            ' your email address'
          )}
          . Open the link to activate your account before signing in.
        </p>

        <div className="mt-8 space-y-3">
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending || !email}
            className="w-full rounded-lg bg-blue-600 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:bg-blue-400"
          >
            {isResending ? 'Sending...' : 'Resend verification email'}
          </button>
          <Link
            href="/login"
            className="block w-full rounded-lg border border-gray-300 py-2.5 font-semibold text-gray-700 hover:bg-gray-50"
          >
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
