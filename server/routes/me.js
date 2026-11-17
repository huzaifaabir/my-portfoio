const router = require('express').Router();
const { requireAuth, hasRole } = require('../middleware/auth');
const { str } = require('../utils/sanitize');

// What the logged-in staff member is and is allowed to do. The client uses this only for showing menus;
// every API route still enforces permissions on the server.
function describe(user) {
  return {
    id: String(user._id),
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    permissions: {
      manageContent: hasRole(user.role, 'editor'),
      manageSettings: hasRole(user.role, 'admin'),
      manageMessages: hasRole(user.role, 'admin'),
      manageUsers: hasRole(user.role, 'admin'),
      manageAdmins: user.role === 'superadmin',
    },
  };
}

router.get('/', requireAuth, (req, res) => {
  res.json(describe(req.user));
});

router.put('/', requireAuth, async (req, res, next) => {
  try {
    const name = str(req.body?.name, 120);
    if (name.length < 2) return res.status(400).json({ message: 'Please enter your name (at least 2 characters).' });
    req.user.name = name;
    await req.user.save();
    res.json(describe(req.user));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
