/**
 * ============================================
 * GENERIC CONTROLLER STUB FACTORY
 * ============================================
 * Create stub responses for unimplemented controllers
 */

const createStubController = (name) => ({
  async handle(req, res) {
    res.status(200).json({
      success: true,
      message: `${name} endpoint - implementation pending`,
      data: {}
    });
  }
});

// ============================================
// CLIENT CONTROLLER STUBS
// ============================================
const clientControllerStubs = {
  getDashboard: (req, res) => res.json({ success: true, data: {} }),
  getGoals: (req, res) => res.json({ success: true, data: { goals: [] } }),
  getPlans: (req, res) => res.json({ success: true, data: { plans: [] } }),
  createGoal: (req, res) => res.status(201).json({ success: true, data: {} }),
  updateGoal: (req, res) => res.json({ success: true, data: {} }),
  deleteGoal: (req, res) => res.json({ success: true }),
  getProgress: (req, res) => res.json({ success: true, data: { progress: [] } }),
  addProgress: (req, res) => res.status(201).json({ success: true, data: {} }),
  getAssignedExperts: (req, res) => res.json({ success: true, data: { experts: [] } }),
  getPlanDetails: (req, res) => res.json({ success: true, data: {} }),
  getExpertDetails: (req, res) => res.json({ success: true, data: {} })
};

// ============================================
// TRAINER CONTROLLER STUBS
// ============================================
const trainerControllerStubs = {
  getDashboard: (req, res) => res.json({ success: true, data: {} }),
  getClients: (req, res) => res.json({ success: true, data: { clients: [] } }),
  getClientDetails: (req, res) => res.json({ success: true, data: {} }),
  getWorkouts: (req, res) => res.json({ success: true, data: { workouts: [] } }),
  createWorkout: (req, res) => res.status(201).json({ success: true, data: {} }),
  updateWorkout: (req, res) => res.json({ success: true, data: {} }),
  deleteWorkout: (req, res) => res.json({ success: true }),
  getWorkoutDetails: (req, res) => res.json({ success: true, data: {} }),
  getSchedule: (req, res) => res.json({ success: true, data: { schedule: [] } }),
  getAvailability: (req, res) => res.json({ success: true, data: { slots: [] } }),
  updateAvailability: (req, res) => res.json({ success: true }),
  getClientProgress: (req, res) => res.json({ success: true, data: { progress: [] } })
};

// ============================================
// NUTRITIONIST CONTROLLER STUBS
// ============================================
const nutritionistControllerStubs = {
  getDashboard: (req, res) => res.json({ success: true, data: {} }),
  getClients: (req, res) => res.json({ success: true, data: { clients: [] } }),
  getMealPlans: (req, res) => res.json({ success: true, data: { plans: [] } }),
  createMealPlan: (req, res) => res.status(201).json({ success: true, data: {} }),
  updateMealPlan: (req, res) => res.json({ success: true, data: {} }),
  deleteMealPlan: (req, res) => res.json({ success: true }),
  getAssessments: (req, res) => res.json({ success: true, data: { assessments: [] } }),
  updateAssessment: (req, res) => res.json({ success: true, data: {} })
};

// ============================================
// WORKOUT CONTROLLER STUBS
// ============================================
const workoutControllerStubs = {
  getWorkouts: (req, res) => res.json({ success: true, data: { workouts: [] } }),
  getWorkoutById: (req, res) => res.json({ success: true, data: {} }),
  getWorkoutsByCategory: (req, res) => res.json({ success: true, data: { workouts: [] } }),
  getWorkoutsByDifficulty: (req, res) => res.json({ success: true, data: { workouts: [] } }),
  createWorkout: (req, res) => res.status(201).json({ success: true, data: {} }),
  updateWorkout: (req, res) => res.json({ success: true, data: {} }),
  deleteWorkout: (req, res) => res.json({ success: true })
};

// ============================================
// DIET CONTROLLER STUBS
// ============================================
const dietControllerStubs = {
  getDiets: (req, res) => res.json({ success: true, data: { diets: [] } }),
  getDietById: (req, res) => res.json({ success: true, data: {} }),
  getDietsByCategory: (req, res) => res.json({ success: true, data: { diets: [] } }),
  searchDiets: (req, res) => res.json({ success: true, data: { diets: [] } }),
  createDiet: (req, res) => res.status(201).json({ success: true, data: {} }),
  updateDiet: (req, res) => res.json({ success: true, data: {} }),
  deleteDiet: (req, res) => res.json({ success: true })
};

