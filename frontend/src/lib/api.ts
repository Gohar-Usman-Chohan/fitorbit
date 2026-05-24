import axios from 'axios';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import { forceLogout, isAccountInactiveError } from '@/lib/forceLogout';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_BACKEND_API_URL ||
  'http://localhost:5000/api';

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true, // Send cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const message = error.response?.data?.message;
    const code = error.response?.data?.code;

    if (isAccountInactiveError(status, message, code)) {
      if (code === 'email_not_verified') {
        forceLogout('Please verify your email before signing in.');
      } else {
        forceLogout(message || 'account_inactive');
      }
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = Cookies.get('refreshToken');
        if (!refreshToken) {
          // Clear tokens and redirect to login
          Cookies.remove('token');
          Cookies.remove('refreshToken');
          window.location.href = '/login';
          return Promise.reject(error);
        }

        const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
          refreshToken,
        }, {
          withCredentials: true
        });

        const { token, refreshToken: newRefreshToken } = response.data.data;
        
        // Update cookies with new tokens
        Cookies.set('token', token, { 
          expires: 7,
          path: '/',
          sameSite: 'Lax'
        });
        Cookies.set('refreshToken', newRefreshToken, { 
          expires: 30,
          path: '/',
          sameSite: 'Lax'
        });

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return axiosInstance(originalRequest);
      } catch (err) {
        Cookies.remove('token');
        Cookies.remove('refreshToken');
        window.location.href = '/login';
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

/** Normalize profile payloads from GET/PUT /users/profile */
export function parseUserProfileResponse(response: { data?: unknown }) {
  const body = (response?.data ?? response) as Record<string, unknown>;
  const payload = (body?.data ?? body) as Record<string, unknown>;

  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const nestedUser = payload.user;
  if (nestedUser && typeof nestedUser === 'object') {
    return { ...(nestedUser as Record<string, unknown>) };
  }

  if (payload.email || payload.firstName || payload.id) {
    const { clientProfile, user, ...profileFields } = payload;
    return profileFields;
  }

  return null;
}

// ============================================
// AUTH APIs
// ============================================

export const authAPI = {
  register: (data: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    role: 'client' | 'trainer' | 'nutritionist';
  }) => {
    // Split name into firstName and lastName
    const nameParts = data.name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || firstName;

    return axiosInstance.post('/auth/register', {
      firstName,
      lastName,
      email: data.email,
      password: data.password,
      role: data.role,
    });
  },

  login: (data: { email: string; password: string }) =>
    axiosInstance.post('/auth/login', data),

  logout: () => axiosInstance.post('/auth/logout'),

  refreshToken: (refreshToken: string) =>
    axiosInstance.post('/auth/refresh-token', { refreshToken }),

  forgotPassword: (email: string) =>
    axiosInstance.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, newPassword: string) =>
    axiosInstance.post(`/auth/reset-password/${token}`, {
      password: newPassword,
      confirmPassword: newPassword,
    }),

  verifyEmail: (token: string) =>
    axiosInstance.get(`/auth/verify-email/${token}`),

  resendVerification: (email: string) =>
    axiosInstance.post('/auth/resend-verification', { email }),

  getPlatformStats: () =>
    axiosInstance.get('/auth/stats'),
};

// ============================================
// USER APIs
// ============================================

export const userAPI = {
  // Get current user profile
  getCurrentProfile: () => axiosInstance.get('/users/profile'),

  // Update user profile
  updateProfile: (data: any) => axiosInstance.put('/users/profile', data),

  // Get user by ID
  getUserById: (userId: string) => axiosInstance.get(`/users/${userId}`),

  // Get user goals
  getUserGoals: () => axiosInstance.get('/users/goals'),

  // Update user goals
  updateUserGoals: (goals: string[]) =>
    axiosInstance.put('/users/goals', { goals }),
};

// ============================================
// CLIENT APIs
// ============================================

