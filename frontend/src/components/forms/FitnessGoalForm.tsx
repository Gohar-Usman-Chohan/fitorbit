'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { clientAPI } from '@/lib/api';
import { FITNESS_GOAL_OPTIONS } from '@/config/constants';
import { validateFitnessGoal } from '@/lib/validation';

interface FitnessGoalFormProps {
  onSuccess?: () => void;
}

export function FitnessGoalForm({ onSuccess }: FitnessGoalFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    goals: [] as string[],
    currentWeight: '',
    targetWeight: '',
    timeline: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;

    if (type === 'checkbox') {
      setFormData((prev) => ({
        ...prev,
        goals: (e.target as HTMLInputElement).checked
          ? [...prev.goals, value]
          : prev.goals.filter((g) => g !== value),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validationError = validateFitnessGoal(formData);
      if (validationError) {
        toast.error(validationError);
        return;
      }

      await clientAPI.createFitnessGoal({
        goals: formData.goals,
        currentWeight: parseFloat(formData.currentWeight),
        targetWeight: parseFloat(formData.targetWeight),
        timeline: formData.timeline,
      });

      toast.success('Fitness goal created successfully!');
      setFormData({
        goals: [],
        currentWeight: '',
        targetWeight: '',
        timeline: '',
      });
      onSuccess?.();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create fitness goal';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const goalOptions = FITNESS_GOAL_OPTIONS;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-white rounded-lg shadow">
      <h3 className="text-xl font-semibold text-gray-900">Set Fitness Goals</h3>

      {/* Goals Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Fitness Goals
        </label>
        <div className="space-y-2">
          {goalOptions.map((goal) => (
            <label key={goal.value} className="flex items-center">
              <input
                type="checkbox"
                value={goal.value}
                checked={formData.goals.includes(goal.value)}
                onChange={handleChange}
                disabled={isLoading}
                className="w-4 h-4 text-blue-600"
              />
              <span className="ml-3 text-gray-700">{goal.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Current Weight */}
      <div>
        <label htmlFor="currentWeight" className="block text-sm font-medium text-gray-700 mb-2">
          Current Weight (kg)
        </label>
        <input
          type="number"
          id="currentWeight"
          name="currentWeight"
          value={formData.currentWeight}
          onChange={handleChange}
          step="0.1"
          disabled={isLoading}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Target Weight */}
      <div>
        <label htmlFor="targetWeight" className="block text-sm font-medium text-gray-700 mb-2">
          Target Weight (kg)
        </label>
        <input
          type="number"
          id="targetWeight"
          name="targetWeight"
          value={formData.targetWeight}
          onChange={handleChange}
          step="0.1"
          disabled={isLoading}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Timeline */}
      <div>
        <label htmlFor="timeline" className="block text-sm font-medium text-gray-700 mb-2">
          Timeline (months)
        </label>
        <select
          id="timeline"
          name="timeline"
          value={formData.timeline}
          onChange={handleChange}
          disabled={isLoading}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select timeline</option>
          <option value="1">1 Month</option>
          <option value="3">3 Months</option>
          <option value="6">6 Months</option>
          <option value="12">12 Months</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 rounded-lg transition"
      >
        {isLoading ? 'Creating...' : 'Create Fitness Goal'}
      </button>
    </form>
  );
}
