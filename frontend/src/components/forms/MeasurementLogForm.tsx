'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { progressAPI } from '@/lib/api';
import { PROGRESS_LOG_TYPES } from '@/config/constants';
import { validateMeasurementLog } from '@/lib/validation';

interface MeasurementLogFormProps {
  onSuccess?: () => void;
}

export function MeasurementLogForm({ onSuccess }: MeasurementLogFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    weight: '',
    bodyFatPercentage: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validationError = validateMeasurementLog(formData);
      if (validationError) {
        toast.error(validationError);
        return;
      }

      await progressAPI.createProgressLog({
        logType: PROGRESS_LOG_TYPES.MEASUREMENT,
        weight: parseFloat(formData.weight),
        bodyFatPercentage: formData.bodyFatPercentage
          ? parseFloat(formData.bodyFatPercentage)
          : undefined,
        notes: formData.notes,
        logDate: new Date().toISOString(),
      });

      toast.success('Measurement logged successfully!');
      setFormData({ weight: '', bodyFatPercentage: '', notes: '' });
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to log measurement');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card card-body space-y-4">
      <h3 className="text-lg font-semibold text-slate-900">Log Body Measurement</h3>
      <p className="text-sm text-slate-500">
        Track your weight over time to see progress on the chart.
      </p>

      <div>
        <label htmlFor="weight" className="label-field">
          Weight (kg) *
        </label>
        <input
          id="weight"
          name="weight"
          type="number"
          step="0.1"
          min="0"
          value={formData.weight}
          onChange={(e) => setFormData((p) => ({ ...p, weight: e.target.value }))}
          className="input-field"
          placeholder="e.g. 72.5"
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="bodyFatPercentage" className="label-field">
          Body fat % (optional)
        </label>
        <input
          id="bodyFatPercentage"
          name="bodyFatPercentage"
          type="number"
          step="0.1"
          min="0"
          max="100"
          value={formData.bodyFatPercentage}
          onChange={(e) => setFormData((p) => ({ ...p, bodyFatPercentage: e.target.value }))}
          className="input-field"
          placeholder="e.g. 18"
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="notes" className="label-field">
          Notes (optional)
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          value={formData.notes}
          onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
          className="input-field"
          placeholder="How are you feeling?"
          disabled={isLoading}
        />
      </div>

      <button type="submit" disabled={isLoading} className="btn-primary">
        {isLoading ? 'Saving...' : 'Save Measurement'}
      </button>
    </form>
  );
}