export const clientAPI = {
  // Get client dashboard
  getDashboard: () => axiosInstance.get('/clients/dashboard'),

  // Get client profile
  getProfile: () => axiosInstance.get('/users/profile'),
  updateProfile: (data: any) => axiosInstance.put('/users/profile', data),
  getPlans: () => axiosInstance.get('/clients/plans'),

  // Get fitness goals
  getFitnessGoals: () => axiosInstance.get('/clients/fitness-goals'),

  // Create fitness goal
  createFitnessGoal: (data: any) =>
    axiosInstance.post('/clients/fitness-goals', data),

  // Update fitness goal
  updateFitnessGoal: (goalId: string, data: any) =>
    axiosInstance.put(`/clients/fitness-goals/${goalId}`, data),

  // Delete fitness goal
  deleteFitnessGoal: (goalId: string) =>
    axiosInstance.delete(`/clients/fitness-goals/${goalId}`),

  // Get assigned plans
  getAssignedPlans: () => axiosInstance.get('/clients/assigned-plans'),

  // Get progress summary
  getProgressSummary: () => axiosInstance.get('/clients/progress-summary'),

  // Get active plans
  getActivePlans: () => axiosInstance.get('/clients/active-plans'),

  // Get upcoming appointments
  getUpcomingAppointments: () =>
    axiosInstance.get('/appointments', { params: { status: 'scheduled' } }),

  // Get recent progress
  getRecentProgress: () => axiosInstance.get('/clients/recent-progress'),

  // Get available trainers
  getAvailableTrainers: (params?: any) =>
    axiosInstance.get('/clients/available-trainers', { params }),

  // Get available nutritionists
  getAvailableNutritionists: (params?: any) =>
    axiosInstance.get('/clients/available-nutritionists', { params }),

  // Book trainer
  bookTrainer: (trainerId: string, data: any) =>
    axiosInstance.post(`/clients/book-trainer/${trainerId}`, data),

  // Book nutritionist
  bookNutritionist: (nutritionistId: string, data: any) =>
    axiosInstance.post(`/clients/book-nutritionist/${nutritionistId}`, data),

  // Assigned trainer & nutritionist (for chat, dashboard, etc.)
  getAssignedExperts: () => axiosInstance.get('/clients/experts'),
};

// ============================================
// TRAINER APIs
// ============================================

export const trainerAPI = {
  // Get all trainers (public)
  getAll: (params?: any) =>
    axiosInstance.get('/trainers/all', { params }),

  // Get trainer profile
  getProfile: () => axiosInstance.get('/trainers/profile'),

  // Create/update trainer profile
  updateProfile: (data: any) => axiosInstance.put('/trainers/profile', data),

  // Get trainer clients (scope: contact | assignable)
  getClients: (params?: { scope?: 'contact' | 'assignable'; limit?: number; skip?: number }) =>
    axiosInstance.get('/trainers/clients', { params }),

  // Get client details
  getClientDetails: (clientId: string) =>
    axiosInstance.get(`/trainers/clients/${clientId}`),

  // Get trainer dashboard
  getDashboard: () => axiosInstance.get('/trainers/dashboard'),

  // Workout plans
  getWorkouts: (params?: any) => axiosInstance.get('/trainers/workouts', { params }),

  createWorkout: (data: any) => axiosInstance.post('/trainers/workouts', data),

  updateWorkout: (workoutId: string, data: any) =>
    axiosInstance.put(`/trainers/workouts/${workoutId}`, data),

  deleteWorkout: (workoutId: string) =>
    axiosInstance.delete(`/trainers/workouts/${workoutId}`),

  // Get trainer schedule
  getSchedule: (params?: any) =>
    axiosInstance.get('/trainers/schedule', { params }),

  // Update availability
  updateAvailability: (data: any) =>
    axiosInstance.put('/trainers/availability', data),

  // Get trainer availability slots
  getAvailabilitySlots: (params?: any) =>
    axiosInstance.get('/trainers/availability-slots', { params }),

  // Review client progress
  getClientProgress: (clientId: string) =>
    axiosInstance.get(`/trainers/clients/${clientId}/progress`),
};

// ============================================
// NUTRITIONIST APIs
// ============================================

