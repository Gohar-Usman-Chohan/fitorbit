'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { progressAPI } from '@/lib/api';
import { PROGRESS_LOG_TYPES } from '@/config/constants';
import { validateNutritionLog } from '@/lib/validation';

interface DietLogFormProps {
  onSuccess?: () => void;
}

export function DietLogForm({ onSuccess }: DietLogFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    mealType: 'breakfast',
    mealDescription: '',
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
    notes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
      const validationError = validateNutritionLog(formData);
      if (validationError) {
        toast.error(validationError);
        return;
      }

      await progressAPI.createProgressLog({
        logType: PROGRESS_LOG_TYPES.NUTRITION,
        mealType: formData.mealType,
        mealDescription: formData.mealDescription,
        calories: formData.calories ? parseInt(formData.calories, 10) : undefined,
        protein: formData.protein ? parseFloat(formData.protein) : undefined,
        carbs: formData.carbs ? parseFloat(formData.carbs) : undefined,
        fats: formData.fats ? parseFloat(formData.fats) : undefined,
        notes: formData.notes,
        logDate: new Date().toISOString(),
      });

      toast.success('Meal logged successfully!');
      setFormData({
        mealType: 'breakfast',
        mealDescription: '',
        calories: '',
        protein: '',
        carbs: '',
        fats: '',
        notes: '',
      });
      onSuccess?.();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to log meal';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-white rounded-lg shadow">
      <h3 className="text-xl font-semibold text-gray-900">Log Meal</h3>

      <div>
        <label htmlFor="mealType" className="block text-sm font-medium text-gray-700 mb-2">
          Meal Type
        </label>
        <select
          id="mealType"
          name="mealType"
          value={formData.mealType}
          onChange={handleChange}
          disabled={isLoading}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="breakfast">Breakfast</option>
          <option value="lunch">Lunch</option>
          <option value="dinner">Dinner</option>
          <option value="snack">Snack</option>
        </select>
      </div>

      <div>
        <label htmlFor="mealDescription" className="block text-sm font-medium text-gray-700 mb-2">
          Meal Description *
        </label>
        <textarea
          id="mealDescription"
          name="mealDescription"
          value={formData.mealDescription}
          onChange={handleChange}
          placeholder="Describe what you ate..."
          disabled={isLoading}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="calories" className="block text-sm font-medium text-gray-700 mb-2">
            Calories (kcal)
          </label>
          <input
            type="number"
            id="calories"
            name="calories"
            value={formData.calories}
            onChange={handleChange}
            placeholder="e.g., 500"
            disabled={isLoading}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="protein" className="block text-sm font-medium text-gray-700 mb-2">
            Protein (g)
          </label>
          <input
            type="number"
            id="protein"
            name="protein"
            value={formData.protein}
            onChange={handleChange}
            placeholder="e.g., 25"
            step="0.1"
            disabled={isLoading}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="carbs" className="block text-sm font-medium text-gray-700 mb-2">
            Carbs (g)
          </label>
          <input
            type="number"
            id="carbs"
            name="carbs"
            value={formData.carbs}
            onChange={handleChange}
            placeholder="e.g., 50"
            step="0.1"
            disabled={isLoading}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="fats" className="block text-sm font-medium text-gray-700 mb-2">
            Fats (g)
          </label>
          <input
            type="number"
            id="fats"
            name="fats"
            value={formData.fats}
            onChange={handleChange}
            placeholder="e.g., 15"
            step="0.1"
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
          rows={2}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 rounded-lg transition"
      >
        {isLoading ? 'Logging...' : 'Log Meal'}
      </button>
    </form>
  );
}
