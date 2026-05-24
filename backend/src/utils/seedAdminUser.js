/**
 * Ensures a default admin account exists on server startup.
 */
const User = require('../models/User');
const { USER_ROLES, ACCOUNT_STATUS } = require('../config/constants');

const DEFAULT_ADMIN = {
  email: (process.env.ADMIN_EMAIL || 'admin@fitorbit.com').toLowerCase(),
  password: process.env.ADMIN_PASSWORD || 'gohar123@',
  firstName: process.env.ADMIN_FIRST_NAME || 'FitOrbit',
  lastName: process.env.ADMIN_LAST_NAME || 'Admin',
};

const seedAdminUser = async () => {
  try {
    const existing = await User.findByEmail(DEFAULT_ADMIN.email);

    if (existing) {
      if (existing.role !== USER_ROLES.ADMIN) {
        existing.role = USER_ROLES.ADMIN;
        existing.accountStatus = ACCOUNT_STATUS.ACTIVE;
        existing.isEmailVerified = true;
        await existing.save();
        console.log(`✅ Promoted existing user to admin: ${DEFAULT_ADMIN.email}`);
      } else {
        console.log(`ℹ️  Admin user already exists (${DEFAULT_ADMIN.email}) — skipping seed`);
      }
      return;
    }

    await User.create({
      firstName: DEFAULT_ADMIN.firstName,
      lastName: DEFAULT_ADMIN.lastName,
      email: DEFAULT_ADMIN.email,
      password: DEFAULT_ADMIN.password,
      role: USER_ROLES.ADMIN,
      accountStatus: ACCOUNT_STATUS.ACTIVE,
      isEmailVerified: true,
    });

    console.log(`✅ Default admin user created (${DEFAULT_ADMIN.email})`);
  } catch (error) {
    console.error('❌ Failed to seed admin user:', error.message);
  }
};

module.exports = seedAdminUser;
