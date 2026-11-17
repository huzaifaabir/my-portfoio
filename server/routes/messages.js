const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const Message = require('../models/Message');
const { requireRole } = require('../middleware/auth');
const { messageFields } = require('../utils/sanitize');
const HttpError = require('../utils/httpError');
const { withId, withIds } = require('../utils/serialize');

// Public contact form: at most 5 submissions per IP every 15 minutes
const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many messages from this device. Please try again later.' },
});

router.post('/', submitLimiter, async (req, res, next) => {
  try {
    // Honeypot: real visitors never fill this hidden field. Bots get a fake success.
    if (req.body?.website) return res.status(201).json({ message: 'Thank you! Your message has been sent.' });
    const data = messageFields(req.body || {});
    await Message.create(data);
    res.status(201).json({ message: 'Thank you! Your message has been sent.' });
  } catch (err) {
    next(err);
  }
});

// Admin and above: inbox
router.get('/', ...requireRole('admin'), async (req, res, next) => {
  try {
    const filter = req.query.filter === 'unread' ? { read: false } : {};
    const [items, unread] = await Promise.all([
      Message.find(filter).sort({ createdAt: -1 }).limit(200).lean(),
      Message.countDocuments({ read: false }),
    ]);
    res.json({ items: withIds(items), unread });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', ...requireRole('admin'), async (req, res, next) => {
  try {
    const read = req.body?.read === true || req.body?.read === false ? req.body.read : undefined;
    if (read === undefined) throw new HttpError(400, 'Nothing to update.');
    const updated = await Message.findByIdAndUpdate(req.params.id, { read }, { new: true }).lean();
    if (!updated) throw new HttpError(404, 'Message not found.');
    res.json(withId(updated));
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', ...requireRole('admin'), async (req, res, next) => {
  try {
    const removed = await Message.findByIdAndDelete(req.params.id);
    if (!removed) throw new HttpError(404, 'Message not found.');
    res.json({ message: 'Message deleted.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
