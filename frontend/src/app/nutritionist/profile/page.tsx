'use client';

import { useEffect, useState } from 'react';
import { nutritionistAPI } from '@/lib/api';
import { parseUserProfileResponse } from '@/lib/api';
import { pickProfileUpdateFields } from '@/lib/apiHelpers';
import { validateProfileUpdate } from '@/lib/validation';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { toast } from 'sonner';

const SPECIALIZATION_OPTIONS = [
  { value: 'weight_management', label: 'Weight Management' },
  { value: 'sports_nutrition', label: 'Sports Nutrition' },
  { value: 'clinical', label: 'Clinical Nutrition' },
  { value: 'pediatric', label: 'Pediatric Nutrition' },
  { value: 'elderly_care', label: 'Elderly Care' },
  { value: 'disease_management', label: 'Disease Management' },
];

export default function NutritionistProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await nutritionistAPI.getProfile();
      const user = parseUserProfileResponse(response);
      setProfile(user);
      setFormData({
        ...user,
        bio: user?.nutritionistBio || user?.bio || '',
        certificationsText: (Array.isArray(user?.certifications) ? user.certifications : [])
          .map((c: any) => (typeof c === 'string' ? c : c.name))
          .filter(Boolean)
          .join(', '),
        specializations: user?.specializations || [],
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSpecialization = (value: string) => {
    setFormData((prev: any) => {
      const current = prev.specializations || [];
      return {
        ...prev,
        specializations: current.includes(value)
          ? current.filter((s: string) => s !== value)
          : [...current, value],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateProfileUpdate({
      firstName: formData.firstName,
      lastName: formData.lastName,
      bio: formData.bio,
      yearsOfExperience: formData.yearsOfExperience,
      consultationFee: formData.consultationFee,
    });
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setIsSaving(true);
      const payload = pickProfileUpdateFields({
        ...formData,
        bio: formData.bio,
        certifications: formData.certificationsText
          ? formData.certificationsText.split(',').map((s: string) => s.trim())
          : [],
        specializations: formData.specializations,
      });
      const response = await nutritionistAPI.updateProfile(payload);
      const user = parseUserProfileResponse(response);
      setProfile(user);
      toast.success('Profile updated');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (!profile) return <p className="text-gray-500">Profile not found</p>;

  return (
    <div>
      <h1 className="page-title mb-6 sm:mb-8">Professional Profile</h1>

      <div className="bg-white rounded-lg shadow p-8">
        <div className="flex items-center mb-8">
          <div className="w-20 h-20 bg-green-200 rounded-full flex items-center justify-center text-3xl">
            👩‍⚕️
          </div>
          <div className="ml-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {profile.firstName} {profile.lastName}
            </h2>
            <p className="text-green-600 font-semibold">Registered Dietitian</p>
            <p className="text-gray-600 text-sm mt-1">
              Rating: {profile.averageRating ? Number(profile.averageRating).toFixed(1) : 'N/A'}/5
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
              <input
                type="text"
                value={formData.firstName || ''}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
              <input
                type="text"
                value={formData.lastName || ''}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={formData.email || ''}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Professional Bio</label>
            <textarea
              value={formData.bio || ''}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Certifications</label>
              <input
                type="text"
                value={formData.certificationsText || ''}
                onChange={(e) => setFormData({ ...formData, certificationsText: e.target.value })}
                placeholder="e.g., RDN, CSSD, LDN"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
              <input
                type="number"
                value={formData.yearsOfExperience ?? ''}
                onChange={(e) => setFormData({ ...formData, yearsOfExperience: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Consultation Fee</label>
            <input
              type="number"
              value={formData.consultationFee ?? ''}
              onChange={(e) => setFormData({ ...formData, consultationFee: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Specializations</label>
            <div className="space-y-2">
              {SPECIALIZATION_OPTIONS.map((option) => (
                <label key={option.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={(formData.specializations || []).includes(option.value)}
                    onChange={() => toggleSpecialization(option.value)}
                    className="w-4 h-4"
                  />
                  <span className="ml-2">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