// ============================================
// PROGRESS CONTROLLER STUBS
// ============================================
const progressControllerStubs = {
  getProgress: (req, res) => res.json({ success: true, data: { progress: [] } }),
  createProgress: (req, res) => res.status(201).json({ success: true, data: {} }),
  getProgressById: (req, res) => res.json({ success: true, data: {} }),
  updateProgress: (req, res) => res.json({ success: true, data: {} }),
  deleteProgress: (req, res) => res.json({ success: true }),
  getProgressStats: (req, res) => res.json({ success: true, data: { stats: {} } })
};

// ============================================
// APPOINTMENT CONTROLLER STUBS
// ============================================
const appointmentControllerStubs = {
  listAppointments: (req, res) => res.json({ success: true, data: { appointments: [] } }),
  createAppointment: (req, res) => res.status(201).json({ success: true, data: {} }),
  getAppointment: (req, res) => res.json({ success: true, data: {} }),
  updateAppointment: (req, res) => res.json({ success: true, data: {} }),
  cancelAppointment: (req, res) => res.json({ success: true }),
  rescheduleAppointment: (req, res) => res.json({ success: true, data: {} }),
  completeAppointment: (req, res) => res.json({ success: true }),
  getAvailability: (req, res) => res.json({ success: true, data: { slots: [] } })
};

// ============================================
// CHAT CONTROLLER STUBS
// ============================================
const chatControllerStubs = {
  sendMessage: (req, res) => res.status(201).json({ success: true, data: {} }),
  getMessages: (req, res) => res.json({ success: true, data: { messages: [] } }),
  editMessage: (req, res) => res.json({ success: true, data: {} }),
  deleteMessage: (req, res) => res.json({ success: true }),
  markAsRead: (req, res) => res.json({ success: true }),
  getConversations: (req, res) => res.json({ success: true, data: { conversations: [] } }),
  addReaction: (req, res) => res.json({ success: true, data: {} })
};

// ============================================
// NOTIFICATION CONTROLLER STUBS
// ============================================
const notificationControllerStubs = {
  getNotifications: (req, res) => res.json({ success: true, data: { notifications: [] } }),
  getUnreadCount: (req, res) => res.json({ success: true, data: { count: 0 } }),
  markAsRead: (req, res) => res.json({ success: true }),
  markAllAsRead: (req, res) => res.json({ success: true }),
  deleteNotification: (req, res) => res.json({ success: true }),
  deleteAllNotifications: (req, res) => res.json({ success: true })
};


// ============================================
// ADMIN CONTROLLER STUBS
// ============================================
const adminControllerStubs = {
  getDashboard: (req, res) => res.json({ success: true, data: {} }),
  listUsers: (req, res) => res.json({ success: true, data: { users: [] } }),
  getUserDetails: (req, res) => res.json({ success: true, data: {} }),
  updateUser: (req, res) => res.json({ success: true, data: {} }),
  deleteUser: (req, res) => res.json({ success: true }),
  verifyExpert: (req, res) => res.json({ success: true }),
  listAppointments: (req, res) => res.json({ success: true, data: { appointments: [] } }),
  getPaymentReports: (req, res) => res.json({ success: true, data: {} }),
  getPlatformReports: (req, res) => res.json({ success: true, data: {} }),
  createAnnouncement: (req, res) => res.status(201).json({ success: true, data: {} }),
  listAnnouncements: (req, res) => res.json({ success: true, data: { announcements: [] } }),
  updateSettings: (req, res) => res.json({ success: true }),
  submitContentReport: (req, res) => res.json({ success: true })
};

module.exports = {
  clientControllerStubs,
  trainerControllerStubs,
  nutritionistControllerStubs,
  workoutControllerStubs,
  dietControllerStubs,
  progressControllerStubs,
  appointmentControllerStubs,
  chatControllerStubs,
  notificationControllerStubs,
  adminControllerStubs
};