export const nutritionistAPI = {
  // Get all nutritionists (public)
  getAll: (params?: any) =>
    axiosInstance.get('/nutritionists/all', { params }),

  // Get nutritionist profile
  getProfile: () => axiosInstance.get('/nutritionists/profile'),

  // Create/update nutritionist profile
  updateProfile: (data: any) => axiosInstance.put('/nutritionists/profile', data),

  // Get nutritionist clients (scope: contact | assignable)
  getClients: (params?: { scope?: 'contact' | 'assignable'; limit?: number; skip?: number }) =>
    axiosInstance.get('/nutritionists/clients', { params }),

  // Get client details
  getClientDetails: (clientId: string) =>
    axiosInstance.get(`/nutritionists/clients/${clientId}`),

  // Get nutritionist dashboard
  getDashboard: () => axiosInstance.get('/nutritionists/dashboard'),

  // Meal / diet plans
  getMealPlans: (params?: any) =>
    axiosInstance.get('/nutritionists/meal-plans', { params }),

  createMealPlan: (data: any) =>
    axiosInstance.post('/nutritionists/meal-plans', data),

  updateMealPlan: (planId: string, data: any) =>
    axiosInstance.put(`/nutritionists/meal-plans/${planId}`, data),

  deleteMealPlan: (planId: string) =>
    axiosInstance.delete(`/nutritionists/meal-plans/${planId}`),

  // Schedule and availability
  getSchedule: (params?: any) =>
    axiosInstance.get('/nutritionists/schedule', { params }),

  getAvailabilitySlots: (params?: any) =>
    axiosInstance.get('/nutritionists/availability-slots', { params }),

  updateAvailability: (data: any) =>
    axiosInstance.put('/nutritionists/availability', data),

  // Client nutrition data
  getClientAssessment: (clientId: string) =>
    axiosInstance.get(`/nutritionists/clients/${clientId}/assessment`),

  getClientProgress: (clientId: string) =>
    axiosInstance.get(`/nutritionists/clients/${clientId}/progress`),

  getAssessments: (params?: any) =>
    axiosInstance.get('/nutritionists/assessments', { params }),

  // Provide feedback
  provideFeedback: (clientId: string, feedback: string) =>
    axiosInstance.post(`/nutritionists/clients/${clientId}/feedback`, {
      feedback,
      nutritionistFeedback: feedback,
    }),
};

// ============================================
// WORKOUT APIs
// ============================================

export const workoutAPI = {
  getWorkoutPlans: (params?: any) => clientAPI.getPlans(),

  getWorkoutPlan: (planId: string) =>
    axiosInstance.get(`/clients/plans/${planId}`, { params: { planType: 'workout' } }),

  createWorkoutPlan: (data: any) =>
    axiosInstance.post('/trainers/workouts', data),

  updateWorkoutPlan: (planId: string, data: any) =>
    axiosInstance.put(`/trainers/workouts/${planId}`, data),

  deleteWorkoutPlan: (planId: string) =>
    axiosInstance.delete(`/trainers/workouts/${planId}`),

  getExercises: (params?: any) => axiosInstance.get('/workouts', { params }),

  getExercise: (exerciseId: string) => axiosInstance.get(`/workouts/${exerciseId}`),

  createExercise: (data: any) => axiosInstance.post('/workouts', data),

  updateExercise: (exerciseId: string, data: any) =>
    axiosInstance.put(`/workouts/${exerciseId}`, data),

  deleteExercise: (exerciseId: string) =>
    axiosInstance.delete(`/workouts/${exerciseId}`),

  searchExercises: (query: string, params?: any) =>
    axiosInstance.get('/workouts/search', { params: { q: query, query, ...params } }),
};

// ============================================
// DIET APIs
// ============================================

