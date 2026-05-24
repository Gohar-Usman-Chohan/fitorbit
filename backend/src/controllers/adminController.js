/**
 * ============================================
 * ADMIN CONTROLLER
 * ============================================
 * Handles admin dashboard and system management
 */

const User = require('../models/User');
const ClientProfile = require('../models/ClientProfile');
const TrainerProfile = require('../models/TrainerProfile');
const NutritionistProfile = require('../models/NutritionistProfile');
const Appointment = require('../models/Appointment');
const { AppError } = require('../middleware/errorHandler');
const { USER_ROLES, ACCOUNT_STATUS } = require('../config/constants');
const { forceUserSessionEnd } = require('../utils/accountSessionHelpers');

const getParamId = (req) => req.params.id || req.params.userId || req.params.expertId;

const getAdminId = (req) => String(req.user.id || req.user._id);

const assertCanModifyUser = (req, targetUserId, action) => {
  if (String(targetUserId) === getAdminId(req)) {
    throw new AppError(`You cannot ${action} your own account`, 400);
  }
};

const assertPendingExpert = (user) => {
  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (![USER_ROLES.TRAINER, USER_ROLES.NUTRITIONIST].includes(user.role)) {
    throw new AppError('Only trainer or nutritionist accounts require approval', 400);
  }

  if (user.accountStatus !== ACCOUNT_STATUS.PENDING_APPROVAL) {
    throw new AppError('This account is not pending approval', 400);
  }

  if (!user.isEmailVerified) {
    throw new AppError('This expert has not verified their email yet', 400);
  }
};

/**
 * Get admin dashboard
 */
