'use client';

import { useState, useEffect } from 'react';
import { nutritionistAPI } from '@/lib/api';
import { formatExpertRating, mapPublicExpertListing } from '@/lib/apiHelpers';
import { toast } from 'sonner';

export default function NutritionistsPage() {
  const [nutritionists, setNutritionists] = useState<ReturnType<typeof mapPublicExpertListing>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('all');

  useEffect(() => {
    const fetchNutritionists = async () => {
      try {
        setIsLoading(true);
        const response = await nutritionistAPI.getAll({ limit: 50 });
        setNutritionists(
          (response.data.data.nutritionists || []).map((raw: any) =>
            mapPublicExpertListing(raw, 'nutritionist')
          )
        );
      } catch (error: any) {
        console.error('Failed to load nutritionists:', error);
        toast.error('Failed to load nutritionists');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNutritionists();
  }, []);

  const filteredNutritionists = nutritionists.filter((nutritionist) => {
    const matchesSearch = nutritionist.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialization =
      selectedSpecialization === 'all' ||
      nutritionist.specializations.includes(selectedSpecialization);
    return matchesSearch && matchesSpecialization;
  });

  const specializations = Array.from(
    new Set(nutritionists.flatMap((n) => n.specializations))
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading nutritionists...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="page-title mb-6 sm:mb-8">Our Expert Nutritionists</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center gap-4 flex-wrap">
            <input
              type="text"
              placeholder="Search nutritionists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full min-w-0 flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 sm:min-w-64"
            />
            <select
              value={selectedSpecialization}
              onChange={(e) => setSelectedSpecialization(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Specializations</option>
              {specializations.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredNutritionists.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600 text-lg">No nutritionists found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNutritionists.map((nutritionist) => {
              const rating = formatExpertRating(nutritionist.rating, nutritionist.totalRatings);
              return (
              <div
                key={nutritionist.id}
                className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition"
              >
                <div className="h-32 bg-gradient-to-r from-green-400 to-green-600"></div>
                <div className="p-6 text-center -mt-12 relative">
                  <div className="w-24 h-24 bg-green-200 rounded-full mx-auto flex items-center justify-center mb-4 shadow-lg">
                    <span className="text-5xl">👩‍⚕️</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{nutritionist.name}</h3>
                  <p className="text-green-600 font-semibold">{nutritionist.specialization}</p>
                  {nutritionist.specializations.length > 1 ? (
                    <p className="text-gray-500 text-xs mt-1">{nutritionist.specializations.join(' · ')}</p>
                  ) : null}
                  <p className="text-gray-600 text-sm mt-2">{nutritionist.bio}</p>

                  <div className="mt-4 flex justify-center gap-1 items-center text-sm text-gray-600">
                    <span className="font-semibold text-gray-900">{rating.display}</span>
                    <span className="text-gray-400">· {rating.subtitle}</span>
                  </div>

                  <p className="text-gray-700 text-sm mt-4 mb-4">
                    {nutritionist.experience}
                    {nutritionist.hourlyRate != null ? ` · $${nutritionist.hourlyRate}/hr` : ''}
                    {nutritionist.certified && nutritionist.certificationNames.length > 0
                      ? ` · ${nutritionist.certificationNames.join(', ')}`
                      : ''}
                  </p>

                  <a
                    href={nutritionist.profileLink}
                    className="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition"
                  >
                    View Profile
                  </a>
                </div>
              </div>
            );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
