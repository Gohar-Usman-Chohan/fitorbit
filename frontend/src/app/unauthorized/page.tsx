'use client';

import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-orange-100">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-red-600 mb-4">403</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Access Denied</h2>
        <p className="text-gray-600 mb-8">
          You don't have permission to access this page.
        </p>
        <Link
          href="/client/dashboard"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
