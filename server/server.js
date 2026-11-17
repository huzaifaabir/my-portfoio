const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = require('./app');
const { connectDB } = require('./config/db');
const { ensureSuperAdmin } = require('./services/ensureSuperAdmin');
const { ensureProfile } = require('./services/ensureProfile');

const PORT = Number(process.env.PORT) || 5000;

async function start() {
  try {
    await connectDB();
    console.log('MongoDB connected.');
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }

  try {
    await ensureProfile();
    await ensureSuperAdmin();
  } catch (err) {
    // Non-fatal: the API still starts so you can read the error in /api/health and fix credentials
    console.error('Startup setup warning:', err.message);
  }

  app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
}

start();
