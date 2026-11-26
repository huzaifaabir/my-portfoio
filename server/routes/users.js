
const router = require('express').Router();
const { getAuth } = require('firebase-admin/auth');
const crypto = require('crypto');
const User = require('../models/User');
const { requireRole, RANK } = require('../middleware/auth');
const { staffFields, str } = require('../utils/sanitize');
const { getFirebaseApp } = require('../config/firebase');
const HttpError = require('../utils/httpError');
const { withId, withIds } = require('../utils/serialize');

const ADMIN_LEVEL = ['superadmin', 'admin'];

// Roles the acting user is allowed to assign
function assignableRoles(actorRole) {
  if (actorRole === 'superadmin') return ['admin', 'editor'];
  if (actorRole === 'admin') return ['editor'];
  return [];
}

// Would removing / demoting / disabling this user leave zero active administrators?
async function isLastActiveAdmin(target) {
  if (!ADMIN_LEVEL.includes(target.role) || target.status !== 'active') return false;
  const count = await User.countDocuments({ role: { $in: ADMIN_LEVEL }, status: 'active' });
  return count <= 1;
}

function canManage(actor, target) {
  if (target.role === 'superadmin') return false;
  if (String(actor._id) === String(target._id)) return false;
  return RANK[actor.role] > RANK[target.role];
}

router.get('/', ...requireRole('admin'), async (req, res, next) => {
  try {
    const items = await User.find().sort({ createdAt: 1 }).select('-__v').lean();
    res.json({ items: withIds(items), assignableRoles: assignableRoles(req.user.role), currentUserId: String(req.user._id) });
  } catch (err) {
    next(err);
  }
});

// Creates the staff member. If the email has no Firebase account yet, one is created and a
// password-setup link is returned ONCE so the admin can share it with the new person.
router.post('/', ...requireRole('admin'), async (req, res, next) => {
  try {
    const { email, name } = staffFields(req.body || {});
    const role = req.body?.role;
    if (!assignableRoles(req.user.role).includes(role)) {
      throw new HttpError(403, 'You cannot give this role.');
    }
    if (await User.exists({ email })) throw new HttpError(409, 'This email already has staff access.');

    const auth = getAuth(getFirebaseApp());
    let fbUser;
    let resetLink = null;
    try {
      fbUser = await auth.getUserByEmail(email);
    } catch (err) {
      if (err.code !== 'auth/user-not-found') throw err;
      fbUser = await auth.createUser({
        email,
        displayName: name || undefined,
        password: crypto.randomBytes(18).toString('base64url'),
      });
      resetLink = await auth.generatePasswordResetLink(email);
    }

    if (await User.exists({ firebaseUid: fbUser.uid })) throw new HttpError(409, 'This account already has staff access.');

    const user = await User.create({
      firebaseUid: fbUser.uid,
      email,
      name,
      role,
      status: 'active',
      invitedBy: req.user.email,
    });
    res.status(201).json({ user: withId(user), resetLink });
  } catch (err) {
    next(err);
  }
});

// Change role / status / name
router.patch('/:id', ...requireRole('admin'), async (req, res, next) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) throw new HttpError(404, 'User not found.');
    if (String(target._id) === String(req.user._id)) throw new HttpError(403, 'You cannot change your own access.');
    if (!canManage(req.user, target)) throw new HttpError(403, 'You cannot manage this account.');

    const body = req.body || {};
    const role = body.role !== undefined ? body.role : target.role;
    const status = body.status !== undefined ? body.status : target.status;
    if (!['active', 'disabled'].includes(status)) throw new HttpError(400, 'Invalid status.');

    if (role !== target.role && !assignableRoles(req.user.role).includes(role)) {
      throw new HttpError(403, 'You cannot give this role.');
    }
    const losingAdminAccess = (role !== target.role && !ADMIN_LEVEL.includes(role)) || status === 'disabled';
    if (losingAdminAccess && (await isLastActiveAdmin(target))) {
      throw new HttpError(400, 'This is the last active administrator and cannot be removed or demoted.');
    }

    target.role = role;
    target.status = status;
    if (body.name !== undefined) target.name = str(body.name, 120) || target.name;
    await target.save();
    res.json(withId(target));
  } catch (err) {
    next(err);
  }
});

// Removes staff access. The Firebase login is kept; the person just loses admin access.
router.delete('/:id', ...requireRole('admin'), async (req, res, next) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) throw new HttpError(404, 'User not found.');
    if (!canManage(req.user, target)) throw new HttpError(403, 'You cannot remove this account.');
    if (await isLastActiveAdmin(target)) {
      throw new HttpError(400, 'This is the last active administrator and cannot be removed.');
    }
    await target.deleteOne();
    res.json({ message: 'Staff access removed.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
module.exports.isLastActiveAdmin = isLastActiveAdmin;
module.exports.assignableRoles = assignableRoles;
module.exports.canManage = canManage;
