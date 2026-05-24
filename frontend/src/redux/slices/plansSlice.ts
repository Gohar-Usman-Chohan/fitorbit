import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Exercise {
  exerciseName: string;
  description?: string;
  sets?: number;
  reps?: number;
  weight?: string;
  duration?: string;
  restPeriod?: string;
  videoUrl?: string;
  instructions?: string[];
}

export interface WorkoutPlan {
  id: string;
  trainerId: string;
  clientId: string;
  title: string;
  description?: string;
  workoutType: string;
  duration: number;
  durationUnit: string;
  difficultyLevel: string;
  targetGoals?: string[];
  frequency: number;
  frequencyUnit: string;
  exercises?: Exercise[];
  warmupRoutine?: string;
  cooldownRoutine?: string;
  equipmentNeeded?: string[];
  status: 'active' | 'completed' | 'archived' | 'paused';
  startDate: string;
  endDate?: string;
  modifications?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Meal {
  id: string;
  name: string;
  description?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  ingredients?: string[];
  prepTime?: number;
  difficulty?: string;
  dietaryTags?: string[];
  allergens?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DietPlan {
  id: string;
  nutritionistId: string;
  clientId: string;
  title: string;
  description?: string;
  dailyMealPlans?: {
    day: string;
    meals: Meal[];
  }[];
  calorieTarget?: number;
  macroRatios?: {
    protein: number;
    carbs: number;
    fats: number;
  };
  dietaryRestrictions?: string[];
  status: 'active' | 'completed' | 'archived' | 'paused';
  startDate: string;
  endDate?: string;
  modifications?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlansState {
  workoutPlans: WorkoutPlan[];
  dietPlans: DietPlan[];
  selectedWorkoutPlan: WorkoutPlan | null;
  selectedDietPlan: DietPlan | null;
  loading: boolean;
  error: string | null;
}

const initialState: PlansState = {
  workoutPlans: [],
  dietPlans: [],
  selectedWorkoutPlan: null,
  selectedDietPlan: null,
  loading: false,
  error: null,
};

const plansSlice = createSlice({
  name: 'plans',
  initialState,
  reducers: {
    // Fetch workout plans
    fetchWorkoutPlansRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchWorkoutPlansSuccess: (state, action: PayloadAction<WorkoutPlan[]>) => {
      state.workoutPlans = action.payload;
      state.loading = false;
      state.error = null;
    },
    fetchWorkoutPlansFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Fetch diet plans
    fetchDietPlansRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchDietPlansSuccess: (state, action: PayloadAction<DietPlan[]>) => {
      state.dietPlans = action.payload;
      state.loading = false;
      state.error = null;
    },
    fetchDietPlansFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Create workout plan
    createWorkoutPlanRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    createWorkoutPlanSuccess: (state, action: PayloadAction<WorkoutPlan>) => {
      state.workoutPlans.push(action.payload);
      state.loading = false;
      state.error = null;
    },
    createWorkoutPlanFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Create diet plan
    createDietPlanRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    createDietPlanSuccess: (state, action: PayloadAction<DietPlan>) => {
      state.dietPlans.push(action.payload);
      state.loading = false;
      state.error = null;
    },
    createDietPlanFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Select workout plan
    selectWorkoutPlan: (state, action: PayloadAction<WorkoutPlan | null>) => {
      state.selectedWorkoutPlan = action.payload;
    },

    // Select diet plan
    selectDietPlan: (state, action: PayloadAction<DietPlan | null>) => {
      state.selectedDietPlan = action.payload;
    },

    // Clear plans on logout
    clearPlans: (state) => {
      state.workoutPlans = [];
      state.dietPlans = [];
      state.selectedWorkoutPlan = null;
      state.selectedDietPlan = null;
      state.loading = false;
      state.error = null;
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  fetchWorkoutPlansRequest,
  fetchWorkoutPlansSuccess,
  fetchWorkoutPlansFailure,
  fetchDietPlansRequest,
  fetchDietPlansSuccess,
  fetchDietPlansFailure,
  createWorkoutPlanRequest,
  createWorkoutPlanSuccess,
  createWorkoutPlanFailure,
  createDietPlanRequest,
  createDietPlanSuccess,
  createDietPlanFailure,
  selectWorkoutPlan,
  selectDietPlan,
  clearPlans,
  clearError,
} = plansSlice.actions;

export default plansSlice.reducer;
