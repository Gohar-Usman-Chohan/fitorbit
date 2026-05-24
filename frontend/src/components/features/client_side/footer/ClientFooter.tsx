'use client';

import Link from 'next/link';
import { useSelector } from 'react-redux';
import type { RootState } from '@/redux/store';

function getDashboardLink(role?: string) {
  switch (role) {
    case 'trainer':
      return '/trainer/dashboard';
    case 'nutritionist':
      return '/nutritionist/dashboard';
    case 'admin':
      return '/admin/approvals';
    default:
      return '/client/dashboard';
  }
}

export default function Footer() {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const findExpertsHref =
    isAuthenticated && user?.role === 'client' ? '/client/browse-experts' : '/search';

  return (
    <footer className="border-t border-slate-800 bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <h3 className="mb-2 text-xl font-bold text-white">
              Fit<span className="text-blue-400">Orbit</span>
            </h3>
            <p className="text-sm leading-relaxed">
              Connecting fitness enthusiasts with certified trainers and nutritionists for
              personalized guidance and transformation.
            </p>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-white">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="transition hover:text-blue-400">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/trainers" className="transition hover:text-blue-400">
                  Browse Trainers
                </Link>
              </li>
              <li>
                <Link href="/nutritionists" className="transition hover:text-blue-400">
                  Browse Nutritionists
                </Link>
              </li>
              <li>
                <Link href="/about" className="transition hover:text-blue-400">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-white">For Users</h4>
            <ul className="space-y-2">
              {isAuthenticated ? (
                <li>
                  <Link href={getDashboardLink(user?.role)} className="transition hover:text-blue-400">
                    Dashboard
                  </Link>
                </li>
              ) : (
                <>
                  <li>
                    <Link href="/login" className="transition hover:text-blue-400">
                      Login
                    </Link>
                  </li>
                  <li>
                    <Link href="/register" className="transition hover:text-blue-400">
                      Sign Up
                    </Link>
                  </li>
                </>
              )}
              <li>
                <Link href={findExpertsHref} className="transition hover:text-blue-400">
                  Find Experts
                </Link>
              </li>
              <li>
                <Link href="/faq" className="transition hover:text-blue-400">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-white">Policies</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="transition hover:text-blue-400">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="transition hover:text-blue-400">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition hover:text-blue-400">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 py-8">
          <div className="flex flex-col items-center justify-between md:flex-row">
            <p className="mb-4 text-sm text-gray-400 md:mb-0">
              &copy; {new Date().getFullYear()} FitOrbit. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-blue-400"
                aria-label="Facebook"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333H16V2.169c-.585-.089-1.308-.169-2.227-.169-2.753 0-4.772 1.236-4.772 3.941V8z" />
                </svg>
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-blue-400"
                aria-label="Twitter"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2s9 5 20 5a9.5 9.5 0 00-9-5.5c4.75 2.25 7-7 7-7s-1.5 4.75-7 7" />
                </svg>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-blue-400"
                aria-label="Instagram"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="none" stroke="currentColor" strokeWidth="2" />
                  <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" fill="none" stroke="currentColor" strokeWidth="2" />
                  <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" />
                </svg>
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-blue-400"
                aria-label="LinkedIn"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
