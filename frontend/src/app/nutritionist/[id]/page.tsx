'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { nutritionistAPI } from '@/lib/api';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { toast } from 'sonner';

interface NutritionistPublicProfile {
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

export default function NutritionistPublicProfile({ params }: { params: { id: string } }) {
  const [nutritionist, setNutritionist] = useState<NutritionistPublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    nutritionistAPI
      .getAll({ limit: 100 })
      .then((res) => {
        const list = res.data.data?.nutritionists || [];
        const match = list.find((n: NutritionistPublicProfile) => String(n.id) === String(params.id));
        if (match) setNutritionist(match);
        else setNotFound(true);
      })
      .catch(() => {
        toast.error('Failed to load nutritionist profile');
        setNotFound(true);
      })
      .finally(() => setIsLoading(false));
  }, [params.id]);

  if (isLoading) return <LoadingSpinner />;

  if (notFound || !nutritionist) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Nutritionist not found.</p>
          <Link href="/nutritionists" className="text-green-600 hover:underline mt-4 inline-block">
            Browse all nutritionists
          </Link>
        </div>
      </div>
    );
  }

  const fullName = `${nutritionist.firstName} ${nutritionist.lastName}`.trim();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          <div className="h-32 bg-gradient-to-r from-green-400 to-green-600"></div>
          <div className="px-6 py-8">
            <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
              <div className="w-32 h-32 bg-green-200 rounded-full flex items-center justify-center -mt-20 shadow-lg text-6xl">
                👩‍⚕️
              </div>
              <div className="flex-1">
                <h1 className="page-title mb-2">{fullName}</h1>
                <p className="text-green-600 text-xl font-semibold mb-2">{nutritionist.specialization}</p>
                <p className="text-gray-700"><strong>Experience:</strong> {nutritionist.experience || '—'}</p>
                <p className="text-gray-600 mt-1">
                  Rating: {Number(nutritionist.rating || 0).toFixed(1)}/5 · {nutritionist.clients || 0} clients
                </p>
              </div>
              <div className="w-full md:w-auto">
                <Link href="/register" className="block text-center bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3 rounded-lg mb-2">
                  Book Consultation
                </Link>
                <Link href="/login" className="block text-center bg-gray-600 hover:bg-gray-700 text-white font-semibold px-8 py-3 rounded-lg">
                  Send Message
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">About Me</h2>
          <p className="text-gray-700 leading-relaxed">
            {nutritionist.bio || 'This nutritionist has not added a bio yet.'}
          </p>
          {nutritionist.certifications?.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-gray-900 mb-2">Certifications</h3>
              <ul className="space-y-2">
                {nutritionist.certifications.map((cert) => (
                  <li key={cert} className="text-gray-700">✓ {cert}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
