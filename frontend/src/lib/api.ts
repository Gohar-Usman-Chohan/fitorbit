import axios from 'axios';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

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

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = Cookies.get('refreshToken');
        if (!refreshToken) {
          // Clear tokens and redirect to login
          Cookies.remove('token');
          Cookies.remove('refreshToken');
          window.location.href = '/auth/login';
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
        window.location.href = '/auth/login';
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

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
    const lastName = nameParts.slice(1).join(' ') || '';

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

  resetPassword: (token: string, password: string) =>
    axiosInstance.post(`/auth/reset-password/${encodeURIComponent(token)}`, {
      password,
    }),

  verifyEmail: (token: string) =>
    axiosInstance.get(`/auth/verify-email/${encodeURIComponent(token)}`),

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
  getProfile: () => axiosInstance.get('/clients/profile'),

  // Create/update client profile
  updateProfile: (data: any) => axiosInstance.put('/clients/profile', data),

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

  // Get assigned workout + diet plans
  getPlans: () => axiosInstance.get('/clients/plans'),

  // Alias used by some pages
  getAssignedPlans: () => axiosInstance.get('/clients/plans'),

  // Get progress summary
  getProgressSummary: () => axiosInstance.get('/clients/progress-summary'),

  // Get active plans
  getActivePlans: () => axiosInstance.get('/clients/active-plans'),

  // Get upcoming appointments
  getUpcomingAppointments: () =>
    axiosInstance.get('/clients/upcoming-appointments'),

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

  // Get assigned trainer/nutritionist for chat
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

  // Get trainer clients
  getClients: (params?: { scope?: string; limit?: number; search?: string }) =>
    axiosInstance.get('/trainers/clients', { params }),

  // Get client details
  getClientDetails: (clientId: string) =>
    axiosInstance.get(`/trainers/clients/${clientId}`),

  // Workout plans (trainer-assigned)
  getWorkouts: (params?: { limit?: number; skip?: number; status?: string }) =>
    axiosInstance.get('/trainers/workouts', { params }),

  createWorkout: (data: Record<string, unknown>) =>
    axiosInstance.post('/trainers/workouts', data),

  updateWorkout: (workoutId: string, data: Record<string, unknown>) =>
    axiosInstance.put(`/trainers/workouts/${workoutId}`, data),

  deleteWorkout: (workoutId: string) =>
    axiosInstance.delete(`/trainers/workouts/${workoutId}`),

  getWorkoutDetails: (workoutId: string) =>
    axiosInstance.get(`/trainers/workouts/${workoutId}/details`),

  // Get trainer dashboard
  getDashboard: () => axiosInstance.get('/trainers/dashboard'),

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

  // Get nutritionist clients
  getClients: (params?: { scope?: string; limit?: number; search?: string }) =>
    axiosInstance.get('/nutritionists/clients', { params }),

  // Get client details
  getClientDetails: (clientId: string) =>
    axiosInstance.get(`/nutritionists/clients/${clientId}`),

  // Meal / diet plans (nutritionist-assigned)
  getMealPlans: (params?: { limit?: number; skip?: number; status?: string }) =>
    axiosInstance.get('/nutritionists/meal-plans', { params }),

  createMealPlan: (data: Record<string, unknown>) =>
    axiosInstance.post('/nutritionists/meal-plans', data),

  updateMealPlan: (planId: string, data: Record<string, unknown>) =>
    axiosInstance.put(`/nutritionists/meal-plans/${planId}`, data),

  deleteMealPlan: (planId: string) =>
    axiosInstance.delete(`/nutritionists/meal-plans/${planId}`),

  // Get nutritionist schedule
  getSchedule: (params?: Record<string, unknown>) =>
    axiosInstance.get('/nutritionists/schedule', { params }),

  // Get client progress
  getClientProgress: (clientId: string) =>
    axiosInstance.get(`/nutritionists/clients/${clientId}/progress`),

  // Get nutritionist dashboard
  getDashboard: () => axiosInstance.get('/nutritionists/dashboard'),

  // Get client assessment
  getClientAssessment: (clientId: string) =>
    axiosInstance.get(`/nutritionists/clients/${clientId}/assessment`),

  // Provide feedback
  provideFeedback: (clientId: string, feedback: string) =>
    axiosInstance.post(`/nutritionists/clients/${clientId}/feedback`, {
      feedback,
    }),
};

// ============================================
// WORKOUT APIs
// ============================================

