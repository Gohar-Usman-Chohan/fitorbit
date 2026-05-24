/**
 * ============================================
 * USER CONTROLLER
 * ============================================
 * Handles general user management operations
 */

const User = require('../models/User');
const ClientProfile = require('../models/ClientProfile');
const TrainerProfile = require('../models/TrainerProfile');
const NutritionistProfile = require('../models/NutritionistProfile');
const { AppError } = require('../middleware/errorHandler');
const { extractUserInfo, sanitizeUser } = require('../utils/helpers');

const getOrCreateClientProfile = async (userId) => {
  let profile = await ClientProfile.findOne({ userId });
  if (!profile) {
    profile = await ClientProfile.create({ userId });
  }
  return profile;
};

const getOrCreateTrainerProfile = async (userId, user) => {
  let profile = await TrainerProfile.findOne({ userId });
  if (!profile) {
    profile = await TrainerProfile.create({
      userId,
      bio: user?.bio || `${user?.firstName || 'Trainer'} ${user?.lastName || ''}`.trim(),
      yearsOfExperience: 0,
      hourlyRate: 0
    });
  }
  return profile;
};

const mergeTrainerProfile = (userInfo, trainerProfile) => ({
  ...userInfo,
  trainerBio: trainerProfile.bio,
  yearsOfExperience: trainerProfile.yearsOfExperience,
  specializations: trainerProfile.specializations || [],
  certifications: trainerProfile.certifications || [],
  hourlyRate: trainerProfile.hourlyRate,
  averageRating: trainerProfile.averageRating,
  totalRatings: trainerProfile.totalRatings,
  availability: trainerProfile.availability || [],
  clientsTrained: trainerProfile.clientsTrained
});

const getOrCreateNutritionistProfile = async (userId, user) => {
  let profile = await NutritionistProfile.findOne({ userId });
  if (!profile) {
    profile = await NutritionistProfile.create({
      userId,
      bio: user?.bio || `${user?.firstName || 'Nutritionist'} ${user?.lastName || ''}`.trim(),
      yearsOfExperience: 0,
      consultationFee: 0
    });
  }
  return profile;
};

const mergeNutritionistProfile = (userInfo, nutritionistProfile) => ({
  ...userInfo,
  nutritionistBio: nutritionistProfile.bio,
  yearsOfExperience: nutritionistProfile.yearsOfExperience,
  specializations: nutritionistProfile.specializations || [],
  certifications: nutritionistProfile.certifications || [],
  consultationFee: nutritionistProfile.consultationFee,
  averageRating: nutritionistProfile.averageRating,
  totalRatings: nutritionistProfile.totalRatings,
  availability: nutritionistProfile.availability || [],
  clientsServed: nutritionistProfile.clientsServed
});

