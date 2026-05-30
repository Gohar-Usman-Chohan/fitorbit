'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authAPI } from '@/lib/api';
import { StatCard } from '@/components/ui/StatCard';
import { FaqAccordion } from '@/components/features/public/FaqAccordion';
import { FAQ_ITEMS } from '@/content/siteContent';

interface PlatformStats {
  totalUsers: number;
  totalTrainers: number;
  totalNutritionists: number;
  avgRating: number;
}

export default function AboutPage() {
  const [stats, setStats] = useState<PlatformStats>({
    totalUsers: 0,
    totalTrainers: 0,
    totalNutritionists: 0,
    avgRating: 0,
  });

  useEffect(() => {
    authAPI
      .getPlatformStats()
      .then((response) => {
        const data = response.data?.data;
        if (data && typeof data === 'object') {
          setStats((prev) => ({ ...prev, ...data }));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="page-title mb-6 sm:mb-8">About FitOrbit</h1>

        <div className="mb-12 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="prose max-w-none">
              <h2 className="mb-4 text-2xl font-bold text-gray-900">Our Mission</h2>
              <p className="mb-6 text-gray-700">
                FitOrbit is dedicated to making fitness and wellness accessible to everyone. We bridge
                the gap between individuals seeking guidance and certified professionals ready to help
                them achieve their health goals.
              </p>

              <h2 className="mb-4 text-2xl font-bold text-gray-900">What We Do</h2>
              <p className="mb-6 text-gray-700">
                We provide a comprehensive platform that connects fitness enthusiasts with qualified
                personal trainers and nutritionists. Our system enables real-time communication,
                personalized planning, progress tracking, and professional guidance all in one place.
              </p>

              <h2 className="mb-4 text-2xl font-bold text-gray-900">Our Values</h2>
              <ul className="mb-6 list-inside list-disc space-y-2 text-gray-700">
                <li>Excellence: We maintain high standards for all professionals on our platform</li>
                <li>Trust: Security and privacy are paramount to us</li>
                <li>Innovation: We continuously improve our platform with cutting-edge features</li>
                <li>Community: We foster a supportive environment for all members</li>
                <li>Accessibility: Fitness guidance should be available to everyone</li>
              </ul>
            </div>
          </div>

          <div className="h-fit rounded-lg bg-blue-50 p-8">
            <h3 className="mb-6 text-2xl font-bold text-gray-900">Platform Stats</h3>
            <div className="space-y-6">
              <div>
                <p className="text-2xl font-bold text-blue-600 sm:text-3xl lg:text-4xl">{stats.totalUsers}+</p>
                <p className="text-gray-600">Active Members</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600 sm:text-3xl lg:text-4xl">{stats.totalTrainers}+</p>
                <p className="text-gray-600">Expert Trainers</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600 sm:text-3xl lg:text-4xl">{stats.totalNutritionists}+</p>
                <p className="text-gray-600">Nutritionists</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600 sm:text-3xl lg:text-4xl">
                  {stats.avgRating ? `${stats.avgRating}/5` : '—'}
                </p>
                <p className="text-gray-600">Average Rating</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-3xl font-bold text-gray-900">Frequently Asked Questions</h2>
            <Link href="/faq" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
              View all FAQs →
            </Link>
          </div>
          <FaqAccordion items={FAQ_ITEMS.slice(0, 4)} />
        </div>

        <div className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 p-12 text-center text-white">
          <h2 className="mb-4 text-3xl font-bold">Ready to Transform Your Fitness?</h2>
          <p className="mb-8 text-lg">
            Join members who are achieving their fitness goals with FitOrbit experts.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-block rounded-lg bg-white px-8 py-3 font-semibold text-blue-600 hover:bg-gray-100"
            >
              Sign Up
            </Link>
            <Link
              href="/search"
              className="inline-block rounded-lg border border-white/40 px-8 py-3 font-semibold text-white hover:bg-white/10"
            >
              Find Experts
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