export const dietAPI = {
  getDietPlans: (params?: any) => clientAPI.getPlans(),

  getDietPlan: (planId: string) =>
    axiosInstance.get(`/clients/plans/${planId}`, { params: { planType: 'diet' } }),

  createDietPlan: (data: any) =>
    axiosInstance.post('/nutritionists/meal-plans', data),

  updateDietPlan: (planId: string, data: any) =>
    axiosInstance.put(`/nutritionists/meal-plans/${planId}`, data),

  deleteDietPlan: (planId: string) =>
    axiosInstance.delete(`/nutritionists/meal-plans/${planId}`),

  getMeals: (params?: any) => axiosInstance.get('/diets', { params }),

  getMeal: (mealId: string) => axiosInstance.get(`/diets/${mealId}`),

  createMeal: (data: any) => axiosInstance.post('/diets', data),

  updateMeal: (mealId: string, data: any) =>
    axiosInstance.put(`/diets/${mealId}`, data),

  deleteMeal: (mealId: string) => axiosInstance.delete(`/diets/${mealId}`),

  searchMeals: (query: string, params?: any) =>
    axiosInstance.get('/diets/search', { params: { q: query, query, ...params } }),

  filterMealsByTags: (tags: string[], params?: any) =>
    axiosInstance.get('/diets/search', {
      params: { tags: tags.join(','), dietaryTags: tags.join(','), ...params },
    }),

  getDietStatistics: (params?: any) =>
    axiosInstance.get('/progress/statistics', { params }),
};

// ============================================
// PROGRESS APIs
// ============================================

export const progressAPI = {
  getProgressLogs: (params?: any) => axiosInstance.get('/progress', { params }),

  getProgressLog: (logId: string) => axiosInstance.get(`/progress/${logId}`),

  createProgressLog: (data: any) =>
    axiosInstance.post('/progress', {
      logType: data.logType || data.type,
      ...data,
    }),

  updateProgressLog: (logId: string, data: any) =>
    axiosInstance.put(`/progress/${logId}`, {
      logType: data.logType || data.type,
      ...data,
    }),

  deleteProgressLog: (logId: string) => axiosInstance.delete(`/progress/${logId}`),

  getProgressStatistics: (params?: any) =>
    axiosInstance.get('/progress/statistics', { params }),

  getProgressByDateRange: (startDate: string, endDate: string, params?: any) =>
    axiosInstance.get('/progress', {
      params: { startDate, endDate, ...params },
    }),
};

// ============================================
// APPOINTMENT APIs
// ============================================

export const appointmentAPI = {
  // Get appointments
  getAppointments: (params?: any) =>
    axiosInstance.get('/appointments', { params }),

  // Get appointment by ID
  getAppointment: (appointmentId: string) =>
    axiosInstance.get(`/appointments/${appointmentId}`),

  // Create appointment
  createAppointment: (data: any) =>
    axiosInstance.post('/appointments', data),

  // Update appointment
  updateAppointment: (appointmentId: string, data: any) =>
    axiosInstance.put(`/appointments/${appointmentId}`, data),

  // Cancel appointment
  cancelAppointment: (appointmentId: string, reason?: string) =>
    axiosInstance.post(`/appointments/${appointmentId}/cancel`, {
      reason,
      cancellationReason: reason,
    }),

  // Reschedule appointment
  rescheduleAppointment: (appointmentId: string, newDate: string) =>
    axiosInstance.post(`/appointments/${appointmentId}/reschedule`, {
      newDate,
    }),

  // Complete appointment
  completeAppointment: (appointmentId: string, notes?: string) =>
    axiosInstance.post(`/appointments/${appointmentId}/complete`, {
      notes,
      expertNotes: notes,
    }),

  approveAppointment: (appointmentId: string) =>
    axiosInstance.post(`/appointments/${appointmentId}/approve`),

  rejectAppointment: (appointmentId: string, reason?: string) =>
    axiosInstance.post(`/appointments/${appointmentId}/reject`, { reason }),

  createCheckoutSession: (appointmentId: string) =>
    axiosInstance.post('/payments/create-checkout-session', { appointmentId }),

  confirmPayment: (appointmentId: string, sessionId?: string) =>
    axiosInstance.post('/payments/confirm', { appointmentId, sessionId }),

  // Mark no-show
  markNoShow: (appointmentId: string, reason?: string) =>
    axiosInstance.post(`/appointments/${appointmentId}/no-show`, { reason }),

  // Client rates completed appointment
  rateAppointment: (appointmentId: string, data: { rating: number; feedback?: string }) =>
    axiosInstance.post(`/appointments/${appointmentId}/rate`, {
      rating: data.rating,
      feedback: data.feedback,
      clientFeedback: data.feedback,
    }),

  // Get available slots
  getAvailableSlots: (expertId: string, params?: any) =>
    axiosInstance.get(`/appointments/available-slots/${expertId}`, { params }),

  // Get appointment history
  getAppointmentHistory: (params?: any) =>
    axiosInstance.get('/appointments/history', { params }),
};

