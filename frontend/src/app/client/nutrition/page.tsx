'use client';

import { useEffect, useMemo, useState } from 'react';
import { UtensilsCrossed } from 'lucide-react';
import { dietAPI } from '@/lib/api';
import { mapClientDietPlan, normalizeProgressStats } from '@/lib/apiHelpers';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { DietLogForm } from '@/components/forms/DietLogForm';
import { FormModal } from '@/components/ui/FormModal';
import { MEAL_TYPE_OPTIONS } from '@/config/constants';
import {
  PlanCardShell,
  PlanItemList,
  PlanItemRow,
  PlansEmptyState,
  PlansPageShell,
  PlanStat,
} from '@/components/features/plans/ExpertPlansUI';
import { PlanStatusBadge } from '@/components/features/plans/ClientPlansUI';
import { toast } from 'sonner';

function formatMealTypeLabel(mealType?: string) {
  const match = MEAL_TYPE_OPTIONS.find((option) => option.value === mealType);
  return match?.label || mealType || 'Meal';
}

export default function NutritionContent() {
  const [plans, setPlans] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLogModal, setShowLogModal] = useState(false);

  const fetchDietData = async () => {
    try {
      setIsLoading(true);
      const [plansRes, statsRes] = await Promise.all([
        dietAPI.getDietPlans(),
        dietAPI.getDietStatistics(),
      ]);

      setPlans((plansRes.data.data?.dietPlans || []).map(mapClientDietPlan));
      if (statsRes?.data?.data) {
        setStatistics(normalizeProgressStats(statsRes.data.data));
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load nutrition data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDietData();
  }, []);

  const summaryStats = useMemo(() => {
    const activePlans = plans.filter((plan) => plan.status === 'active').length;
    const totalMeals = plans.reduce((sum, plan) => sum + (plan.mealCount || 0), 0);
    return [
      { label: 'Active Diet Plans', value: activePlans },
      { label: 'Total Meals', value: totalMeals, subtitle: 'In your assigned plans' },
      {
        label: 'Nutrition Logs',
        value: statistics?.nutritionCount || 0,
        subtitle: 'Meals you have logged',
      },
    ];
  }, [plans, statistics]);

  if (isLoading) return <LoadingSpinner />;

  return (
    <PlansPageShell
      title="Nutrition & Diet Plans"
      description="View meal plans from your nutritionist and track what you eat each day."
      accent="green"
      createLabel="Log Meal"
      onCreate={() => setShowLogModal(true)}
      stats={summaryStats}
    >
      <FormModal
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
        title="Log a Meal"
        subtitle="Record what you ate to help your nutritionist track your progress"
        icon={<UtensilsCrossed size={22} strokeWidth={2} />}
        accent="green"
        size="md"
      >
        <DietLogForm
          onSuccess={() => {
            setShowLogModal(false);
            fetchDietData();
          }}
        />
      </FormModal>

      {plans.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {plans.map((plan) => (
            <PlanCardShell
              key={plan.id}
              accent="green"
              icon={UtensilsCrossed}
              title={plan.title || plan.name}
              clientName={plan.expertName}
              metaPrefix="By"
              badges={[
                (plan.dietType || 'diet').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
                plan.calorieTarget ? `${plan.calorieTarget} kcal` : 'Custom plan',
              ]}
              description={plan.description}
              actions={<PlanStatusBadge status={plan.status} />}
              stats={
                <>
                  <PlanStat accent="green" label="Meals" value={plan.mealCount || 0} />
                  <PlanStat accent="green" label="Duration" value={`${plan.duration || '—'}w`} />
                  <PlanStat accent="green" label="Per Day" value={plan.mealsPerDay || '—'} />
                </>
              }
              footer={
                <div className="space-y-4">
                  <PlanItemList
                    accent="green"
                    title="Your meal plan"
                    emptyMessage="Your nutritionist has not added meals to this plan yet."
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
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                        P {plan.macronutrients.protein}%
                      </span>
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                        C {plan.macronutrients.carbs}%
                      </span>
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                        F {plan.macronutrients.fats}%
                      </span>
                    </div>
                  ) : null}
                </div>
              }
            />
          ))}
        </div>
      ) : (
        <PlansEmptyState
          accent="green"
          icon={UtensilsCrossed}
          title="No diet plans yet"
          description="Book a nutritionist or wait for them to assign a personalized meal plan to you."
          actionLabel="Log a meal"
          onAction={() => setShowLogModal(true)}
        />
      )}
    </PlansPageShell>
  );
}
