const router = require('express').Router();
const Project = require('../models/Project');
const Message = require('../models/Message');
const User = require('../models/User');
const { requireRole } = require('../middleware/auth');

// Dashboard numbers for editor and above
router.get('/stats', ...requireRole('editor'), async (req, res, next) => {
  try {
    const [projects, published, unread, messages, staff, recentMessages] = await Promise.all([
      Project.countDocuments(),
      Project.countDocuments({ published: true }),
      Message.countDocuments({ read: false }),
      Message.countDocuments(),
      User.countDocuments({ status: 'active' }),
      Message.find().sort({ createdAt: -1 }).limit(5).select('name subject createdAt read').lean(),
    ]);
    res.json({ projects, published, drafts: projects - published, unread, messages, staff, recentMessages });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
