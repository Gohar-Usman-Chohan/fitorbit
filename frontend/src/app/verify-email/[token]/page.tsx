'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import Cookies from 'js-cookie';
import { CheckCircle2, XCircle } from 'lucide-react';
import { authAPI } from '@/lib/api';
import { loginSuccess } from '@/redux/slices/authSlice';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { toast } from 'sonner';

export default function VerifyEmailPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const token = String(params.token || '');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Verification link is invalid.');
      return;
    }

    const verify = async () => {
      try {
        const response = await authAPI.verifyEmail(token);
        const { data, message: apiMessage } = response.data;
        setStatus('success');
        setMessage(apiMessage || 'Email verified successfully!');

        if (data?.token && data?.refreshToken && data?.user?.role === 'client') {
          Cookies.set('token', data.token, { expires: 7, path: '/', sameSite: 'Lax' });
          Cookies.set('refreshToken', data.refreshToken, {
            expires: 30,
            path: '/',
            sameSite: 'Lax',
          });

          dispatch(
            loginSuccess({
              user: {
                id: data.user.id,
                email: data.user.email,
                role: data.user.role,
                name: data.user.name,
                isEmailVerified: true,
              },
              token: data.token,
              refreshToken: data.refreshToken,
            })
          );

          toast.success('Email verified! Welcome to FitOrbit.');
          router.replace('/client/dashboard');
          return;
        }

        if (data?.user?.role === 'trainer' || data?.user?.role === 'nutritionist') {
          toast.info('Email verified. Your expert account is pending admin approval.');
          router.replace('/login');
        }
      } catch (error: any) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Verification failed. The link may have expired.');
      }
    };

    verify();
  }, [dispatch, router, token]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <LoadingSpinner />
      </div>
    );
  }

  const isSuccess = status === 'success';

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg text-center">
        <div
          className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${
            isSuccess ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
          }`}
        >
          {isSuccess ? <CheckCircle2 size={28} /> : <XCircle size={28} />}
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isSuccess ? 'Email verified' : 'Verification failed'}
        </h1>
        <p className="mt-3 text-sm text-gray-600">{message}</p>

        <div className="mt-8 space-y-3">
          {!isSuccess && (
            <Link
              href="/verify-email/sent"
              className="block w-full rounded-lg bg-blue-600 py-2.5 font-semibold text-white hover:bg-blue-700"
            >
              Request a new link
            </Link>
          )}
          <Link
            href="/login"
            className="block w-full rounded-lg border border-gray-300 py-2.5 font-semibold text-gray-700 hover:bg-gray-50"
          >
            Go to login
          </Link>
        </div>
      </div>
    </div>
  );
}
