'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { trainerAPI, nutritionistAPI } from '@/lib/api';
import { formatExpertRating, mapPublicExpertListing } from '@/lib/apiHelpers';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { toast } from 'sonner';

type ExpertType = 'trainer' | 'nutritionist';

export default function SearchPage() {
  const [experts, setExperts] = useState<ReturnType<typeof mapPublicExpertListing>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expertType, setExpertType] = useState<'all' | ExpertType>('all');
  const [specialization, setSpecialization] = useState('all');
  const [minRating, setMinRating] = useState('0');

  useEffect(() => {
    const loadExperts = async () => {
      try {
        setIsLoading(true);
        const [trainersRes, nutritionistsRes] = await Promise.all([
          trainerAPI.getAll({ limit: 50 }),
          nutritionistAPI.getAll({ limit: 50 }),
        ]);

        const trainers = (trainersRes.data.data?.trainers || []).map((raw: any) =>
          mapPublicExpertListing(raw, 'trainer')
        );
        const nutritionists = (nutritionistsRes.data.data?.nutritionists || []).map((raw: any) =>
          mapPublicExpertListing(raw, 'nutritionist')
        );
        setExperts([...trainers, ...nutritionists]);
      } catch {
        toast.error('Failed to load experts');
        setExperts([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadExperts();
  }, []);

  const specializations = useMemo(
    () =>
      Array.from(
        new Set(experts.flatMap((expert) => expert.specializations).filter(Boolean))
      ).sort(),
    [experts]
  );

  const filteredExperts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const ratingFloor = Number(minRating) || 0;

    return experts.filter((expert) => {
      if (expertType !== 'all' && expert.type !== expertType) return false;
      if (specialization !== 'all' && !expert.specializations.includes(specialization)) {
        return false;
      }
      if (ratingFloor > 0 && expert.rating < ratingFloor) return false;

      if (!query) return true;

      return (
        expert.name.toLowerCase().includes(query) ||
        expert.specializations.some((spec: string) => spec.toLowerCase().includes(query)) ||
        expert.bio.toLowerCase().includes(query) ||
        expert.certificationNames.some((cert: string) => cert.toLowerCase().includes(query))
      );
    });
  }, [experts, expertType, specialization, minRating, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-6 sm:mb-8">
          <h1 className="page-title">Find Experts</h1>
          <p className="mt-2 text-slate-600">
            Search real trainers and nutritionists registered on FitOrbit.
          </p>
        </div>

        <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <label htmlFor="search" className="mb-1 block text-sm font-medium text-slate-700">
                Search by name or specialization
              </label>
              <input
                id="search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. Gohar, Muscle Gain..."
                className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="type" className="mb-1 block text-sm font-medium text-slate-700">
                Expert type
              </label>
              <select
                id="type"
                value={expertType}
                onChange={(e) => setExpertType(e.target.value as 'all' | ExpertType)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All types</option>
                <option value="trainer">Trainers</option>
                <option value="nutritionist">Nutritionists</option>
              </select>
            </div>

            <div>
              <label htmlFor="rating" className="mb-1 block text-sm font-medium text-slate-700">
                Minimum rating
              </label>
              <select
                id="rating"
                value={minRating}
                onChange={(e) => setMinRating(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="0">Any rating</option>
                <option value="3">3.0+</option>
                <option value="4">4.0+</option>
                <option value="4.5">4.5+</option>
              </select>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="specialization" className="mb-1 block text-sm font-medium text-slate-700">
                Specialization
              </label>
              <select
                id="specialization"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All specializations</option>
                {specializations.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <p className="rounded-lg bg-slate-50 px-4 py-2 text-sm text-slate-600">
                {filteredExperts.length} expert{filteredExperts.length === 1 ? '' : 's'} found
              </p>
            </div>
          </div>
        </div>

        {filteredExperts.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredExperts.map((expert) => {
              const rating = formatExpertRating(expert.rating, expert.totalRatings);
              const isTrainer = expert.type === 'trainer';

              return (
                <div
                  key={`${expert.type}-${expert.id}`}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                >
                  <div
                    className={`h-28 bg-gradient-to-r ${
                      isTrainer ? 'from-blue-500 to-blue-700' : 'from-emerald-500 to-emerald-700'
                    }`}
                  />
                  <div className="relative -mt-12 px-6 pb-6 text-center">
                    <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-white text-4xl shadow-lg">
                      {isTrainer ? '👨‍🏫' : '👩‍⚕️'}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">{expert.name}</h3>
                    <p className={`font-semibold ${isTrainer ? 'text-blue-600' : 'text-emerald-600'}`}>
                      {isTrainer ? 'Personal Trainer' : 'Nutritionist'}
                    </p>

                    {expert.specializations.length > 0 ? (
                      <div className="mt-3 flex flex-wrap justify-center gap-2">
                        {expert.specializations.map((spec: string) => (
                          <span
                            key={spec}
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              isTrainer
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    {expert.bio ? (
                      <p className="mt-3 line-clamp-2 text-sm text-slate-500">{expert.bio}</p>
                    ) : null}

                    <div className="mt-4 text-sm text-slate-600">
                      <span className="font-semibold text-slate-900">{rating.display}</span>
                      <span className="text-slate-400"> · {rating.subtitle}</span>
                    </div>

                    <p className="mt-2 text-xs text-slate-500">
                      {expert.experience}
                      {expert.hourlyRate != null ? ` · $${expert.hourlyRate}/hr` : ''}
                    </p>

                    {expert.certificationNames.length > 0 ? (
                      <p className="mt-2 text-xs font-medium text-slate-600">
                        Certified: {expert.certificationNames.join(', ')}
                      </p>
                    ) : (
                      <p className="mt-2 text-xs text-slate-500">
                        {expert.isVerified ? 'Verified expert' : 'Profile active'}
                      </p>
                    )}

                    <Link
                      href={expert.profileLink}
                      className={`mt-5 block w-full rounded-lg py-2.5 font-semibold text-white transition ${
                        isTrainer ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                    >
                      View Profile
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <p className="text-lg text-slate-600">No experts match your filters.</p>
            <p className="mt-2 text-sm text-slate-500">
              Try clearing filters or browse all trainers and nutritionists.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/trainers"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Browse Trainers
              </Link>
              <Link
                href="/nutritionists"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Browse Nutritionists
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
