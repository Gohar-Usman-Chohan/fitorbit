'use client';

import { useState, useEffect } from 'react';
import { clientAPI } from '@/lib/api';
import { FitnessGoalForm } from '@/components/forms/FitnessGoalForm';
import { formatFitnessGoalLabel } from '@/config/constants';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { toast } from 'sonner';

function FitnessGoalsContent() {
  const confirm = useConfirm();
  const [goals, setGoals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      setIsLoading(true);
      const response = await clientAPI.getFitnessGoals();
      setGoals(response.data.data?.goals || []);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to load fitness goals';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    const confirmed = await confirm({
      title: 'Delete fitness goal?',
      message: 'This goal will be permanently removed from your profile.',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      setIsDeleting(goalId);
      await clientAPI.deleteFitnessGoal(goalId);
      toast.success('Goal deleted successfully!');
      setGoals(goals.filter((g) => g.id !== goalId));
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to delete goal';
      toast.error(message);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
        <h1 className="page-title mb-6 sm:mb-8">Fitness Goals</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Add Goal Form */}
          <div>
            <FitnessGoalForm onSuccess={fetchGoals} />
          </div>

          {/* Goals List */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Goals</h3>

            {isLoading ? (
              <LoadingSpinner />
            ) : goals.length > 0 ? (
              <div className="space-y-4">
                {goals.map((goal) => {
                  const progress =
                    goal.currentWeight && goal.targetWeight
                      ? Math.min(
                          100,
                          Math.max(
                            0,
                            ((goal.currentWeight - goal.targetWeight) /
                              (goal.startingWeight - goal.targetWeight)) *
                              100
                          )
                        )
                      : 0;

                  return (
                    <div key={goal.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {goal.label ||
                              (goal.goals || [goal.goal])
                                .map((item: string) => formatFitnessGoalLabel(item))
                                .join(', ') ||
                              'Fitness Goal'}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Current: {goal.currentWeight}kg → Target: {goal.targetWeight}kg
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Timeline: {goal.timeline} months
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteGoal(goal.id)}
                          disabled={isDeleting === goal.id}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          {isDeleting === goal.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-gray-600">Progress</span>
                          <span className="text-xs font-medium text-gray-900">{Math.round(progress)}%</span>
                        </div>
                        <div className="bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No goals set yet</p>
                <p className="text-sm text-gray-400">Add a fitness goal to get started!</p>
              </div>
            )}
          </div>
        </div>
    </div>
  );
}

export default FitnessGoalsContent;
