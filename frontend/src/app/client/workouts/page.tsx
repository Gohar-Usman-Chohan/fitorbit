'use client';

import { useEffect, useMemo, useState } from 'react';
import { Dumbbell } from 'lucide-react';
import { clientAPI, progressAPI } from '@/lib/api';
import { mapClientWorkoutPlan } from '@/lib/apiHelpers';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { WorkoutLogForm } from '@/components/forms/WorkoutLogForm';
import { FormModal } from '@/components/ui/FormModal';
import { Card, CardHeader } from '@/components/ui/Card';
import {
  PlanCardShell,
  PlanItemList,
  PlanItemRow,
  PlansEmptyState,
  PlansFilterEmptyState,
  PlansPageShell,
  PlanStat,
} from '@/components/features/plans/ExpertPlansUI';
import {
  PlanStatusBadge,
  PlanStatusFilter,
  RecentLogCard,
} from '@/components/features/plans/ClientPlansUI';
import { toast } from 'sonner';
import { formatDate } from '@/lib/dateFormat';

type StatusFilter = 'all' | 'active' | 'completed' | 'paused';

export default function WorkoutsContent() {
  const [plans, setPlans] = useState<any[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all');
  const [showLogModal, setShowLogModal] = useState(false);

  const fetchWorkoutData = async () => {
    try {
      setIsLoading(true);
      const [plansRes, logsRes] = await Promise.all([
        clientAPI.getPlans(),
        progressAPI.getProgressLogs({ logType: 'workout' }),
      ]);
      setPlans((plansRes.data.data?.workoutPlans || []).map(mapClientWorkoutPlan));
      setWorkoutLogs(logsRes.data.data?.progress || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load workouts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkoutData();
  }, []);

  const filteredPlans = useMemo(
    () => (filterStatus === 'all' ? plans : plans.filter((plan) => plan.status === filterStatus)),
    [plans, filterStatus]
  );

  const summaryStats = useMemo(() => {
    const activePlans = plans.filter((plan) => plan.status === 'active').length;
    const totalExercises = plans.reduce((sum, plan) => sum + (plan.exerciseCount || 0), 0);
    return [
      { label: 'Active Plans', value: activePlans },
      { label: 'Total Exercises', value: totalExercises, subtitle: 'Across all plans' },
      { label: 'Workout Logs', value: workoutLogs.length, subtitle: 'Sessions logged' },
    ];
  }, [plans, workoutLogs]);

  if (isLoading) return <LoadingSpinner />;

  return (
    <PlansPageShell
      title="My Workouts"
      description="Follow trainer-assigned programs, view exercises, and log your training sessions."
      accent="blue"
      createLabel="Log Workout"
      onCreate={() => setShowLogModal(true)}
      stats={summaryStats}
    >
      <FormModal
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
        title="Log a Workout"
        subtitle="Record your session so your trainer can track your progress"
        icon={<Dumbbell size={22} strokeWidth={2} />}
        accent="blue"
        size="md"
      >
        <WorkoutLogForm
          onSuccess={() => {
            setShowLogModal(false);
            fetchWorkoutData();
          }}
        />
      </FormModal>

      {plans.length > 0 ? (
        <div className="space-y-6">
          <PlanStatusFilter
            value={filterStatus}
            onChange={(value) => setFilterStatus(value as StatusFilter)}
            accent="blue"
          />

          {filteredPlans.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              {filteredPlans.map((plan) => (
                <PlanCardShell
                  key={plan.id}
                  accent="blue"
                  icon={Dumbbell}
                  title={plan.title || plan.name}
                  clientName={plan.expertName}
                  metaPrefix="By"
                  badges={[
                    (plan.workoutType || 'mixed').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
                    (plan.difficultyLevel || 'intermediate').replace(/\b\w/g, (c: string) => c.toUpperCase()),
                  ]}
                  description={plan.description}
                  actions={<PlanStatusBadge status={plan.status} />}
                  stats={
                    <>
                      <PlanStat accent="blue" label="Exercises" value={plan.exerciseCount || 0} />
                      <PlanStat accent="blue" label="Duration" value={`${plan.duration || '—'}w`} />
                      <PlanStat accent="blue" label="Frequency" value={`${plan.frequency || '—'}/wk`} />
                    </>
                  }
                  footer={
                    <PlanItemList
                      accent="blue"
                      title="Exercise list"
                      emptyMessage="Your trainer has not added exercises to this plan yet."
                      items={(plan.exercises || []).map((exercise: any, idx: number) => (
                        <PlanItemRow key={idx} accent="blue">
                          <span className="font-medium text-slate-900">
                            {exercise.exerciseName || exercise.name}
                          </span>
                          <span className="text-slate-500">
                            {' '}
                            · {exercise.sets || 3} sets × {exercise.reps || 10} reps
                          </span>
                        </PlanItemRow>
                      ))}
                    />
                  }
                />
              ))}
            </div>
          ) : (
            <PlansFilterEmptyState
              accent="blue"
              onClear={() => setFilterStatus('all')}
              message={`No ${filterStatus} workout plans found.`}
              clearLabel="Show all plans"
            />
          )}
        </div>
      ) : (
        <PlansEmptyState
          accent="blue"
          icon={Dumbbell}
          title="No workout plans yet"
          description="Book a trainer or wait for them to assign a personalized workout program to you."
          actionLabel="Log a workout"
          onAction={() => setShowLogModal(true)}
        />
      )}

      {workoutLogs.length > 0 ? (
        <Card padding>
          <CardHeader
            title="Recent Workout Logs"
            description="Your latest logged training sessions"
          />
          <div className="space-y-3">
            {workoutLogs.slice(0, 8).map((log) => {
              const exercise = log.workoutLog?.exercisesCompleted?.[0];
              const details = [
                exercise?.actualSets ? `${exercise.actualSets} sets` : '',
                exercise?.actualReps ? `× ${exercise.actualReps} reps` : '',
                exercise?.weightUsed ? `@ ${exercise.weightUsed} kg` : '',
                log.workoutLog?.durationMinutes ? `${log.workoutLog.durationMinutes} min` : '',
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <RecentLogCard
                  key={log._id || log.id}
                  accent="blue"
                  title={exercise?.exerciseName || 'Workout Session'}
                  details={details || log.workoutLog?.notes}
                  date={formatDate(log.logDate || log.createdAt)}
                />
              );
            })}
          </div>
        </Card>
      ) : null}
    </PlansPageShell>
  );
}
