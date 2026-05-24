'use client';

import { useState, useEffect } from 'react';
import { clientAPI } from '@/lib/api';
import { mapExpert } from '@/lib/apiHelpers';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PageHeader } from '@/components/ui/PageHeader';
import { AppointmentBookingForm } from '@/components/forms/AppointmentBookingForm';
import { toast } from 'sonner';

function BrowseExpertsContent() {
  const [experts, setExperts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedExpert, setSelectedExpert] = useState<any>(null);
  const [filterType, setFilterType] = useState<'all' | 'trainer' | 'nutritionist'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchExperts();
  }, []);

  const fetchExperts = async () => {
    try {
      setIsLoading(true);
      const [trainersRes, nutritionistsRes] = await Promise.all([
        clientAPI.getAvailableTrainers(),
        clientAPI.getAvailableNutritionists(),
      ]);

      const trainers = (trainersRes.data.data?.trainers || []).map((t: any) =>
        mapExpert(t, 'trainer')
      );

      const nutritionists = (nutritionistsRes.data.data?.nutritionists || []).map((n: any) =>
        mapExpert(n, 'nutritionist')
      );

      setExperts([...trainers, ...nutritionists]);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to load experts';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredExperts = experts.filter((expert) => {
    if (filterType !== 'all' && expert.type !== filterType) return false;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        expert.name?.toLowerCase().includes(query) ||
        expert.specializations?.some((s: string) => s.toLowerCase().includes(query))
      );
    }

    return true;
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (selectedExpert) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
          <button
            onClick={() => setSelectedExpert(null)}
            className="mb-6 text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Browse
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Expert Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {selectedExpert.name}
              </h2>
              <p className="text-gray-600 mb-4">
                {selectedExpert.type === 'trainer' ? 'Personal Trainer' : 'Nutritionist'}
              </p>

              <div className="space-y-4 mb-6">
                <div>
                  <h3 className="font-semibold text-gray-900">Specializations</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedExpert.specializations?.map((spec: string) => (
                      <span
                        key={spec}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900">Experience</h3>
                  <p className="text-gray-600">
                    {selectedExpert.yearsOfExperience || 0} years of experience
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900">Rating</h3>
                  <p className="text-gray-600">
                    ⭐ {selectedExpert.averageRating?.toFixed(1) || 'N/A'} / 5
                    ({selectedExpert.totalRatings || 0} reviews)
                  </p>
                </div>

                {selectedExpert.hourlyRate && (
                  <div>
                    <h3 className="font-semibold text-gray-900">Hourly Rate</h3>
                    <p className="text-gray-600">${selectedExpert.hourlyRate}/hour</p>
                  </div>
                )}

                {selectedExpert.bio && (
                  <div>
                    <h3 className="font-semibold text-gray-900">Bio</h3>
                    <p className="text-gray-600">{selectedExpert.bio}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Booking Form */}
            <div>
              <AppointmentBookingForm
                expertId={selectedExpert.id}
                expertType={selectedExpert.type}
                expertName={selectedExpert.name}
                onSuccess={() => {
                  toast.success('Appointment booked successfully!');
                  setSelectedExpert(null);
                  fetchExperts();
                }}
              />
            </div>
          </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader title="Browse Experts" />

      <div className="mb-8 rounded-lg bg-white p-4 shadow sm:p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <input
              type="text"
              placeholder="Search by name or specialization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filterType}
              onChange={(e) =>
                setFilterType(e.target.value as 'all' | 'trainer' | 'nutritionist')
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="trainer">Trainers</option>
              <option value="nutritionist">Nutritionists</option>
            </select>
            <div className="text-gray-600 py-2">
              Found {filteredExperts.length} expert(s)
            </div>
          </div>
        </div>

        {/* Expert Cards */}
        {filteredExperts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExperts.map((expert) => (
              <div
                key={expert.id}
                className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition"
              >
                <div
                  className={`h-32 bg-gradient-to-r ${
                    expert.type === 'trainer'
                      ? 'from-blue-400 to-blue-600'
                      : 'from-green-400 to-green-600'
                  }`}
                />
                <div className="p-6 text-center -mt-12 relative">
                  <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto flex items-center justify-center mb-4 shadow-lg text-3xl">
                    {expert.type === 'trainer' ? '👨‍🏫' : '👩‍⚕️'}
                  </div>

                  <h3 className="text-xl font-bold text-gray-900">{expert.name}</h3>
                  <p
                    className={`${
                      expert.type === 'trainer' ? 'text-blue-600' : 'text-green-600'
                    } font-semibold`}
                  >
                    {expert.type === 'trainer' ? 'Personal Trainer' : 'Nutritionist'}
                  </p>

                  {expert.specializations && expert.specializations.length > 0 && (
                    <p className="text-gray-600 text-sm mt-2">
                      {expert.specializations.slice(0, 2).join(', ')}
                    </p>
                  )}

                  <div className="mt-4 flex justify-center items-center gap-1">
                    <span className="text-yellow-400">⭐</span>
                    <span className="text-gray-900 font-medium">
                      {expert.averageRating?.toFixed(1) || 'N/A'}
                    </span>
                    <span className="text-gray-400 text-sm">
                      ({expert.totalRatings || 0})
                    </span>
                  </div>

                  <div className="text-gray-600 text-sm mt-3 mb-4">
                    {expert.yearsOfExperience || 0} years experience
                    {expert.hourlyRate && ` • $${expert.hourlyRate}/hr`}
                  </div>

                  <button
                    onClick={() => setSelectedExpert(expert)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
                  >
                    Book Appointment
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">No experts found</p>
            <p className="text-gray-400 mt-2">Try adjusting your search filters</p>
          </div>
        )}
    </div>
  );
}

export default BrowseExpertsContent;
