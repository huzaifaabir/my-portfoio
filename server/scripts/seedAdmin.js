// Manual setup: npm run seed:admin
// Connects to MongoDB and makes sure the SUPER_ADMIN_EMAIL account exists with the Super Admin role.
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const { ensureSuperAdmin } = require('../services/ensureSuperAdmin');
const { ensureProfile } = require('../services/ensureProfile');

(async () => {
  try {
    await connectDB();
    await ensureProfile();
    const user = await ensureSuperAdmin();
    if (!user) {
      console.log('Super Admin was not created. Read the warning above.');
      process.exitCode = 1;
    } else {
      console.log('Done. Log in at /admin/login with this email.');
    }
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
})();
