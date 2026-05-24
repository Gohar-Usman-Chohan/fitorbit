/**
 * Shared formatters so API responses match frontend expectations.
 */

const formatAppointment = (appointment) => {
  if (!appointment) return appointment;

  const doc = appointment.toObject ? appointment.toObject() : { ...appointment };
  const expert = doc.expertId;
  const client = doc.clientId;

  const expertName =
    doc.expertName ||
    (expert && typeof expert === 'object'
      ? `${expert.firstName || ''} ${expert.lastName || ''}`.trim()
      : undefined);

  const clientName =
    doc.clientName ||
    (client && typeof client === 'object'
      ? `${client.firstName || ''} ${client.lastName || ''}`.trim()
      : undefined);

  return {
    ...doc,
    id: doc.id || doc._id?.toString(),
    expertId: expert?._id || expert || doc.expertId,
    clientId: client?._id || client || doc.clientId,
    expertName,
    clientName,
    durationUnit: doc.durationUnit || 'minutes'
  };
};

const humanizeToken = (value) =>
  String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatPublicExpertListing = (user, type, profile) => {
  if (!user) return null;

  const doc = user.toObject ? user.toObject() : { ...user };
  const expertProfile = profile || {};
  const specializations = (expertProfile.specializations || []).map(humanizeToken);
  const years = expertProfile.yearsOfExperience ?? 0;
  const defaultSpecialization =
    type === 'trainer' ? 'Fitness Training' : 'Nutrition Counseling';

  return {
    id: doc._id?.toString() || doc.id,
    firstName: doc.firstName,
    lastName: doc.lastName,
    email: doc.email,
    bio: expertProfile.bio || doc.bio || '',
    profilePicture: doc.profilePicture,
    specialization: specializations[0] || defaultSpecialization,
    specializations,
    yearsOfExperience: years,
    experience: `${years} year${years === 1 ? '' : 's'} experience`,
    rating: expertProfile.averageRating ?? 0,
    averageRating: expertProfile.averageRating ?? 0,
    totalRatings: expertProfile.totalRatings ?? 0,
    hourlyRate: expertProfile.hourlyRate ?? expertProfile.consultationFee ?? null,
    certified: (expertProfile.certifications?.length ?? 0) > 0,
    certifications: expertProfile.certifications || [],
    clients:
      expertProfile.clientsTrained ?? expertProfile.clientsServed ?? 0,
    isVerified: expertProfile.isVerified ?? false,
    type,
  };
};

const formatExpert = (user, type, profile) => {
  if (!user) return null;

  const doc = user.toObject ? user.toObject() : { ...user };
  const expertProfile = profile || doc.profile || {};

  return {
    ...doc,
    id: doc.id || doc._id?.toString(),
    type,
    name: `${doc.firstName || ''} ${doc.lastName || ''}`.trim(),
    bio: expertProfile.bio || doc.bio,
    specializations: expertProfile.specializations || doc.specializations || [],
    yearsOfExperience: expertProfile.yearsOfExperience ?? doc.yearsOfExperience ?? 0,
    averageRating: expertProfile.averageRating ?? doc.averageRating ?? 0,
    totalRatings: expertProfile.totalRatings ?? doc.totalRatings ?? 0,
    hourlyRate: expertProfile.hourlyRate ?? expertProfile.consultationFee ?? doc.hourlyRate,
    profile: expertProfile
  };
};

const formatDashboardStats = (data, role) => {
  const upcoming = Array.isArray(data.upcomingAppointments)
    ? data.upcomingAppointments
    : [];

  const base = {
    totalClients: data.totalClients ?? 0,
    upcomingAppointments: upcoming.length,
    upcomingAppointmentsList: upcoming,
    averageRating: data.profile?.averageRating ?? data.averageRating ?? null,
    totalRatings: data.profile?.totalRatings ?? data.totalRatings ?? 0,
  };

  if (role === 'trainer') {
    return {
      ...base,
      stats: {
        totalClients: base.totalClients,
        totalWorkouts: data.activeWorkouts ?? 0,
        upcomingAppointments: base.upcomingAppointments,
        averageRating: base.averageRating,
        totalRatings: base.totalRatings,
      },
      activeWorkouts: data.activeWorkouts ?? 0
    };
  }

  if (role === 'nutritionist') {
    return {
      ...base,
      stats: {
        totalClients: base.totalClients,
        totalMealPlans: data.activeDiets ?? 0,
        upcomingAppointments: base.upcomingAppointments,
        averageRating: base.averageRating,
        totalRatings: base.totalRatings,
      },
      activeDiets: data.activeDiets ?? 0
    };
  }

  return { ...data, stats: base };
};

module.exports = {
  formatAppointment,
  formatExpert,
  formatPublicExpertListing,
  formatDashboardStats,
  humanizeToken,
};
