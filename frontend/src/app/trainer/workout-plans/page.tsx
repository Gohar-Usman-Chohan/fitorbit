'use client';

import { useEffect, useMemo, useState } from 'react';
import { Dumbbell, Pencil, Plus, Trash2 } from 'lucide-react';
import { trainerAPI } from '@/lib/api';
import { mapWorkoutPlan } from '@/lib/apiHelpers';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { buildClientFilterOptions, ClientPlanFilter } from '@/components/ui/ClientPlanFilter';
import {
  PlanActionButton,
  PlanCardShell,
  PlanItemList,
  PlanItemRow,
  PlansEmptyState,
  PlansFilterEmptyState,
  PlansPageShell,
  PlanStat,
} from '@/components/features/plans/ExpertPlansUI';
import {
  FormModal,
  ModalPrimaryButton,
  ModalSecondaryButton,
  modalFieldClass,
  modalLabelClass,
} from '@/components/ui/FormModal';
import { toast } from 'sonner';
import { FITNESS_GOAL_OPTIONS, WORKOUT_TYPES, WORKOUT_FREQUENCY } from '@/config/constants';
import { validateExercises, validateWorkoutPlanCreate } from '@/lib/validation';
import { todayDateInputValue } from '@/lib/dateFormat';

type ExerciseRow = {
  exerciseName: string;
  sets: number;
  reps: number;
};

const emptyExercise = (): ExerciseRow => ({ exerciseName: '', sets: 3, reps: 10 });

const createEmptyForm = () => ({
  clientId: '',
  title: '',
  description: '',
  workoutType: WORKOUT_TYPES.STRENGTH,
  targetGoal: 'general_fitness',
  duration: '4',
  difficultyLevel: 'beginner',
  frequency: '3',
  startDate: todayDateInputValue(),
  exercises: [emptyExercise()],
});

function normalizeExercises(exercises: ExerciseRow[]): ExerciseRow[] {
  return exercises
    .filter((exercise) => exercise.exerciseName.trim())
    .map((exercise) => ({
      exerciseName: exercise.exerciseName.trim(),
      sets: Number(exercise.sets) || 3,
      reps: Number(exercise.reps) || 10,
    }));
}

