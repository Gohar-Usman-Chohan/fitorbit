/** Extract `data` payload from axios responses consistently. */
export function parseApiData<T = Record<string, unknown>>(
  response: { data?: unknown }
): T {
  const body = (response?.data ?? response) as Record<string, unknown>;
  return (body?.data ?? body) as T;
}

/** Normalize user profile from GET/PUT /users/profile (or role profile aliases). */
export function parseUserProfileResponse(response: { data?: unknown }) {
  const payload = parseApiData<Record<string, unknown>>(response);
  const user = (payload?.user ?? payload) as Record<string, unknown>;
  return user;
}

export function mapExpert(raw: any, type: 'trainer' | 'nutritionist') {
  const profile = raw?.profile || {};
  return {
    ...raw,
    id: String(raw?.id || raw?._id || ''),
    type,
    name: raw?.name || `${raw?.firstName || ''} ${raw?.lastName || ''}`.trim(),
    bio: profile.bio || raw.bio,
    specializations: profile.specializations || raw.specializations || [],
    yearsOfExperience: profile.yearsOfExperience ?? raw.yearsOfExperience ?? 0,
    averageRating: profile.averageRating ?? raw.averageRating ?? 0,
    totalRatings: profile.totalRatings ?? raw.totalRatings ?? 0,
    hourlyRate: profile.hourlyRate ?? profile.consultationFee ?? raw.hourlyRate,
  };
}

export function mapAppointment(raw: any) {
  const expert = raw?.expertId;
  const expertName =
    raw?.expertName ||
    (expert && typeof expert === 'object'
      ? `${expert.firstName || ''} ${expert.lastName || ''}`.trim()
      : 'Expert');

  return {
    ...raw,
    id: String(raw?.id || raw?._id || ''),
    expertName,
    durationUnit: raw?.durationUnit || 'minutes',
  };
}

export function normalizeProgressStats(raw: Record<string, unknown> = {}) {
  const stats = (raw.stats as Record<string, unknown>) || raw;
  const latestMeasurement = stats.latestMeasurement as { weight?: number } | undefined;

  return {
    ...stats,
    currentWeight:
      stats.currentWeight ??
      latestMeasurement?.weight ??
      null,
    totalWorkouts: stats.totalWorkouts ?? stats.workoutCount ?? 0,
    monthlyWorkouts: stats.monthlyWorkoutCount ?? stats.monthlyWorkouts ?? 0,
    averageCalories: stats.averageCalories ?? 0,
    nutritionCount: stats.nutritionCount ?? 0,
    measurementCount: stats.measurementCount ?? 0,
    milestoneCount: stats.milestoneCount ?? 0,
  };
}

export function mapTrainerClient(raw: any) {
  const plan = raw.activePlan;
  const progress =
    raw.progress ??
    (plan && raw.workoutLogsCount
      ? Math.min(100, Math.round((raw.workoutLogsCount / 8) * 100))
      : plan
        ? 0
        : null);

  return {
    ...raw,
    id: String(raw.id || raw.userId?._id || raw.userId || ''),
    name: raw.name || `${raw.userId?.firstName || ''} ${raw.userId?.lastName || ''}`.trim(),
    planTitle: raw.planTitle || plan?.title || 'Not assigned',
    progress: progress ?? 0,
    status: raw.status || (plan ? 'active' : 'pending'),
  };
}

function normalizeClientId(clientId: any): string {
  if (!clientId) return '';
  if (typeof clientId === 'string') return clientId;
  return String(clientId._id || clientId.id || '');
}

export function formatExpertRating(
  averageRating?: number | null,
  totalRatings?: number | null
): { display: string; subtitle: string } {
  const count = Number(totalRatings) || 0;
  if (count === 0) {
    return { display: '—', subtitle: 'No ratings yet' };
  }
  const avg = Number(averageRating);
  return {
    display: Number.isFinite(avg) ? avg.toFixed(1) : '—',
    subtitle: `${count} review${count === 1 ? '' : 's'} · out of 5`,
  };
}

