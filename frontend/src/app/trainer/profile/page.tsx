'use client';

import { useEffect, useState } from 'react';
import { trainerAPI } from '@/lib/api';
import { parseUserProfileResponse } from '@/lib/api';
import { pickProfileUpdateFields } from '@/lib/apiHelpers';
import { validateProfileUpdate } from '@/lib/validation';
import { FITNESS_GOAL_OPTIONS } from '@/config/constants';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { toast } from 'sonner';

export default function TrainerProfile() {
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
      const response = await trainerAPI.getProfile();
      const user = parseUserProfileResponse(response);
      setProfile(user);
      setFormData({
        ...user,
        bio: user?.trainerBio || user?.bio || '',
        certificationsText: (Array.isArray(user?.certifications) ? user.certifications : [])
          .map((c: any) => (typeof c === 'string' ? c : c.name))
          .filter(Boolean)
          .join(', '),
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateProfileUpdate({
      firstName: formData.firstName,
      lastName: formData.lastName,
      bio: formData.bio,
      yearsOfExperience: formData.yearsOfExperience,
      hourlyRate: formData.hourlyRate,
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
      });
      const response = await trainerAPI.updateProfile(payload);
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
          <div className="w-20 h-20 bg-blue-200 rounded-full flex items-center justify-center text-3xl">
            👨‍🏫
          </div>
          <div className="ml-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {profile.firstName} {profile.lastName}
            </h2>
            <p className="text-blue-600 font-semibold">Certified Personal Trainer</p>
            <p className="text-gray-600 text-sm mt-1">
              ⭐ {profile.averageRating ? Number(profile.averageRating).toFixed(1) : 'N/A'} / 5
              ({profile.totalRatings || 0} reviews)
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
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
              <input
                type="text"
                value={formData.lastName || ''}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input type="email" value={formData.email || ''} disabled className="w-full px-4 py-2 border rounded-lg bg-gray-100" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Professional Bio</label>
            <textarea
              value={formData.bio || ''}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Certifications</label>
              <input
                type="text"
                value={formData.certificationsText || ''}
                onChange={(e) => setFormData({ ...formData, certificationsText: e.target.value })}
                placeholder="ACE, NASM, ISSA"
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
              <input
                type="number"
                value={formData.yearsOfExperience ?? ''}
                onChange={(e) => setFormData({ ...formData, yearsOfExperience: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hourly Rate ($)</label>
            <input
              type="number"
              value={formData.hourlyRate ?? ''}
              onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg max-w-xs"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Specializations</label>
            <div className="space-y-2">
              {FITNESS_GOAL_OPTIONS.map((goal) => (
                <label key={goal.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={(formData.specializations || []).includes(goal.value)}
                    onChange={(e) => {
                      const current = formData.specializations || [];
                      setFormData({
                        ...formData,
                        specializations: e.target.checked
                          ? [...current, goal.value]
                          : current.filter((v: string) => v !== goal.value),
                      });
                    }}
                    className="w-4 h-4"
                  />
                  <span className="ml-2">{goal.label}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