const getDashboard = async (req, res, next) => {
  try {
    // Get statistics
    const totalUsers = await User.countDocuments();
    const totalClients = await User.countDocuments({ role: 'client' });
    const totalTrainers = await User.countDocuments({ role: 'trainer' });
    const totalNutritionists = await User.countDocuments({ role: 'nutritionist' });
    const pendingApprovals = await User.countDocuments({ accountStatus: 'pending_approval' });
    const totalAppointments = await Appointment.countDocuments();
    const completedAppointments = await Appointment.countDocuments({ status: 'completed' });

    const recentUsers = await User.find()
      .select('firstName lastName email role createdAt')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      message: 'Admin dashboard retrieved',
      data: {
        stats: {
          totalUsers,
          totalClients,
          totalTrainers,
          totalNutritionists,
          pendingApprovals,
          totalAppointments,
          completedAppointments
        },
        recentUsers
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List all users with filters
 */
const listUsers = async (req, res, next) => {
  try {
    const { limit = 20, skip = 0, role, status, search } = req.query;

    const query = {};
    if (status) query.accountStatus = status;

    if (status === ACCOUNT_STATUS.PENDING_APPROVAL) {
      query.role = { $in: [USER_ROLES.TRAINER, USER_ROLES.NUTRITIONIST] };
      query.isEmailVerified = true;
    } else if (role) {
      query.role = role;
    } else {
      query.role = { $ne: USER_ROLES.ADMIN };
    }
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password -passwordResetToken -passwordResetExpire')
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      message: 'Users retrieved',
      data: {
        users,
        total,
        limit: parseInt(limit),
        skip: parseInt(skip)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user details
 */
const getUserDetails = async (req, res, next) => {
  try {
    const userId = getParamId(req);

    const user = await User.findById(userId).select('-password -passwordResetToken -passwordResetExpire');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Get profile data based on role
    let profile = null;
    if (user.role === 'client') {
      profile = await ClientProfile.findOne({ userId });
    } else if (user.role === 'trainer') {
      profile = await TrainerProfile.findOne({ userId });
    } else if (user.role === 'nutritionist') {
      profile = await NutritionistProfile.findOne({ userId });
    }

    res.status(200).json({
      success: true,
      message: 'User details retrieved',
      data: {
        user,
        profile
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve expert account (trainer/nutritionist)
 */
const approveExpert = async (req, res, next) => {
  try {
    const userId = getParamId(req);
    assertCanModifyUser(req, userId, 'approve');

    const user = await User.findById(userId);
    assertPendingExpert(user);

    user.accountStatus = ACCOUNT_STATUS.ACTIVE;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Expert account approved',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject expert account
 */
const rejectExpert = async (req, res, next) => {
  try {
    const userId = getParamId(req);
    assertCanModifyUser(req, userId, 'reject');

    const user = await User.findById(userId);
    assertPendingExpert(user);

    user.accountStatus = ACCOUNT_STATUS.SUSPENDED;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Expert account rejected',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Suspend user account
 */
const suspendUser = async (req, res, next) => {
  try {
    const userId = getParamId(req);
    assertCanModifyUser(req, userId, 'suspend');

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.role === USER_ROLES.ADMIN) {
      throw new AppError('Admin accounts cannot be suspended', 400);
    }

    if (user.accountStatus === ACCOUNT_STATUS.SUSPENDED) {
      throw new AppError('User is already suspended', 400);
    }

    user.accountStatus = ACCOUNT_STATUS.SUSPENDED;
    await user.save();

    forceUserSessionEnd(req, userId, {
      message: 'Your account has been suspended by an administrator. You have been signed out.',
    });

    res.status(200).json({
      success: true,
      message: 'User account suspended',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Unsuspend user account
 */
const unsuspendUser = async (req, res, next) => {
  try {
    const userId = getParamId(req);
    assertCanModifyUser(req, userId, 'unsuspend');

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.role === USER_ROLES.ADMIN) {
      throw new AppError('Admin accounts cannot be modified this way', 400);
    }

    if (user.accountStatus !== ACCOUNT_STATUS.SUSPENDED) {
      throw new AppError('User is not suspended', 400);
    }

    user.accountStatus = ACCOUNT_STATUS.ACTIVE;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User account restored',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get activity logs
 */
const getActivityLogs = async (req, res, next) => {
  try {
    // For now, return recent user activities
    const recentUsers = await User.find()
      .select('firstName lastName email lastLogin createdAt')
      .sort({ lastLogin: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      message: 'Activity logs retrieved',
      data: { activities: recentUsers }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get system reports
 */
const getReports = async (req, res, next) => {
  try {
    const { reportType } = req.query;

    if (reportType === 'users') {
      const clientCount = await User.countDocuments({ role: 'client' });
      const trainerCount = await User.countDocuments({ role: 'trainer' });
      const nutritionistCount = await User.countDocuments({ role: 'nutritionist' });

      return res.status(200).json({
        success: true,
        message: 'User report retrieved',
        data: {
          report: {
            clients: clientCount,
            trainers: trainerCount,
            nutritionists: nutritionistCount
          }
        }
      });
    } else if (reportType === 'appointments') {
      const total = await Appointment.countDocuments();
      const completed = await Appointment.countDocuments({ status: 'completed' });
      const scheduled = await Appointment.countDocuments({ status: 'scheduled' });
      const cancelled = await Appointment.countDocuments({ status: 'cancelled' });

      return res.status(200).json({
        success: true,
        message: 'Appointment report retrieved',
        data: {
          report: {
            total,
            completed,
            scheduled,
            cancelled
          }
        }
      });
    }

    throw new AppError('Invalid report type', 400);
  } catch (error) {
    next(error);
  }
};

/**
 * Update user (admin)
 */
const updateUser = async (req, res, next) => {
  try {
    const userId = getParamId(req);
    assertCanModifyUser(req, userId, 'update');

    const allowedFields = ['firstName', 'lastName', 'email', 'role', 'accountStatus', 'phone'];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(userId, updates, { new: true, runValidators: true })
      .select('-password -passwordResetToken -passwordResetExpire');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user (soft delete)
 */
const deleteUser = async (req, res, next) => {
  try {
    const userId = getParamId(req);
    assertCanModifyUser(req, userId, 'delete');

    const user = await User.findByIdAndUpdate(
      userId,
      { accountStatus: ACCOUNT_STATUS.DELETED },
      { new: true }
    ).select('-password');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify expert (alias for approve)
 */
const verifyExpert = approveExpert;

/**
 * List all appointments (admin)
 */
const listAppointments = async (req, res, next) => {
  try {
    const { limit = 20, skip = 0, status } = req.query;
    const query = {};
    if (status) query.status = status;

    const appointments = await Appointment.find(query)
      .populate('clientId', 'firstName lastName email')
      .populate('expertId', 'firstName lastName email')
      .sort({ appointmentDate: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Appointment.countDocuments(query);

    res.status(200).json({
      success: true,
      message: 'Appointments retrieved',
      data: { appointments, total, limit: parseInt(limit), skip: parseInt(skip) }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Payment reports (stub until payment integration)
 */
const getPaymentReports = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Payment reports retrieved',
      data: {
        payments: [],
        summary: { total: 0, pending: 0, completed: 0 },
        note: 'Payment integration pending'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Platform reports (alias)
 */
const getPlatformReports = getReports;

/**
 * Create announcement (stub)
 */
const createAnnouncement = async (req, res, next) => {
  try {
    const { title, message, targetRole } = req.body;
    res.status(201).json({
      success: true,
      message: 'Announcement created',
      data: {
        announcement: {
          title,
          message,
          targetRole: targetRole || 'all',
          createdAt: new Date()
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List announcements (stub)
 */
const listAnnouncements = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Announcements retrieved',
      data: { announcements: [] }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update system settings (stub)
 */
const updateSettings = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Settings updated',
      data: { settings: req.body }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit content moderation report
 */
const submitContentReport = async (req, res, next) => {
  try {
    res.status(201).json({
      success: true,
      message: 'Content report submitted',
      data: { report: req.body }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  listUsers,
  getUserDetails,
  updateUser,
  deleteUser,
  approveExpert,
  verifyExpert,
  rejectExpert,
  suspendUser,
  unsuspendUser,
  getActivityLogs,
  getReports,
  getPlatformReports,
  listAppointments,
  getPaymentReports,
  createAnnouncement,
  listAnnouncements,
  updateSettings,
  submitContentReport
};
