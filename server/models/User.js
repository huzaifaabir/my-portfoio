const mongoose = require('mongoose');

const ROLES = ['superadmin', 'admin', 'editor'];

const userSchema = new mongoose.Schema(
  {
    firebaseUid: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 160 },
    name: { type: String, trim: true, maxlength: 120, default: '' },
    role: { type: String, enum: ROLES, required: true, default: 'editor', index: true },
    status: { type: String, enum: ['active', 'disabled'], default: 'active', index: true },
    invitedBy: { type: String, default: '' },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
module.exports.ROLES = ROLES;