export function mapPublicExpertListing(raw: any, type: 'trainer' | 'nutritionist') {
  const specializations = Array.isArray(raw?.specializations)
    ? raw.specializations
    : raw?.specialization
      ? [raw.specialization]
      : [];

  const years = Number(raw?.yearsOfExperience ?? 0);
  const rating = Number(raw?.averageRating ?? raw?.rating ?? 0);
  const totalRatings = Number(raw?.totalRatings ?? 0);
  const certifications = Array.isArray(raw?.certifications) ? raw.certifications : [];
  const certificationNames = certifications
    .map((item: any) => item?.name || item)
    .filter(Boolean);

  return {
    id: String(raw?.id || raw?._id || ''),
    type,
    name: `${raw?.firstName || ''} ${raw?.lastName || ''}`.trim() || raw?.name || 'Expert',
    bio: raw?.bio || '',
    specialization: specializations[0] || (type === 'trainer' ? 'Fitness Training' : 'Nutrition Counseling'),
    specializations,
    yearsOfExperience: years,
    experience:
      raw?.experience ||
      `${years} year${years === 1 ? '' : 's'} experience`,
    rating,
    totalRatings,
    hourlyRate: raw?.hourlyRate ?? null,
    certified: Boolean(raw?.certified) || certificationNames.length > 0,
    certificationNames,
    clients: Number(raw?.clients ?? 0),
    isVerified: Boolean(raw?.isVerified),
    profileLink: type === 'trainer' ? `/trainer/${raw?.id || raw?._id}` : `/nutritionist/${raw?.id || raw?._id}`,
  };
}

export function mapWorkoutPlan(raw: any) {
  const exercises = Array.isArray(raw?.exercises) ? raw.exercises : [];
  const clientId = normalizeClientId(raw?.clientId);
  return {
    ...raw,
    id: String(raw._id || raw.id || ''),
    clientId,
    clientName: raw.clientId
      ? `${raw.clientId.firstName || ''} ${raw.clientId.lastName || ''}`.trim()
      : 'Unassigned',
    exercises,
    exerciseCount: exercises.length,
  };
}

export function mapNutritionistClient(raw: any) {
  const plan = raw.activePlan;
  const compliance =
    raw.compliance ??
    (plan && raw.nutritionLogsCount
      ? Math.min(100, Math.round((raw.nutritionLogsCount / 28) * 100))
      : plan
        ? 0
        : null);

  return {
    ...raw,
    id: String(raw.id || raw.userId?._id || raw.userId || ''),
    name: raw.name || `${raw.userId?.firstName || ''} ${raw.userId?.lastName || ''}`.trim(),
    planTitle: raw.planTitle || plan?.title || 'Not assigned',
    compliance: compliance ?? 0,
    status: raw.status || (plan ? 'active' : 'pending'),
  };
}

export function mapDietPlan(raw: any) {
  const meals = Array.isArray(raw?.meals) ? raw.meals : [];
  const clientId = normalizeClientId(raw?.clientId);
  return {
    ...raw,
    id: String(raw._id || raw.id || ''),
    clientId,
    clientName: raw.clientId
      ? `${raw.clientId.firstName || ''} ${raw.clientId.lastName || ''}`.trim()
      : 'Unassigned',
    meals,
    mealCount: meals.length,
  };
}

function expertDisplayName(expert: any, fallback: string) {
  if (!expert) return fallback;
  if (typeof expert === 'object') {
    return `${expert.firstName || ''} ${expert.lastName || ''}`.trim() || fallback;
  }
  return fallback;
}

export function mapClientWorkoutPlan(raw: any) {
  const mapped = mapWorkoutPlan(raw);
  return {
    ...mapped,
    expertName: expertDisplayName(raw.trainerId, 'Your trainer'),
  };
}

export function mapClientDietPlan(raw: any) {
  const mapped = mapDietPlan(raw);
  return {
    ...mapped,
    expertName: expertDisplayName(raw.nutritionistId, 'Your nutritionist'),
  };
}

export function pickProfileUpdateFields(data: Record<string, unknown>) {
  const allowed = [
    'firstName',
    'lastName',
    'phone',
    'gender',
    'bio',
    'dateOfBirth',
    'age',
    'currentWeight',
    'currentHeight',
    'targetWeight',
    'yearsOfExperience',
    'specializations',
    'certifications',
    'hourlyRate',
    'consultationFee',
  ];

  return Object.fromEntries(
    allowed.filter((key) => data[key] !== undefined).map((key) => [key, data[key]])
  );
}
