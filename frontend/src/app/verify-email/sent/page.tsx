'use client';

import { Suspense } from 'react';
import VerifyEmailSentContent from './VerifyEmailSentContent';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function VerifyEmailSentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <LoadingSpinner />
        </div>
      }
    >
      <VerifyEmailSentContent />
    </Suspense>
  );
}
