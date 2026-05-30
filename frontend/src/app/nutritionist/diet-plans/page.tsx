'use client';

import { useEffect, useMemo, useState } from 'react';
import { Flame, Pencil, Plus, Trash2, UtensilsCrossed } from 'lucide-react';
import { nutritionistAPI } from '@/lib/api';
import { mapDietPlan } from '@/lib/apiHelpers';
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
import { DIET_TYPE_OPTIONS, DIET_TYPES, MEAL_TYPE_OPTIONS, MEAL_TYPES } from '@/config/constants';
import { validateDietPlanCreate, validateMeals } from '@/lib/validation';
import { todayDateInputValue } from '@/lib/dateFormat';

type MealRow = {
  mealName: string;
  mealType: string;
  calories: number | '';
  portions: string;
};

const emptyMeal = (): MealRow => ({
  mealName: '',
  mealType: MEAL_TYPES.BREAKFAST,
  calories: '',
  portions: '',
});

const createEmptyForm = () => ({
  clientId: '',
  title: '',
  description: '',
  dietType: DIET_TYPES.WEIGHT_LOSS,
  duration: '12',
  calorieTarget: '2000',
  mealsPerDay: '3',
  startDate: todayDateInputValue(),
  protein: '30',
  carbs: '40',
  fats: '30',
  meals: [emptyMeal()],
});

function normalizeMeals(meals: MealRow[]) {
  return meals
    .filter((meal) => meal.mealName.trim())
    .map((meal) => ({
      mealName: meal.mealName.trim(),
      mealType: meal.mealType || MEAL_TYPES.BREAKFAST,
      ...(meal.calories !== '' ? { calories: Number(meal.calories) } : {}),
      ...(meal.portions.trim() ? { portions: meal.portions.trim() } : {}),
    }));
}

function formatMealTypeLabel(mealType?: string) {
  const match = MEAL_TYPE_OPTIONS.find((option) => option.value === mealType);
  return match?.label || mealType || 'Meal';
}

