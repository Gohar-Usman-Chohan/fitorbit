'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { trainerAPI } from '@/lib/api';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { toast } from 'sonner';

interface TrainerPublicProfile {
  id: string;
  firstName: string;
  lastName: string;
  bio: string;
  profilePicture?: string;
  specialization: string;
  experience: string;
  rating: number;
  clients: number;
  certified: boolean;
  certifications: string[];
}

export default function TrainerPublicProfile({ params }: { params: { id: string } }) {
  const [trainer, setTrainer] = useState<TrainerPublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    trainerAPI
      .getAll({ limit: 100 })
      .then((res) => {
        const trainers = res.data.data?.trainers || [];
        const match = trainers.find(
          (t: TrainerPublicProfile) => String(t.id) === String(params.id)
        );
        if (match) {
          setTrainer(match);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => {
        toast.error('Failed to load trainer profile');
        setNotFound(true);
      })
      .finally(() => setIsLoading(false));
  }, [params.id]);

  if (isLoading) return <LoadingSpinner />;

  if (notFound || !trainer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Trainer not found.</p>
          <Link href="/trainers" className="text-blue-600 hover:underline mt-4 inline-block">
            Browse all trainers
          </Link>
        </div>
      </div>
    );
  }

  const fullName = `${trainer.firstName} ${trainer.lastName}`.trim();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          <div className="h-32 bg-gradient-to-r from-blue-400 to-blue-600"></div>

          <div className="px-6 py-8">
            <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
              <div className="w-32 h-32 bg-blue-200 rounded-full flex items-center justify-center -mt-20 shadow-lg overflow-hidden">
                {trainer.profilePicture ? (
                  <img src={trainer.profilePicture} alt={fullName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-6xl">👨‍🏫</span>
                )}
              </div>

              <div className="flex-1">
                <h1 className="page-title mb-2">{fullName}</h1>
                <p className="text-blue-600 text-xl font-semibold mb-2">
                  {trainer.specialization || 'Personal Trainer'}
                </p>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-yellow-400">⭐</span>
                  <span className="text-gray-600">
                    ({Number(trainer.rating || 0).toFixed(1)}/5)
                  </span>
                </div>
                <p className="text-gray-700">
                  <strong>Experience:</strong> {trainer.experience || '—'}
                </p>
                {trainer.certified && (
                  <p className="text-green-600 text-sm mt-1">✓ Certified Trainer</p>
                )}
              </div>

              <div className="w-full md:w-auto">
                <Link
                  href="/register"
                  className="block w-full md:w-auto text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg mb-2"
                >
                  Book Session
                </Link>
                <Link
                  href="/login"
                  className="block w-full md:w-auto text-center bg-gray-600 hover:bg-gray-700 text-white font-semibold px-8 py-3 rounded-lg"
                >
                  Send Message
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About Me</h2>
              <p className="text-gray-700 leading-relaxed">
                {trainer.bio || 'This trainer has not added a bio yet.'}
              </p>
            </div>

            {trainer.certifications?.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Certifications</h2>
                <ul className="space-y-3">
                  {trainer.certifications.map((cert) => (
                    <li key={cert} className="flex items-center gap-3 p-3 bg-blue-50 rounded">
                      <span className="text-blue-600 text-lg">✓</span>
                      <span className="text-gray-700">{cert}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Statistics</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-600 text-sm">Clients Trained</p>
                  <p className="text-2xl font-bold text-blue-600">{trainer.clients || 0}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Average Rating</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {Number(trainer.rating || 0).toFixed(1)}/5
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
