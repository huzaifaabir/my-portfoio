const router = require('express').Router();
const Project = require('../models/Project');
const { requireRole } = require('../middleware/auth');
const { projectFields } = require('../utils/sanitize');
const { deleteImage } = require('../services/storage');
const HttpError = require('../utils/httpError');
const { withId, withIds } = require('../utils/serialize');

const PUBLIC_FIELDS = '-__v -createdBy';
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Public: published projects only, optional ?category= and ?featured=true
router.get('/', async (req, res, next) => {
  try {
    const filter = { published: true };
    if (req.query.category) filter.category = { $regex: `^${escapeRegex(String(req.query.category).slice(0, 60))}$`, $options: 'i' };
    if (req.query.featured === 'true') filter.featured = true;
    const items = await Project.find(filter).sort({ order: 1, createdAt: -1 }).select(PUBLIC_FIELDS).lean();
    res.json({ items: withIds(items) });
  } catch (err) {
    next(err);
  }
});

// Staff: every project, including drafts (published: false)
router.get('/manage', ...requireRole('editor'), async (req, res, next) => {
  try {
    const items = await Project.find().sort({ order: 1, createdAt: -1 }).select('-__v').lean();
    res.json({ items: withIds(items) });
  } catch (err) {
    next(err);
  }
});

// Public: one published project
router.get('/:id', async (req, res, next) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, published: true }).select(PUBLIC_FIELDS).lean();
    if (!project) throw new HttpError(404, 'This project was not found.');
    res.json(withId(project));
  } catch (err) {
    next(err);
  }
});

router.post('/', ...requireRole('editor'), async (req, res, next) => {
  try {
    const data = projectFields(req.body || {});
    const project = await Project.create({ ...data, createdBy: req.user.email });
    res.status(201).json(withId(project));
  } catch (err) {
    next(err);
  }
});

router.put('/:id', ...requireRole('editor'), async (req, res, next) => {
  try {
    const data = projectFields(req.body || {});
    const before = await Project.findById(req.params.id).lean();
    if (!before) throw new HttpError(404, 'This project was not found.');

    const updated = await Project.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true }).lean();
    if (before.image?.path && before.image.path !== data.image.path) deleteImage(before.image.path);
    res.json(withId(updated));
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', ...requireRole('editor'), async (req, res, next) => {
  try {
    const removed = await Project.findByIdAndDelete(req.params.id).lean();
    if (!removed) throw new HttpError(404, 'This project was not found.');
    if (removed.image?.path) deleteImage(removed.image.path);
    res.json({ message: 'Project deleted.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