// ============================================
// CHAT APIs
// ============================================

export const chatAPI = {
  getConversations: (params?: any) =>
    axiosInstance.get('/chat/conversations', { params }),

  getUnreadCount: () => axiosInstance.get('/chat/unread-count'),

  getMessages: (conversationId: string, params?: any) =>
    axiosInstance.get(`/chat/messages/${conversationId}`, { params }),

  sendMessage: (
    conversationId: string | undefined,
    contentOrPayload: string | { content: string; receiverId?: string; conversationId?: string },
    receiverId?: string
  ) => {
    const resolvedConversationId =
      typeof contentOrPayload === 'string'
        ? conversationId
        : contentOrPayload.conversationId ?? conversationId;

    const payload: Record<string, string> =
      typeof contentOrPayload === 'string'
        ? {
            messageContent: contentOrPayload,
            receiverId: receiverId || '',
          }
        : {
            messageContent: contentOrPayload.content,
            receiverId: contentOrPayload.receiverId || receiverId || '',
          };

    if (resolvedConversationId && resolvedConversationId !== 'new') {
      payload.conversationId = resolvedConversationId;
    }

    return axiosInstance.post('/chat/messages', payload);
  },

  editMessage: (_conversationId: string, messageId: string, content: string) =>
    axiosInstance.put(`/chat/messages/${messageId}`, { messageContent: content }),

  deleteMessage: (_conversationId: string, messageId: string) =>
    axiosInstance.delete(`/chat/messages/${messageId}`),

  markAsRead: (_conversationId: string, messageId: string) =>
    axiosInstance.put(`/chat/messages/${messageId}/read`),

  markAllAsRead: (conversationId: string) =>
    axiosInstance.put(`/chat/conversations/${conversationId}/read`, { conversationId }),

  getConversation: (conversationId: string) =>
    axiosInstance.get(`/chat/messages/${conversationId}`),

  createConversation: (participantIds: string[]) =>
    axiosInstance.post('/chat/messages', { participantIds }),

  addReaction: (_conversationId: string, messageId: string, emoji: string) =>
    axiosInstance.post(`/chat/messages/${messageId}/react`, { reaction: emoji }),
};

// ============================================
// NOTIFICATION APIs
// ============================================

export const notificationAPI = {
  // Get notifications
  getNotifications: (params?: any) =>
    axiosInstance.get('/notifications', { params }),

  // Mark notification as read
  markNotificationAsRead: (notificationId: string) =>
    axiosInstance.put(`/notifications/${notificationId}/read`),

  markAsRead: (notificationId: string) =>
    axiosInstance.put(`/notifications/${notificationId}/read`),

  // Mark all as read
  markAllNotificationsAsRead: () =>
    axiosInstance.post('/notifications/mark-all-read'),

  // Delete notification
  deleteNotification: (notificationId: string) =>
    axiosInstance.delete(`/notifications/${notificationId}`),

  // Delete all notifications
  deleteAllNotifications: () =>
    axiosInstance.delete('/notifications/delete-all'),

  // Get unread count
  getUnreadCount: () =>
    axiosInstance.get('/notifications/unread-count'),
};

// ============================================
// ADMIN APIs
// ============================================

export const adminAPI = {
  getPendingExperts: () =>
    axiosInstance.get('/admin/users', {
      params: { status: 'pending_approval' },
    }),

  getUsers: (params?: { status?: string; role?: string; search?: string; limit?: number }) =>
    axiosInstance.get('/admin/users', { params }),

  approveExpert: (userId: string) =>
    axiosInstance.post(`/admin/users/${userId}/approve`),

  rejectExpert: (userId: string) =>
    axiosInstance.post(`/admin/users/${userId}/reject`),

  suspendUser: (userId: string) =>
    axiosInstance.post(`/admin/users/${userId}/suspend`),

  unsuspendUser: (userId: string) =>
    axiosInstance.post(`/admin/users/${userId}/unsuspend`),
};

export default axiosInstance;
