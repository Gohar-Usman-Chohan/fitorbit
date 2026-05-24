'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { progressAPI } from '@/lib/api';
import { PROGRESS_LOG_TYPES } from '@/config/constants';
import { validateWorkoutLog } from '@/lib/validation';

interface WorkoutLogFormProps {
  onSuccess?: () => void;
}

export function WorkoutLogForm({ onSuccess }: WorkoutLogFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    exerciseName: '',
    sets: '',
    reps: '',
    weight: '',
    duration: '',
    notes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validationError = validateWorkoutLog(formData);
      if (validationError) {
        toast.error(validationError);
        return;
      }

      await progressAPI.createProgressLog({
        logType: PROGRESS_LOG_TYPES.WORKOUT,
        exerciseName: formData.exerciseName,
        sets: formData.sets ? parseInt(formData.sets, 10) : undefined,
        reps: formData.reps ? parseInt(formData.reps, 10) : undefined,
        weight: formData.weight,
        duration: formData.duration,
        notes: formData.notes,
        logDate: new Date().toISOString(),
      });

      toast.success('Workout logged successfully!');
      setFormData({
        exerciseName: '',
        sets: '',
        reps: '',
        weight: '',
        duration: '',
        notes: '',
      });
      onSuccess?.();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to log workout';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-white rounded-lg shadow">
      <h3 className="text-xl font-semibold text-gray-900">Log Workout</h3>

      <div>
        <label htmlFor="exerciseName" className="block text-sm font-medium text-gray-700 mb-2">
          Exercise Name *
        </label>
        <input
          type="text"
          id="exerciseName"
          name="exerciseName"
          value={formData.exerciseName}
          onChange={handleChange}
          placeholder="e.g., Bench Press"
          disabled={isLoading}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="sets" className="block text-sm font-medium text-gray-700 mb-2">
            Sets
          </label>
          <input
            type="number"
            id="sets"
            name="sets"
            value={formData.sets}
            onChange={handleChange}
            placeholder="e.g., 3"
            disabled={isLoading}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="reps" className="block text-sm font-medium text-gray-700 mb-2">
            Reps
          </label>
          <input
            type="number"
            id="reps"
            name="reps"
            value={formData.reps}
            onChange={handleChange}
            placeholder="e.g., 10"
            disabled={isLoading}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-2">
            Weight (kg)
          </label>
          <input
            type="text"
            id="weight"
            name="weight"
            value={formData.weight}
            onChange={handleChange}
            placeholder="e.g., 50"
            disabled={isLoading}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
            Duration (minutes)
          </label>
          <input
            type="text"
            id="duration"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            placeholder="e.g., 30"
            disabled={isLoading}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Add any notes..."
          disabled={isLoading}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 rounded-lg transition"
      >
        {isLoading ? 'Logging...' : 'Log Workout'}
      </button>
    </form>
  );
}
