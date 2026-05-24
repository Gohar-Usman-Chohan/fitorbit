'use client';

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { userAPI, parseUserProfileResponse } from '@/lib/api';
import { pickProfileUpdateFields } from '@/lib/apiHelpers';
import { validateProfileUpdate } from '@/lib/validation';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { toast } from 'sonner';
import type { RootState } from '@/redux/store';
import { formatDate } from '@/lib/dateFormat';

function splitName(name?: string) {
  if (!name) return { firstName: '', lastName: '' };
  const parts = name.trim().split(/\s+/);
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' '),
  };
}

function mergeAuthFallback(
  profile: Record<string, unknown> | null,
  authUser: RootState['auth']['user']
) {
  if (!authUser) return profile;

  const fromName = splitName(authUser.name);

  return {
    ...profile,
    id: profile?.id ?? authUser.id,
    email: profile?.email ?? authUser.email,
    role: profile?.role ?? authUser.role,
    firstName: profile?.firstName ?? fromName.firstName,
    lastName: profile?.lastName ?? fromName.lastName,
    isEmailVerified: profile?.isEmailVerified ?? authUser.isEmailVerified,
  };
}

function ClientProfileContent() {
  const authUser = useSelector((state: RootState) => state.auth.user);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await userAPI.getCurrentProfile();
      const user = mergeAuthFallback(parseUserProfileResponse(response), authUser);

      if (!user?.email && !user?.firstName) {
        throw new Error('Profile data was empty');
      }

      setProfile(user);
      setFormData(user);
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to load profile';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'age' ? (value === '' ? '' : Number(value)) : value,
    }));
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateProfileUpdate({
      firstName: String(formData.firstName ?? ''),
      lastName: String(formData.lastName ?? ''),
      age: formData.age as string | number | undefined,
      phone: String(formData.phone ?? ''),
    });
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setIsSaving(true);
      const response = await userAPI.updateProfile(pickProfileUpdateFields(formData));
      const user = mergeAuthFallback(parseUserProfileResponse(response), authUser);

      if (!user) {
        throw new Error('Profile update returned no data');
      }

      setProfile(user);
      setFormData(user);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to update profile';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto">
        <p className="text-gray-500 mb-4">No profile data found.</p>
        <button
          type="button"
          onClick={fetchProfile}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const accountStatus = String(profile.accountStatus || '');
  const isActive = accountStatus === 'active';
  const createdYear = profile.createdAt ? new Date(String(profile.createdAt)).getFullYear() : null;
  const memberYear =
    createdYear !== null && !Number.isNaN(createdYear) ? createdYear : null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="page-title">My Profile</h1>
        <button
          onClick={() => {
            if (isEditing) {
              setFormData(profile);
            }
            setIsEditing(!isEditing);
          }}
          className={`px-6 py-2 rounded-lg font-semibold transition ${
            isEditing
              ? 'bg-gray-600 hover:bg-gray-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-8">
        <div className="flex items-center mb-8 pb-8 border-b">
          <div className="w-24 h-24 bg-blue-200 rounded-full flex items-center justify-center text-4xl overflow-hidden">
            {profile.profilePicture ? (
              <img
                src={String(profile.profilePicture)}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              '👤'
            )}
          </div>
          <div className="ml-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {String(profile.firstName || '')} {String(profile.lastName || '')}
            </h2>
            <p className="text-gray-600">Member since {memberYear ?? '—'}</p>
            <p className="text-gray-600 capitalize">Role: {String(profile.role || 'client')}</p>
          </div>
        </div>

        <form onSubmit={handleSaveChanges} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
              <input
                type="text"
                name="firstName"
                value={String(formData.firstName || '')}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={String(formData.lastName || '')}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={String(formData.email || '')}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
              <input
                type="number"
                name="age"
                value={formData.age != null && formData.age !== '' ? String(formData.age) : ''}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={String(formData.phone || '')}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>
          </div>

          {isEditing && (
            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg transition"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </form>

        <div className="mt-8 pt-8 border-t">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Account Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <p className="text-gray-600">Account Status</p>
              <p className="font-semibold text-gray-900 capitalize">
                {isActive ? '✅ Active' : `❌ ${accountStatus || 'Inactive'}`}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Email Verified</p>
              <p className="font-semibold text-gray-900">
                {profile.isEmailVerified ? '✅ Yes' : '❌ No'}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Member Since</p>
              <p className="font-semibold text-gray-900">{formatDate(profile.createdAt as string)}</p>
            </div>
            <div>
              <p className="text-gray-600">Last Updated</p>
              <p className="font-semibold text-gray-900">{formatDate(profile.updatedAt as string)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClientProfileContent;