export const workoutAPI = {
  // Get all workout plans
  getWorkoutPlans: (params?: any) =>
    axiosInstance.get('/workouts/plans', { params }),

  // Get workout plan by ID
  getWorkoutPlan: (planId: string) =>
    axiosInstance.get(`/workouts/plans/${planId}`),

  // Create workout plan
  createWorkoutPlan: (data: any) =>
    axiosInstance.post('/workouts/plans', data),

  // Update workout plan
  updateWorkoutPlan: (planId: string, data: any) =>
    axiosInstance.put(`/workouts/plans/${planId}`, data),

  // Delete workout plan
  deleteWorkoutPlan: (planId: string) =>
    axiosInstance.delete(`/workouts/plans/${planId}`),

  // Get exercises
  getExercises: (params?: any) =>
    axiosInstance.get('/workouts/exercises', { params }),

  // Get exercise by ID
  getExercise: (exerciseId: string) =>
    axiosInstance.get(`/workouts/exercises/${exerciseId}`),

  // Create exercise
  createExercise: (data: any) =>
    axiosInstance.post('/workouts/exercises', data),

  // Update exercise
  updateExercise: (exerciseId: string, data: any) =>
    axiosInstance.put(`/workouts/exercises/${exerciseId}`, data),

  // Delete exercise
  deleteExercise: (exerciseId: string) =>
    axiosInstance.delete(`/workouts/exercises/${exerciseId}`),

  // Search exercises
  searchExercises: (query: string, params?: any) =>
    axiosInstance.get(`/workouts/exercises/search/${query}`, { params }),
};

// ============================================
// DIET APIs
// ============================================

export const dietAPI = {
  // Get all diet plans
  getDietPlans: (params?: any) =>
    axiosInstance.get('/diet/plans', { params }),

  // Get diet plan by ID
  getDietPlan: (planId: string) =>
    axiosInstance.get(`/diet/plans/${planId}`),

  // Create diet plan
  createDietPlan: (data: any) =>
    axiosInstance.post('/diet/plans', data),

  // Update diet plan
  updateDietPlan: (planId: string, data: any) =>
    axiosInstance.put(`/diet/plans/${planId}`, data),

  // Delete diet plan
  deleteDietPlan: (planId: string) =>
    axiosInstance.delete(`/diet/plans/${planId}`),

  // Get meals
  getMeals: (params?: any) =>
    axiosInstance.get('/diet/meals', { params }),

  // Get meal by ID
  getMeal: (mealId: string) =>
    axiosInstance.get(`/diet/meals/${mealId}`),

  // Create meal
  createMeal: (data: any) => axiosInstance.post('/diet/meals', data),

  // Update meal
  updateMeal: (mealId: string, data: any) =>
    axiosInstance.put(`/diet/meals/${mealId}`, data),

  // Delete meal
  deleteMeal: (mealId: string) =>
    axiosInstance.delete(`/diet/meals/${mealId}`),

  // Search meals
  searchMeals: (query: string, params?: any) =>
    axiosInstance.get(`/diet/meals/search/${query}`, { params }),

  // Filter meals by dietary tags
  filterMealsByTags: (tags: string[], params?: any) =>
    axiosInstance.post('/diet/meals/filter', { tags }, { params }),
};

// ============================================
// PROGRESS APIs
// ============================================