function MealListEditor({
  meals,
  onChange,
}: {
  meals: MealRow[];
  onChange: (meals: MealRow[]) => void;
}) {
  const updateRow = (index: number, field: keyof MealRow, value: string | number) => {
    onChange(
      meals.map((row, i) =>
        i === index
          ? {
              ...row,
              [field]: field === 'calories' ? (value === '' ? '' : Number(value) || '') : value,
            }
          : row
      )
    );
  };

  const addRow = () => onChange([...meals, emptyMeal()]);

  const removeRow = (index: number) => {
    if (meals.length <= 1) {
      onChange([emptyMeal()]);
      return;
    }
    onChange(meals.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-800">Meals</p>
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-emerald-600 transition hover:bg-emerald-50 hover:text-emerald-700"
        >
          <Plus size={16} />
          Add meal
        </button>
      </div>
      <div className="space-y-2.5">
        {meals.map((meal, index) => (
          <div
            key={index}
            className="rounded-xl border border-gray-200/90 bg-white p-3 shadow-sm ring-1 ring-gray-100/80"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Meal {index + 1}
              </span>
              <button
                type="button"
                onClick={() => removeRow(index)}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
                aria-label="Remove meal"
              >
                <Trash2 size={14} />
                Remove
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_130px_100px_1fr]">
              <div className="sm:col-span-2 lg:col-span-1">
                <label className={modalLabelClass}>Name</label>
                <input
                  type="text"
                  placeholder="e.g. Grilled chicken salad"
                  value={meal.mealName}
                  onChange={(e) => updateRow(index, 'mealName', e.target.value)}
                  className={modalFieldClass}
                />
              </div>
              <div>
                <label className={modalLabelClass}>Type</label>
                <select
                  value={meal.mealType}
                  onChange={(e) => updateRow(index, 'mealType', e.target.value)}
                  className={modalFieldClass}
                >
                  {MEAL_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={modalLabelClass}>Calories</label>
                <input
                  type="number"
                  min={0}
                  placeholder="Optional"
                  value={meal.calories}
                  onChange={(e) => updateRow(index, 'calories', e.target.value)}
                  className={modalFieldClass}
                />
              </div>
              <div>
                <label className={modalLabelClass}>Portion</label>
                <input
                  type="text"
                  placeholder="e.g. 1 bowl"
                  value={meal.portions}
                  onChange={(e) => updateRow(index, 'portions', e.target.value)}
                  className={modalFieldClass}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500">Each meal needs a name. Calories and portions are optional.</p>
    </div>
  );
}

export default function DietPlans() {
  const confirm = useConfirm();
  const [plans, setPlans] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState(createEmptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [editingPlan, setEditingPlan] = useState<{ id: string; title: string; mealCount: number } | null>(null);
  const [editingMeals, setEditingMeals] = useState<MealRow[]>([]);
  const [isUpdatingMeals, setIsUpdatingMeals] = useState(false);
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
    const totalMeals = plans.reduce((sum, plan) => sum + (plan.mealCount || 0), 0);
    return [
      { label: 'Total Plans', value: plans.length },
      { label: 'Clients Assigned', value: clientIds.size },
      { label: 'Total Meals', value: totalMeals, subtitle: 'Across all plans' },
    ];
  }, [plans]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [plansRes, clientsRes] = await Promise.all([
        nutritionistAPI.getMealPlans(),
        nutritionistAPI.getClients({ scope: 'assignable', limit: 100 }),
      ]);
      const payload = plansRes.data?.data ?? plansRes.data;
      setPlans((payload?.plans || payload?.workouts || []).map(mapDietPlan));
      setClients(clientsRes.data?.data?.clients || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load diet plans');
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

    const validationError = validateDietPlanCreate({
      clientId: formData.clientId,
      title: formData.title,
      description: formData.description,
      duration: formData.duration,
      calorieTarget: formData.calorieTarget,
      mealsPerDay: formData.mealsPerDay,
      protein: formData.protein,
      carbs: formData.carbs,
      fats: formData.fats,
      startDate: formData.startDate,
      meals: formData.meals,
    });
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const meals = normalizeMeals(formData.meals);

    try {
      setIsSaving(true);
      await nutritionistAPI.createMealPlan({
        clientId: formData.clientId,
        title: formData.title,
        description: formData.description,
        dietType: formData.dietType,
        duration: Number(formData.duration),
        calorieTarget: Number(formData.calorieTarget),
        mealsPerDay: Number(formData.mealsPerDay),
        startDate: formData.startDate,
        macronutrients: {
          protein: Number(formData.protein),
          carbs: Number(formData.carbs),
          fats: Number(formData.fats),
        },
        meals,
      });
      toast.success('Diet plan created');
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
      title: 'Delete diet plan?',
      message: 'This diet plan will be permanently removed for the client.',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      await nutritionistAPI.deleteMealPlan(planId);
      toast.success('Plan deleted');
      setPlans(plans.filter((p) => p.id !== planId));
      if (editingPlan?.id === planId) {
        setEditingPlan(null);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete plan');
    }
  };

  const openEditMeals = (plan: any) => {
    setEditingPlan({ id: plan.id, title: plan.title, mealCount: plan.mealCount || 0 });
    const rows =
      plan.meals?.length > 0
        ? plan.meals.map((meal: any) => ({
            mealName: meal.mealName || meal.name || '',
            mealType: meal.mealType || MEAL_TYPES.BREAKFAST,
            calories: meal.calories ?? '',
            portions: meal.portions || '',
          }))
        : [emptyMeal()];
    setEditingMeals(rows);
  };

  const handleSaveMeals = async () => {
    if (!editingPlan) return;

    const validationError = validateMeals(editingMeals);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const meals = normalizeMeals(editingMeals);

    try {
      setIsUpdatingMeals(true);
      await nutritionistAPI.updateMealPlan(editingPlan.id, { meals });
      toast.success('Meals updated');
      setEditingPlan(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update meals');
    } finally {
      setIsUpdatingMeals(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <PlansPageShell
      title="Diet Plans"
      description="Design nutrition programs with meals, macros, and calorie targets for your clients."
      accent="green"
      createLabel="Create New Plan"
      onCreate={openCreateModal}
      stats={summaryStats}
    >
      <FormModal
        isOpen={showCreateModal}
        onClose={closeCreateModal}
        title="Create Diet Plan"
        subtitle="Build a nutrition plan with meals for your client"
        icon={<UtensilsCrossed size={22} strokeWidth={2} />}
        accent="green"
        size="xl"
        closeOnBackdrop={!isSaving}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <ModalSecondaryButton onClick={closeCreateModal} disabled={isSaving}>
              Cancel
            </ModalSecondaryButton>
            <ModalPrimaryButton
              accent="green"
              type="submit"
              form="create-diet-form"
              disabled={isSaving}
            >
              {isSaving ? 'Creating...' : 'Create Plan'}
            </ModalPrimaryButton>
          </div>
        }
      >
        <form id="create-diet-form" onSubmit={handleCreate} className="space-y-5">
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
                  <option key={c.id} value={c.id}>
                    {c.name}
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
                placeholder="e.g. 12-week weight loss plan"
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
              placeholder="Optional guidance for the client"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <label className={modalLabelClass}>Diet type</label>
              <select
                value={formData.dietType}
                onChange={(e) => setFormData({ ...formData, dietType: e.target.value })}
                className={modalFieldClass}
              >
                {DIET_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
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
              <label className={modalLabelClass}>Daily calories</label>
              <input
                type="number"
                value={formData.calorieTarget}
                onChange={(e) => setFormData({ ...formData, calorieTarget: e.target.value })}
                className={modalFieldClass}
              />
            </div>
            <div>
              <label className={modalLabelClass}>Meals / day</label>
              <input
                type="number"
                value={formData.mealsPerDay}
                onChange={(e) => setFormData({ ...formData, mealsPerDay: e.target.value })}
                className={modalFieldClass}
              />
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
              <label className={modalLabelClass}>Protein %</label>
              <input
                type="number"
                value={formData.protein}
                onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
                className={modalFieldClass}
              />
            </div>
            <div>
              <label className={modalLabelClass}>Carbs %</label>
              <input
                type="number"
                value={formData.carbs}
                onChange={(e) => setFormData({ ...formData, carbs: e.target.value })}
                className={modalFieldClass}
              />
            </div>
            <div>
              <label className={modalLabelClass}>Fats %</label>
              <input
                type="number"
                value={formData.fats}
                onChange={(e) => setFormData({ ...formData, fats: e.target.value })}
                className={modalFieldClass}
              />
            </div>
          </div>

          <MealListEditor
            meals={formData.meals}
            onChange={(meals) => setFormData({ ...formData, meals })}
          />
        </form>
      </FormModal>

      <FormModal
        isOpen={!!editingPlan}
        onClose={() => !isUpdatingMeals && setEditingPlan(null)}
        title={editingPlan && editingPlan.mealCount > 0 ? 'Edit Meals' : 'Add Meals'}
        subtitle={editingPlan ? `"${editingPlan.title}"` : undefined}
        icon={<UtensilsCrossed size={22} strokeWidth={2} />}
        accent="green"
        size="xl"
        closeOnBackdrop={!isUpdatingMeals}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <ModalSecondaryButton onClick={() => setEditingPlan(null)} disabled={isUpdatingMeals}>
              Cancel
            </ModalSecondaryButton>
            <ModalPrimaryButton accent="green" onClick={handleSaveMeals} disabled={isUpdatingMeals}>
              {isUpdatingMeals ? 'Saving...' : 'Save meals'}
            </ModalPrimaryButton>
          </div>
        }
      >
        <MealListEditor meals={editingMeals} onChange={setEditingMeals} />
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
            accent="green"
          />

          {filteredPlans.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              {filteredPlans.map((plan) => (
                <PlanCardShell
                  key={plan.id}
                  accent="green"
                  icon={UtensilsCrossed}
                  title={plan.title}
                  clientName={plan.clientName}
                  badges={[
                    (plan.dietType || 'diet').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
                    plan.calorieTarget ? `${plan.calorieTarget} kcal` : 'Custom',
                  ]}
                  description={plan.description}
                  actions={
                    <>
                      <PlanActionButton accent="green" onClick={() => openEditMeals(plan)}>
                        <Pencil size={14} />
                        {plan.mealCount > 0 ? 'Edit meals' : 'Add meals'}
                      </PlanActionButton>
                      <PlanActionButton accent="green" variant="danger" onClick={() => handleDelete(plan.id)}>
                        <Trash2 size={14} />
                        Delete
                      </PlanActionButton>
                    </>
                  }
                  stats={
                    <>
                      <PlanStat accent="green" label="Meals" value={plan.mealCount} />
                      <PlanStat accent="green" label="Calories" value={plan.calorieTarget || '—'} />
                      <PlanStat accent="green" label="Duration" value={`${plan.duration || '—'}w`} />
                    </>
                  }
                  footer={
                    <div className="space-y-4">
                      <PlanItemList
                        accent="green"
                        title="Meal list"
                        emptyMessage='No meals yet. Click "Add meals" to build this plan.'
                        items={(plan.meals || []).map((meal: any, idx: number) => (
                          <PlanItemRow key={idx} accent="green">
                            <span className="font-medium text-slate-900">
                              {formatMealTypeLabel(meal.mealType)}:
                            </span>{' '}
                            <span>{meal.mealName}</span>
                            {meal.calories ? (
                              <span className="text-slate-500"> · {meal.calories} cal</span>
                            ) : null}
                            {meal.portions ? (
                              <span className="text-slate-500"> ({meal.portions})</span>
                            ) : null}
                          </PlanItemRow>
                        ))}
                      />
                      {plan.macronutrients ? (
                        <div className="flex flex-wrap gap-2 border-t border-slate-200/80 pt-3">
                          <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                            <Flame size={12} className="text-orange-500" />
                            P {plan.macronutrients.protein}%
                          </span>
                          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                            C {plan.macronutrients.carbs}%
                          </span>
                          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                            F {plan.macronutrients.fats}%
                          </span>
                          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                            {plan.mealsPerDay || '—'} meals/day
                          </span>
                        </div>
                      ) : null}
                    </div>
                  }
                />
              ))}
            </div>
          ) : (
            <PlansFilterEmptyState accent="green" onClear={() => setClientFilter('')} />
          )}
        </div>
      ) : (
        <PlansEmptyState
          accent="green"
          icon={UtensilsCrossed}
          title="No diet plans yet"
          description="Create your first nutrition plan with meals and macro targets for a client."
          actionLabel="Create your first plan"
          onAction={openCreateModal}
        />
      )}
    </PlansPageShell>
  );
}