function ExerciseListEditor({
  exercises,
  onChange,
  accent = 'blue',
}: {
  exercises: ExerciseRow[];
  onChange: (exercises: ExerciseRow[]) => void;
  accent?: 'blue' | 'green';
}) {
  const addBtnClass =
    accent === 'green'
      ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
      : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50';

  const updateRow = (index: number, field: keyof ExerciseRow, value: string | number) => {
    onChange(
      exercises.map((row, i) =>
        i === index
          ? {
              ...row,
              [field]: field === 'exerciseName' ? value : Number(value) || 0,
            }
          : row
      )
    );
  };

  const addRow = () => onChange([...exercises, emptyExercise()]);

  const removeRow = (index: number) => {
    if (exercises.length <= 1) {
      onChange([emptyExercise()]);
      return;
    }
    onChange(exercises.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-800">Exercises</p>
        <button
          type="button"
          onClick={addRow}
          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition ${addBtnClass}`}
        >
          <Plus size={16} />
          Add exercise
        </button>
      </div>
      <div className="space-y-2.5">
        {exercises.map((exercise, index) => (
          <div
            key={index}
            className="rounded-xl border border-gray-200/90 bg-white p-3 shadow-sm ring-1 ring-gray-100/80"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Exercise {index + 1}
              </span>
              <button
                type="button"
                onClick={() => removeRow(index)}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
                aria-label="Remove exercise"
              >
                <Trash2 size={14} />
                Remove
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_88px_88px]">
              <div>
                <label className={modalLabelClass}>Name</label>
                <input
                  type="text"
                  placeholder="e.g. Squats, Bench press"
                  value={exercise.exerciseName}
                  onChange={(e) => updateRow(index, 'exerciseName', e.target.value)}
                  className={modalFieldClass}
                />
              </div>
              <div>
                <label className={modalLabelClass}>Sets</label>
                <input
                  type="number"
                  min={1}
                  value={exercise.sets}
                  onChange={(e) => updateRow(index, 'sets', e.target.value)}
                  className={modalFieldClass}
                />
              </div>
              <div>
                <label className={modalLabelClass}>Reps</label>
                <input
                  type="number"
                  min={1}
                  value={exercise.reps}
                  onChange={(e) => updateRow(index, 'reps', e.target.value)}
                  className={modalFieldClass}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500">Each exercise needs a name. Sets and reps default to 3×10.</p>
    </div>
  );
}

export default function WorkoutPlans() {
  const confirm = useConfirm();
  const [plans, setPlans] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState(createEmptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [editingPlan, setEditingPlan] = useState<{ id: string; title: string; exerciseCount: number } | null>(null);
  const [editingExercises, setEditingExercises] = useState<ExerciseRow[]>([]);
  const [isUpdatingExercises, setIsUpdatingExercises] = useState(false);
  const [clientFilter, setClientFilter] = useState('');

  const clientFilterOptions = useMemo(
    () => buildClientFilterOptions(clients, plans),
    [clients, plans]
  );

  const filteredPlans = useMemo(
    () => (clientFilter ? plans.filter((plan) => plan.clientId === clientFilter) : plans),
    [plans, clientFilter]
  );

  const summaryStats = useMemo(() => {
    const clientIds = new Set(plans.map((plan) => plan.clientId).filter(Boolean));
    const totalExercises = plans.reduce((sum, plan) => sum + (plan.exerciseCount || 0), 0);
    return [
      { label: 'Total Plans', value: plans.length },
      { label: 'Clients Assigned', value: clientIds.size },
      { label: 'Total Exercises', value: totalExercises, subtitle: 'Across all plans' },
    ];
  }, [plans]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [plansRes, clientsRes] = await Promise.all([
        trainerAPI.getWorkouts(),
        trainerAPI.getClients({ scope: 'assignable', limit: 100 }),
      ]);
      setPlans((plansRes.data.data?.workouts || []).map(mapWorkoutPlan));
      setClients(clientsRes.data.data?.clients || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load workout plans');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setFormData(createEmptyForm());
  };

  const openCreateModal = () => {
    setFormData(createEmptyForm());
    setShowCreateModal(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateWorkoutPlanCreate({
      clientId: formData.clientId,
      title: formData.title,
      description: formData.description,
      duration: formData.duration,
      frequency: formData.frequency,
      startDate: formData.startDate,
      exercises: formData.exercises,
    });
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const exercises = normalizeExercises(formData.exercises);
    const frequency = Math.round(Number(formData.frequency));

    try {
      setIsSaving(true);
      await trainerAPI.createWorkout({
        clientId: formData.clientId,
        title: formData.title,
        description: formData.description,
        workoutType: formData.workoutType,
        duration: Number(formData.duration),
        difficultyLevel: formData.difficultyLevel,
        frequency,
        startDate: formData.startDate,
        targetGoals: [formData.targetGoal],
        exercises,
      });
      toast.success('Workout plan created');
      closeCreateModal();
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create plan');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (planId: string) => {
    const confirmed = await confirm({
      title: 'Delete workout plan?',
      message: 'This workout plan will be permanently removed for the client.',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      await trainerAPI.deleteWorkout(planId);
      toast.success('Plan deleted');
      setPlans(plans.filter((p) => p.id !== planId));
      if (editingPlan?.id === planId) {
        setEditingPlan(null);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete plan');
    }
  };

  const openEditExercises = (plan: any) => {
    setEditingPlan({ id: plan.id, title: plan.title, exerciseCount: plan.exerciseCount || 0 });
    const rows =
      plan.exercises?.length > 0
        ? plan.exercises.map((ex: any) => ({
            exerciseName: ex.exerciseName || ex.name || '',
            sets: Number(ex.sets) || 3,
            reps: Number(ex.reps) || 10,
          }))
        : [emptyExercise()];
    setEditingExercises(rows);
  };

  const handleSaveExercises = async () => {
    if (!editingPlan) return;

    const validationError = validateExercises(editingExercises);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const exercises = normalizeExercises(editingExercises);

    try {
      setIsUpdatingExercises(true);
      await trainerAPI.updateWorkout(editingPlan.id, { exercises });
      toast.success('Exercises updated');
      setEditingPlan(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update exercises');
    } finally {
      setIsUpdatingExercises(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <PlansPageShell
      title="Workout Plans"
      description="Create, assign, and manage personalized workout programs for your clients."
      accent="blue"
      createLabel="Create New Plan"
      onCreate={openCreateModal}
      stats={summaryStats}
    >
      <FormModal
        isOpen={showCreateModal}
        onClose={closeCreateModal}
        title="Create Workout Plan"
        subtitle="Assign a personalized plan with exercises to your client"
        icon={<Dumbbell size={22} strokeWidth={2} />}
        accent="blue"
        size="xl"
        closeOnBackdrop={!isSaving}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <ModalSecondaryButton onClick={closeCreateModal} disabled={isSaving}>
              Cancel
            </ModalSecondaryButton>
            <ModalPrimaryButton
              accent="blue"
              type="submit"
              form="create-workout-form"
              disabled={isSaving}
            >
              {isSaving ? 'Creating...' : 'Create Plan'}
            </ModalPrimaryButton>
          </div>
        }
      >
        <form id="create-workout-form" onSubmit={handleCreate} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className={modalLabelClass}>Client</label>
              <select
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className={modalFieldClass}
                required
              >
                <option value="">Select client</option>
                {clients.map((c) => (
                  <option key={c.id || c.userId?._id} value={c.id || c.userId?._id}>
                    {c.name || `${c.userId?.firstName} ${c.userId?.lastName}`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={modalLabelClass}>Title</label>
              <input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={modalFieldClass}
                placeholder="e.g. Beginner strength block"
                required
              />
            </div>
          </div>

          <div>
            <label className={modalLabelClass}>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={`${modalFieldClass} min-h-[88px] resize-y`}
              rows={3}
              placeholder="Optional notes for the client"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <label className={modalLabelClass}>Type</label>
              <select
                value={formData.workoutType}
                onChange={(e) => setFormData({ ...formData, workoutType: e.target.value })}
                className={modalFieldClass}
              >
                <option value={WORKOUT_TYPES.STRENGTH}>Strength</option>
                <option value={WORKOUT_TYPES.CARDIO}>Cardio</option>
                <option value={WORKOUT_TYPES.FLEXIBILITY}>Flexibility</option>
                <option value={WORKOUT_TYPES.MIXED}>Mixed</option>
              </select>
            </div>
            <div>
              <label className={modalLabelClass}>Goal</label>
              <select
                value={formData.targetGoal}
                onChange={(e) => setFormData({ ...formData, targetGoal: e.target.value })}
                className={modalFieldClass}
              >
                {FITNESS_GOAL_OPTIONS.map((goal) => (
                  <option key={goal.value} value={goal.value}>
                    {goal.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={modalLabelClass}>Duration (weeks)</label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className={modalFieldClass}
              />
            </div>
            <div>
              <label className={modalLabelClass}>Difficulty</label>
              <select
                value={formData.difficultyLevel}
                onChange={(e) => setFormData({ ...formData, difficultyLevel: e.target.value })}
                className={modalFieldClass}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label className={modalLabelClass}>Start date</label>
              <input
                type="date"
                min={todayDateInputValue()}
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className={modalFieldClass}
              />
            </div>
            <div>
              <label className={modalLabelClass}>Days / week</label>
              <input
                type="number"
                min={WORKOUT_FREQUENCY.MIN_PER_WEEK}
                max={WORKOUT_FREQUENCY.MAX_PER_WEEK}
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                className={modalFieldClass}
                title={`${WORKOUT_FREQUENCY.MIN_PER_WEEK}-${WORKOUT_FREQUENCY.MAX_PER_WEEK} days per week`}
              />
              <p className="mt-1 text-xs text-gray-500">
                Must be {WORKOUT_FREQUENCY.MIN_PER_WEEK}–{WORKOUT_FREQUENCY.MAX_PER_WEEK} days
              </p>
            </div>
          </div>

          <ExerciseListEditor
            exercises={formData.exercises}
            onChange={(exercises) => setFormData({ ...formData, exercises })}
          />
        </form>
      </FormModal>

      <FormModal
        isOpen={!!editingPlan}
        onClose={() => !isUpdatingExercises && setEditingPlan(null)}
        title={editingPlan && editingPlan.exerciseCount > 0 ? 'Edit Exercises' : 'Add Exercises'}
        subtitle={editingPlan ? `"${editingPlan.title}"` : undefined}
        icon={<Dumbbell size={22} strokeWidth={2} />}
        accent="blue"
        size="lg"
        closeOnBackdrop={!isUpdatingExercises}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <ModalSecondaryButton
              onClick={() => setEditingPlan(null)}
              disabled={isUpdatingExercises}
            >
              Cancel
            </ModalSecondaryButton>
            <ModalPrimaryButton
              accent="blue"
              onClick={handleSaveExercises}
              disabled={isUpdatingExercises}
            >
              {isUpdatingExercises ? 'Saving...' : 'Save exercises'}
            </ModalPrimaryButton>
          </div>
        }
      >
        <ExerciseListEditor exercises={editingExercises} onChange={setEditingExercises} />
      </FormModal>

      {plans.length > 0 ? (
        <div className="space-y-6">
          <ClientPlanFilter
            options={clientFilterOptions}
            value={clientFilter}
            onChange={setClientFilter}
            filteredCount={filteredPlans.length}
            totalCount={plans.length}
            planLabel="plan"
            accent="blue"
          />

          {filteredPlans.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              {filteredPlans.map((plan) => (
                <PlanCardShell
                  key={plan.id}
                  accent="blue"
                  icon={Dumbbell}
                  title={plan.title}
                  clientName={plan.clientName}
                  badges={[
                    plan.workoutType?.replace(/_/g, ' ') || 'Workout',
                    plan.difficultyLevel || 'beginner',
                  ].map((b) => b.charAt(0).toUpperCase() + b.slice(1))}
                  description={plan.description}
                  actions={
                    <>
                      <PlanActionButton accent="blue" onClick={() => openEditExercises(plan)}>
                        <Pencil size={14} />
                        {plan.exerciseCount > 0 ? 'Edit exercises' : 'Add exercises'}
                      </PlanActionButton>
                      <PlanActionButton accent="blue" variant="danger" onClick={() => handleDelete(plan.id)}>
                        <Trash2 size={14} />
                        Delete
                      </PlanActionButton>
                    </>
                  }
                  stats={
                    <>
                      <PlanStat accent="blue" label="Exercises" value={plan.exerciseCount} />
                      <PlanStat accent="blue" label="Duration" value={`${plan.duration || '—'}w`} />
                      <PlanStat
                        accent="blue"
                        label="Frequency"
                        value={`${plan.frequency || '—'}/wk`}
                      />
                    </>
                  }
                  footer={
                    <PlanItemList
                      accent="blue"
                      title="Exercise list"
                      emptyMessage='No exercises yet. Click "Add exercises" to build this plan.'
                      items={(plan.exercises || []).map((ex: any, idx: number) => (
                        <PlanItemRow key={idx} accent="blue">
                          <span className="font-medium text-slate-900">
                            {ex.exerciseName || ex.name}
                          </span>
                          <span className="text-slate-500">
                            {' '}
                            · {ex.sets || 3} sets × {ex.reps || 10} reps
                          </span>
                        </PlanItemRow>
                      ))}
                    />
                  }
                />
              ))}
            </div>
          ) : (
            <PlansFilterEmptyState accent="blue" onClear={() => setClientFilter('')} />
          )}
        </div>
      ) : (
        <PlansEmptyState
          accent="blue"
          icon={Dumbbell}
          title="No workout plans yet"
          description="Start by creating a tailored program with exercises for one of your clients."
          actionLabel="Create your first plan"
          onAction={openCreateModal}
        />
      )}
    </PlansPageShell>
  );
}