export const progressAPI = {
  // Get progress logs
  getProgressLogs: (params?: Record<string, unknown>) =>
    axiosInstance.get('/progress', { params }),

  // Get progress log by ID
  getProgressLog: (logId: string) =>
    axiosInstance.get(`/progress/${logId}`),

  // Create progress log
  createProgressLog: (data: Record<string, unknown>) =>
    axiosInstance.post('/progress', data),

  // Update progress log
  updateProgressLog: (logId: string, data: Record<string, unknown>) =>
    axiosInstance.put(`/progress/${logId}`, data),

  // Delete progress log
  deleteProgressLog: (logId: string) =>
    axiosInstance.delete(`/progress/${logId}`),

  // Get progress statistics
  getProgressStatistics: (params?: any) =>
    axiosInstance.get('/progress/statistics', { params }),

  // Get progress by date range
  getProgressByDateRange: (startDate: string, endDate: string, params?: any) =>
    axiosInstance.get('/progress/date-range', {
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
    axiosInstance.post(`/appointments/${appointmentId}/cancel`, { reason }),

  // Reschedule appointment
  rescheduleAppointment: (appointmentId: string, newDate: string) =>
    axiosInstance.post(`/appointments/${appointmentId}/reschedule`, {
      newDate,
    }),

  // Complete appointment
  completeAppointment: (appointmentId: string, notes?: string) =>
    axiosInstance.post(`/appointments/${appointmentId}/complete`, { notes }),

  // Approve appointment (expert)
  approveAppointment: (appointmentId: string) =>
    axiosInstance.post(`/appointments/${appointmentId}/approve`),

  // Reject appointment (expert)
  rejectAppointment: (appointmentId: string, reason?: string) =>
    axiosInstance.post(`/appointments/${appointmentId}/reject`, { reason }),

  // Mark no-show (expert)
  markNoShow: (appointmentId: string) =>
    axiosInstance.post(`/appointments/${appointmentId}/no-show`),

  // Rate appointment (client)
  rateAppointment: (
    appointmentId: string,
    data: { rating: number; feedback?: string }
  ) => axiosInstance.post(`/appointments/${appointmentId}/rate`, data),

  // Payment checkout (dummy Stripe flow)
  createCheckoutSession: (appointmentId: string) =>
    axiosInstance.post('/payments/create-checkout-session', { appointmentId }),

  confirmPayment: (appointmentId: string, sessionId?: string) =>
    axiosInstance.post('/payments/confirm', { appointmentId, sessionId }),

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
  // Get conversations
  getConversations: (params?: any) =>
    axiosInstance.get('/chat/conversations', { params }),

  // Get conversation messages
  getMessages: (conversationId: string, params?: any) =>
    axiosInstance.get(`/chat/messages/${conversationId}`, { params }),

  // Send message (creates conversation when conversationId omitted)
  sendMessage: (
    conversationId: string | undefined,
    data:
      | { content: string; receiverId: string; conversationId?: string }
      | string,
    attachments?: any[]
  ) => {
    if (typeof data === 'string') {
      if (!conversationId) {
        throw new Error('conversationId is required when sending message text only');
      }
      return axiosInstance.post('/chat/messages', {
        conversationId,
        content: data,
        messageContent: data,
        attachments,
      });
    }

    const resolvedConversationId =
      data.conversationId ||
      (conversationId && conversationId !== 'new' ? conversationId : undefined);

    return axiosInstance.post('/chat/messages', {
      conversationId: resolvedConversationId,
      receiverId: data.receiverId,
      content: data.content,
      messageContent: data.content,
    });
  },

  // Edit message
  editMessage: (conversationId: string, messageId: string, content: string) =>
    axiosInstance.put(
      `/chat/conversations/${conversationId}/messages/${messageId}`,
      { content }
    ),

  // Delete message
  deleteMessage: (conversationId: string, messageId: string) =>
    axiosInstance.delete(
      `/chat/conversations/${conversationId}/messages/${messageId}`
    ),

  // Mark message as read
  markAsRead: (conversationId: string, messageId: string) =>
    axiosInstance.post(
      `/chat/conversations/${conversationId}/messages/${messageId}/read`
    ),

  // Mark all messages as read
  markAllAsRead: (conversationId: string) =>
    axiosInstance.put(`/chat/conversations/${conversationId}/read`),

  // Get conversation
  getConversation: (conversationId: string) =>
    axiosInstance.get(`/chat/conversations/${conversationId}`),

  // Create conversation
  createConversation: (participantIds: string[]) =>
    axiosInstance.post('/chat/conversations', { participantIds }),

  // Add reaction to message
  addReaction: (
    conversationId: string,
    messageId: string,
    emoji: string
  ) =>
    axiosInstance.post(
      `/chat/conversations/${conversationId}/messages/${messageId}/reactions`,
      { emoji }
    ),

  // Get total unread message count
  getUnreadCount: () => axiosInstance.get('/chat/unread-count'),
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
  // Get admin dashboard
  getDashboard: () => axiosInstance.get('/admin/dashboard'),

  // Get all users
  getUsers: (params?: any) =>
    axiosInstance.get('/admin/users', { params }),

  // Pending trainer/nutritionist approvals
  getPendingExperts: (params?: any) =>
    axiosInstance.get('/admin/users', {
      params: { status: 'pending_approval', limit: 100, ...params },
    }),

  // Get user details
  getUserDetails: (userId: string) =>
    axiosInstance.get(`/admin/users/${userId}`),

  // Approve expert
  approveExpert: (userId: string) =>
    axiosInstance.post(`/admin/users/${userId}/approve`),

  // Reject expert
  rejectExpert: (userId: string, reason?: string) =>
    axiosInstance.post(`/admin/users/${userId}/reject`, { reason }),

  // Suspend user
  suspendUser: (userId: string, reason?: string) =>
    axiosInstance.post(`/admin/users/${userId}/suspend`, { reason }),

  // Unsuspend user
  unsuspendUser: (userId: string) =>
    axiosInstance.post(`/admin/users/${userId}/unsuspend`),

  // Get activity logs
  getActivityLogs: (params?: any) =>
    axiosInstance.get('/admin/activity-logs', { params }),

  // Get system reports
  getSystemReports: (params?: any) =>
    axiosInstance.get('/admin/reports', { params }),
};

export { parseUserProfileResponse } from './apiHelpers';

export default axiosInstance;
