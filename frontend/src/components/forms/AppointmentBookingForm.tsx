'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { appointmentAPI, clientAPI } from '@/lib/api';
import { validateAppointmentBooking } from '@/lib/validation';

interface AppointmentBookingFormProps {
  expertId: string;
  expertType: 'trainer' | 'nutritionist';
  expertName: string;
  onSuccess?: () => void;
}

const BOOKING_INFO = 'Sessions are available Monday – Friday, 9:00 AM – 5:00 PM.';

function isWeekend(dateStr: string) {
  const day = new Date(`${dateStr}T12:00:00`).getDay();
  return day === 0 || day === 6;
}

export function AppointmentBookingForm({
  expertId,
  expertType,
  expertName,
  onSuccess,
}: AppointmentBookingFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    appointmentDate: '',
    appointmentTime: '',
    sessionType: 'online' as 'online' | 'in_person',
    duration: '60',
    topic: '',
    clientNotes: '',
    location: '',
  });

  useEffect(() => {
    if (!formData.appointmentDate || isWeekend(formData.appointmentDate)) {
      setAvailableSlots([]);
      return;
    }

    const loadSlots = async () => {
      try {
        setSlotsLoading(true);
        const response = await appointmentAPI.getAvailableSlots(expertId, {
          date: formData.appointmentDate,
          duration: formData.duration,
        });
        setAvailableSlots(response.data.data?.slots || []);
      } catch {
        setAvailableSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    };

    loadSlots();
  }, [expertId, formData.appointmentDate, formData.duration]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'appointmentDate' ? { appointmentTime: '' } : {}),
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!formData.appointmentDate || !formData.appointmentTime) {
        toast.error('Please select date and time');
        return;
      }

      if (isWeekend(formData.appointmentDate)) {
        toast.error('Bookings are only available Monday to Friday');
        return;
      }

      const validationError = validateAppointmentBooking(formData);
      if (validationError) {
        toast.error(validationError);
        return;
      }

      const selectedSlot = availableSlots.find(
        (slot) => slot.time === formData.appointmentTime
      );
      if (selectedSlot && !selectedSlot.available) {
        toast.error('This time slot is no longer available');
        return;
      }

      const appointmentDateTime = new Date(
        `${formData.appointmentDate}T${formData.appointmentTime}`
      );

      await appointmentAPI.createAppointment({
        expertId,
        expertType,
        appointmentDate: appointmentDateTime,
        duration: parseInt(formData.duration),
        durationUnit: 'minutes',
        sessionType: formData.sessionType,
        topic: formData.topic,
        clientNotes: formData.clientNotes,
        location: formData.location,
      });

      if (expertType === 'trainer') {
        await clientAPI.bookTrainer(expertId, {});
      } else {
        await clientAPI.bookNutritionist(expertId, {});
      }

      toast.success('Booking request sent! You will be notified after expert approval.');
      setFormData({
        appointmentDate: '',
        appointmentTime: '',
        sessionType: 'online',
        duration: '60',
        topic: '',
        clientNotes: '',
        location: '',
      });
      setAvailableSlots([]);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit booking request');
    } finally {
      setIsLoading(false);
    }
  };

  const today = new Date();
  const minDate = today.toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg bg-white p-6 shadow">
      <div>
        <h3 className="mb-2 text-xl font-semibold text-gray-900">
          Request session with {expertName}
        </h3>
        <p className="mb-1 text-sm text-gray-600">
          Type: <span className="font-medium capitalize">{expertType}</span>
        </p>
        <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800">{BOOKING_INFO}</p>
        <p className="mt-2 text-xs text-gray-500">
          After approval you will receive a Stripe payment link to confirm the booking.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="appointmentDate" className="mb-2 block text-sm font-medium text-gray-700">
            Date *
          </label>
          <input
            type="date"
            id="appointmentDate"
            name="appointmentDate"
            value={formData.appointmentDate}
            onChange={handleChange}
            min={minDate}
            disabled={isLoading}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="duration" className="mb-2 block text-sm font-medium text-gray-700">
            Duration
          </label>
          <select
            id="duration"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            disabled={isLoading}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="30">30 minutes</option>
            <option value="60">60 minutes</option>
            <option value="90">90 minutes</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="appointmentTime" className="mb-2 block text-sm font-medium text-gray-700">
          Available time *
        </label>
        {!formData.appointmentDate ? (
          <p className="text-sm text-gray-500">Select a weekday first</p>
        ) : isWeekend(formData.appointmentDate) ? (
          <p className="text-sm text-red-600">Weekends are not available. Choose Mon–Fri.</p>
        ) : slotsLoading ? (
          <p className="text-sm text-gray-500">Loading available slots...</p>
        ) : availableSlots.filter((s) => s.available).length === 0 ? (
          <p className="text-sm text-gray-500">No open slots for this date. Try another day.</p>
        ) : (
          <select
            id="appointmentTime"
            name="appointmentTime"
            value={formData.appointmentTime}
            onChange={handleChange}
            disabled={isLoading}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a time</option>
            {availableSlots
              .filter((slot) => slot.available)
              .map((slot) => (
                <option key={slot.time} value={slot.time}>
                  {slot.time}
                </option>
              ))}
          </select>
        )}
      </div>

      <div>
        <label htmlFor="sessionType" className="mb-2 block text-sm font-medium text-gray-700">
          Session type
        </label>
        <select
          id="sessionType"
          name="sessionType"
          value={formData.sessionType}
          onChange={handleChange}
          disabled={isLoading}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="online">Online</option>
          <option value="in_person">In person</option>
        </select>
      </div>

      {formData.sessionType === 'in_person' && (
        <div>
          <label htmlFor="location" className="mb-2 block text-sm font-medium text-gray-700">
            Location *
          </label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Enter appointment location"
            disabled={isLoading}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      <div>
        <label htmlFor="topic" className="mb-2 block text-sm font-medium text-gray-700">
          Topic / agenda
        </label>
        <input
          type="text"
          id="topic"
          name="topic"
          value={formData.topic}
          onChange={handleChange}
          placeholder="What will you discuss?"
          disabled={isLoading}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="clientNotes" className="mb-2 block text-sm font-medium text-gray-700">
          Notes for {expertType}
        </label>
        <textarea
          id="clientNotes"
          name="clientNotes"
          value={formData.clientNotes}
          onChange={handleChange}
          placeholder="Any additional information..."
          disabled={isLoading}
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading || !formData.appointmentTime}
        className="w-full rounded-lg bg-blue-600 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:bg-blue-400"
      >
        {isLoading ? 'Submitting...' : 'Send booking request'}
      </button>
    </form>
  );
}
