import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'client' | 'trainer' | 'nutritionist' | 'admin';
  phoneNumber?: string;
  avatar?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientProfileData extends UserProfile {
  fitnessGoals?: string[];
  currentWeight?: number;
  currentHeight?: number;
  age?: number;
  experienceLevel?: string;
  assignedTrainerId?: string;
  assignedNutritionistId?: string;
  bodyMeasurements?: {
    chest?: number;
    waist?: number;
    hips?: number;
    arms?: number;
    thighs?: number;
  };
  healthConditions?: string[];
}

export interface TrainerProfileData extends UserProfile {
  certifications?: string[];
  specializations?: string[];
  yearsOfExperience?: number;
  averageRating?: number;
  totalRatings?: number;
  hourlyRate?: number;
}

export interface NutritionistProfileData extends UserProfile {
  certifications?: string[];
  specializations?: string[];
  yearsOfExperience?: number;
  averageRating?: number;
  totalRatings?: number;
  hourlyRate?: number;
}

export interface UserState {
  profile: UserProfile | ClientProfileData | TrainerProfileData | NutritionistProfileData | null;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  profile: null,
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // Fetch profile
    fetchProfileRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchProfileSuccess: (
      state,
      action: PayloadAction<
        UserProfile | ClientProfileData | TrainerProfileData | NutritionistProfileData
      >
    ) => {
      state.profile = action.payload;
      state.loading = false;
      state.error = null;
    },
    fetchProfileFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Update profile
    updateProfileRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    updateProfileSuccess: (
      state,
      action: PayloadAction<
        UserProfile | ClientProfileData | TrainerProfileData | NutritionistProfileData
      >
    ) => {
      state.profile = action.payload;
      state.loading = false;
      state.error = null;
    },
    updateProfileFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Clear profile on logout
    clearProfile: (state) => {
      state.profile = null;
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
  fetchProfileRequest,
  fetchProfileSuccess,
  fetchProfileFailure,
  updateProfileRequest,
  updateProfileSuccess,
  updateProfileFailure,
  clearProfile,
  clearError,
} = userSlice.actions;

export default userSlice.reducer;
