'use client';

import { useState } from 'react';
import { appointmentAPI } from '@/lib/api';
import { toast } from 'sonner';

interface ExpertAppointmentActionsProps {
  appointment: any;
  accent?: 'green' | 'orange';
  onUpdated: () => void;
}

export function ExpertAppointmentActions({
  appointment,
  accent = 'green',
  onUpdated,
}: ExpertAppointmentActionsProps) {
  const [isCompleting, setIsCompleting] = useState(false);
  const [isMarkingNoShow, setIsMarkingNoShow] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const endTime = new Date(appointment.appointmentDate);
  endTime.setMinutes(
    endTime.getMinutes() +
      (appointment.durationUnit === 'hours'
        ? appointment.duration * 60
        : appointment.duration)
  );
  const sessionEnded = endTime <= new Date();
  const isPending = appointment.status === 'pending_approval';
  const isScheduled = appointment.status === 'scheduled';

  const completeClass =
    accent === 'orange'
      ? 'bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400'
      : 'bg-green-600 hover:bg-green-700 disabled:bg-green-400';

  const handleApprove = async () => {
    try {
      setIsApproving(true);
      await appointmentAPI.approveAppointment(appointment.id);
      toast.success('Booking approved. Client will receive payment link.');
      onUpdated();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve booking');
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    try {
      setIsRejecting(true);
      await appointmentAPI.rejectAppointment(appointment.id);
      toast.success('Booking request declined');
      onUpdated();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject booking');
    } finally {
      setIsRejecting(false);
    }
  };

  const handleComplete = async () => {
    try {
      setIsCompleting(true);
      await appointmentAPI.completeAppointment(appointment.id);
      toast.success('Session marked as completed');
      onUpdated();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to complete session');
    } finally {
      setIsCompleting(false);
    }
  };

  const handleNoShow = async () => {
    try {
      setIsMarkingNoShow(true);
      await appointmentAPI.markNoShow(appointment.id);
      toast.success('Marked as no-show');
      onUpdated();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to mark no-show');
    } finally {
      setIsMarkingNoShow(false);
    }
  };

  const statusColors: Record<string, string> = {
    pending_approval: 'bg-amber-100 text-amber-800',
    awaiting_payment: 'bg-indigo-100 text-indigo-800',
    scheduled: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };

  return (
    <div className="flex flex-col items-end gap-2 shrink-0">
      <span
        className={`rounded px-3 py-1 text-sm capitalize ${
          statusColors[appointment.status] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {appointment.status?.replace(/_/g, ' ')}
      </span>

      {isPending && (
        <div className="flex gap-2">
          <button
            onClick={handleApprove}
            disabled={isApproving}
            className={`rounded px-3 py-1 text-xs font-medium text-white ${completeClass}`}
          >
            {isApproving ? 'Saving...' : 'Approve'}
          </button>
          <button
            onClick={handleReject}
            disabled={isRejecting}
            className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:bg-red-400"
          >
            {isRejecting ? 'Saving...' : 'Decline'}
          </button>
        </div>
      )}

      {isScheduled && (
        <div className="flex gap-2">
          {sessionEnded && (
            <button
              onClick={handleComplete}
              disabled={isCompleting}
              className={`rounded px-3 py-1 text-xs font-medium text-white ${completeClass}`}
            >
              {isCompleting ? 'Saving...' : 'Complete'}
            </button>
          )}
          <button
            onClick={handleNoShow}
            disabled={isMarkingNoShow}
            className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:bg-red-400"
          >
            {isMarkingNoShow ? 'Saving...' : 'No-show'}
          </button>
        </div>
      )}
    </div>
  );
}