/**
 * Get current user's profile
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const userInfo = extractUserInfo(user);
    let clientProfile = null;

    if (user.role === 'client') {
      clientProfile = await getOrCreateClientProfile(user._id);
      userInfo.age = clientProfile.age;
      userInfo.currentWeight = clientProfile.currentWeight;
      userInfo.currentHeight = clientProfile.currentHeight;
      userInfo.targetWeight = clientProfile.targetWeight;
    }

    let trainerProfile = null;
    if (user.role === 'trainer') {
      trainerProfile = await getOrCreateTrainerProfile(user._id, user);
      Object.assign(userInfo, mergeTrainerProfile(userInfo, trainerProfile));
    }

    let nutritionistProfile = null;
    if (user.role === 'nutritionist') {
      nutritionistProfile = await getOrCreateNutritionistProfile(user._id, user);
      Object.assign(userInfo, mergeNutritionistProfile(userInfo, nutritionistProfile));
    }

    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        ...userInfo,
        user: userInfo,
        clientProfile,
        trainerProfile,
        nutritionistProfile
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      gender,
      bio,
      dateOfBirth,
      age,
      currentWeight,
      currentHeight,
      targetWeight,
      yearsOfExperience,
      specializations,
      certifications,
      hourlyRate,
      consultationFee
    } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;
    if (gender) user.gender = gender;
    if (bio !== undefined) user.bio = bio;
    if (dateOfBirth) user.dateOfBirth = dateOfBirth;

    await user.save();

    const userInfo = extractUserInfo(user);

    if (user.role === 'client') {
      const clientProfile = await getOrCreateClientProfile(user._id);
      if (age !== undefined) clientProfile.age = Number(age);
      if (currentWeight !== undefined) clientProfile.currentWeight = Number(currentWeight);
      if (currentHeight !== undefined) clientProfile.currentHeight = Number(currentHeight);
      if (targetWeight !== undefined) clientProfile.targetWeight = Number(targetWeight);
      await clientProfile.save();
      userInfo.age = clientProfile.age;
      userInfo.currentWeight = clientProfile.currentWeight;
      userInfo.currentHeight = clientProfile.currentHeight;
      userInfo.targetWeight = clientProfile.targetWeight;
    }

    if (user.role === 'trainer') {
      const trainerProfile = await getOrCreateTrainerProfile(user._id, user);
      if (bio !== undefined) trainerProfile.bio = bio;
      if (yearsOfExperience !== undefined) trainerProfile.yearsOfExperience = Number(yearsOfExperience);
      if (specializations !== undefined) trainerProfile.specializations = specializations;
      if (certifications !== undefined) {
        trainerProfile.certifications = Array.isArray(certifications)
          ? certifications.map((item) =>
              typeof item === 'string' ? { name: item } : item
            )
          : [{ name: String(certifications) }];
      }
      if (hourlyRate !== undefined) trainerProfile.hourlyRate = Number(hourlyRate);
      await trainerProfile.save();
      Object.assign(userInfo, mergeTrainerProfile(userInfo, trainerProfile));
    }

    if (user.role === 'nutritionist') {
      const nutritionistProfile = await getOrCreateNutritionistProfile(user._id, user);
      if (bio !== undefined) nutritionistProfile.bio = bio;
      if (yearsOfExperience !== undefined) {
        nutritionistProfile.yearsOfExperience = Number(yearsOfExperience);
      }
      if (specializations !== undefined) nutritionistProfile.specializations = specializations;
      if (certifications !== undefined) {
        nutritionistProfile.certifications = Array.isArray(certifications)
          ? certifications.map((item) =>
              typeof item === 'string' ? { name: item } : item
            )
          : [{ name: String(certifications) }];
      }
      if (consultationFee !== undefined) {
        nutritionistProfile.consultationFee = Number(consultationFee);
      }
      await nutritionistProfile.save();
      Object.assign(userInfo, mergeNutritionistProfile(userInfo, nutritionistProfile));
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        ...userInfo,
        user: userInfo
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by ID (public profile)
 */
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Return sanitized public profile
    res.status(200).json({
      success: true,
      message: 'User profile retrieved',
      data: {
        user: extractUserInfo(user)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload user avatar
 */
const uploadAvatar = async (req, res, next) => {
  try {
    // TODO: Implement file upload logic
    // For now, just accept a URL
    const { avatarUrl } = req.body;

    if (!avatarUrl) {
      throw new AppError('Avatar URL is required', 400);
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    user.profilePicture = avatarUrl;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user settings
 */
const getSettings = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Settings retrieved successfully',
      data: {
        settings: user.preferences
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user settings
 */
const updateSettings = async (req, res, next) => {
  try {
    const { notifications, emailNotifications, privateProfile } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Update preferences
    if (notifications !== undefined) user.preferences.notifications = notifications;
    if (emailNotifications !== undefined) user.preferences.emailNotifications = emailNotifications;
    if (privateProfile !== undefined) user.preferences.privateProfile = privateProfile;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: {
        settings: user.preferences
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user preferences
 */
const getPreferences = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Preferences retrieved successfully',
      data: {
        preferences: user.preferences
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user preferences
 */
const updatePreferences = async (req, res, next) => {
  try {
    const preferences = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Update preferences
    user.preferences = { ...user.preferences, ...preferences };
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      data: {
        preferences: user.preferences
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getUserById,
  uploadAvatar,
  getSettings,
  updateSettings,
  getPreferences,
  updatePreferences
};

