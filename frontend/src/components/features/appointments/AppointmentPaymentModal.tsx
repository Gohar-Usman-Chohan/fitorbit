'use client';

import { useState, useEffect } from 'react';
import { appointmentAPI } from '@/lib/api';
import { toast } from 'sonner';
import { formatDateTime } from '@/lib/dateFormat';

interface AppointmentPaymentModalProps {
  appointment: {
    id: string;
    expertName?: string;
    appointmentDate?: string;
    paymentAmount?: number;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onPaid: () => void;
}

export function AppointmentPaymentModal({
  appointment,
  isOpen,
  onClose,
  onPaid,
}: AppointmentPaymentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen || !appointment) {
      setSessionId(null);
      setAmount(null);
      return;
    }

    const loadCheckout = async () => {
      try {
        setIsLoading(true);
        const response = await appointmentAPI.createCheckoutSession(appointment.id);
        const data = response.data.data;
        setSessionId(data.sessionId);
        setAmount(data.amount);
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to start payment');
        onClose();
      } finally {
        setIsLoading(false);
      }
    };

    loadCheckout();
  }, [isOpen, appointment, onClose]);

  if (!isOpen || !appointment) return null;

  const handlePay = async () => {
    try {
      setIsLoading(true);
      await appointmentAPI.confirmPayment(appointment.id, sessionId || undefined);
      toast.success('Payment successful! Your appointment is confirmed.');
      onPaid();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Payment failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div className="max-h-[90dvh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:max-w-md sm:rounded-xl sm:p-6">
        <h2 className="text-lg font-bold text-gray-900 sm:text-xl">Complete payment</h2>
        <p className="mt-2 text-sm text-gray-600">
          Pay via Stripe to confirm your session with {appointment.expertName || 'your expert'}.
        </p>
        {appointment.appointmentDate && (
          <p className="mt-1 text-sm text-gray-500">
            {formatDateTime(appointment.appointmentDate)}
          </p>
        )}

        <div className="mt-6 rounded-lg border border-indigo-100 bg-indigo-50 p-4">
          <p className="text-sm text-indigo-900">Amount due</p>
          <p className="text-2xl font-bold text-indigo-700 sm:text-3xl">
            {amount != null ? `$${amount.toFixed(2)}` : '—'}
          </p>
          <p className="mt-2 text-xs text-indigo-700">Dummy Stripe checkout (demo mode)</p>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handlePay}
            disabled={isLoading || !sessionId}
            className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-indigo-400"
          >
            {isLoading ? 'Processing...' : 'Pay with Stripe'}
          </button>
        </div>
      </div>
    </div>
  );
}
