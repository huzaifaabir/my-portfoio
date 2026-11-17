const Profile = require('../models/Profile');
const defaults = require('../utils/defaults');

// Creates the single profile document with starter content if it does not exist yet.
async function ensureProfile() {
  await Profile.updateOne({ key: 'main' }, { $setOnInsert: { key: 'main', ...defaults } }, { upsert: true });
}

module.exports = { ensureProfile };
