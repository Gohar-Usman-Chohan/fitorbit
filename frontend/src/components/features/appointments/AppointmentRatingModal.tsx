'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { validateRating } from '@/lib/validation';

interface AppointmentRatingModalProps {
  appointment: {
    id: string;
    expertName?: string;
    topic?: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, feedback: string) => Promise<void>;
}

export function AppointmentRatingModal({
  appointment,
  isOpen,
  onClose,
  onSubmit,
}: AppointmentRatingModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !appointment) return null;

  const handleSubmit = async () => {
    const validationError = validateRating(rating, feedback);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(rating, feedback.trim());
      setRating(0);
      setHoverRating(0);
      setFeedback('');
      onClose();
    } catch {
      // Error toast handled by caller
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-bold text-gray-900">Rate your session</h2>
        <p className="mt-2 text-sm text-gray-600">
          How was your session with {appointment.expertName || 'your expert'}?
          {appointment.topic ? ` (${appointment.topic})` : ''}
        </p>

        <div className="mt-6 flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="text-3xl transition-transform hover:scale-110"
              aria-label={`Rate ${star} stars`}
            >
              {star <= displayRating ? '⭐' : '☆'}
            </button>
          ))}
        </div>

        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Optional feedback about the session..."
          rows={4}
          className="mt-6 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Later
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-400"
          >
            {isSubmitting ? 'Submitting...' : 'Submit rating'}
          </button>
        </div>
      </div>
    </div>
  );
}
