'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Dumbbell,
  LineChart,
  ShieldCheck,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import { authAPI } from '@/lib/api';
import { StatCard } from '@/components/ui/StatCard';

interface PlatformStats {
  totalUsers: number;
  totalTrainers: number;
  totalNutritionists: number;
  avgRating: number;
}

const FEATURES = [
  {
    icon: Dumbbell,
    title: 'Expert Trainers',
    description:
      'Connect with certified personal trainers and get customized workout plans tailored to your goals.',
  },
  {
    icon: UtensilsCrossed,
    title: 'Nutrition Guidance',
    description:
      'Professional nutrition advice and personalized diet plans from registered dietitians.',
  },
  {
    icon: LineChart,
    title: 'Progress Tracking',
    description:
      'Monitor your fitness journey with detailed analytics and celebrate every milestone.',
  },
];

export default function LandingPage() {
  const [stats, setStats] = useState<PlatformStats>({
    totalUsers: 0,
    totalTrainers: 0,
    totalNutritionists: 0,
    avgRating: 4.8,
  });

  useEffect(() => {
    authAPI
      .getPlatformStats()
      .then((response) => setStats(response.data.data))
      .catch(() => {});
  }, []);

  return (
    <div>
      <section className="hero-gradient border-b border-slate-200/60">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700">
              <ShieldCheck size={16} />
              Certified fitness experts · Personalized plans
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:mt-6 sm:text-4xl md:text-5xl lg:text-6xl">
              Transform your fitness journey with{' '}
              <span className="text-blue-600">FitOrbit</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-600 md:text-xl">
              Connect with certified trainers and nutritionists. Get personalized
              guidance, track progress, and reach your goals — all in one platform.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/register" className="btn-primary px-8 py-3 text-base">
                Get Started Free
                <ArrowRight size={18} />
              </Link>
              <Link href="/about" className="btn-secondary px-8 py-3 text-base">
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section-muted py-12 sm:py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Why Choose FitOrbit?
            </h2>
            <p className="mt-3 text-slate-600">
              Everything you need to train smarter, eat better, and stay accountable.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="card card-hover card-body text-center">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Icon size={24} />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-slate-900">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Trusted by our community
            </h2>
            <p className="mt-3 text-slate-600">
              Join members, trainers, and nutritionists already on FitOrbit.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Active Members" value={`${stats.totalUsers}+`} color="blue" />
            <StatCard title="Expert Trainers" value={`${stats.totalTrainers}+`} color="green" />
            <StatCard title="Nutritionists" value={`${stats.totalNutritionists}+`} color="orange" />
            <StatCard title="Average Rating" value={`${stats.avgRating}/5`} color="purple" />
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200/60 bg-slate-900 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
          <Users className="mx-auto text-blue-400" size={40} />
          <h2 className="mt-4 text-3xl font-bold text-white">Ready to get started?</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-400">
            Create your free account today and connect with the right expert for your goals.
          </p>
          <Link href="/register" className="btn-primary mt-8 px-8 py-3 text-base">
            Create Free Account
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
