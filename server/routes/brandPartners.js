
const router = require('express').Router();
const BrandPartner = require('../models/BrandPartner');
const { requireRole } = require('../middleware/auth');
const HttpError = require('../utils/httpError');
const { image, str } = require('../utils/sanitize');
const { withId } = require('../utils/serialize');

function validateWebsite(value) {
  const website = str(value, 600);

  if (!website) return '';

  try {
    const url = new URL(website);

    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Invalid protocol');
    }

    return website;
  } catch {
    throw new HttpError(400, 'Please enter a valid website URL.');
  }
}

function validatePartner(body = {}) {
  const name = str(body.name, 120);

  if (!name) {
    throw new HttpError(400, 'Brand name is required.');
  }

  const logo = image(body.logo);

  if (!logo.url) {
    throw new HttpError(400, 'Brand logo is required.');
  }

  return {
    name,
    logo,
    website: validateWebsite(body.website),
    isActive: typeof body.isActive === 'boolean'
      ? body.isActive
      : true,
    order: Number.isFinite(Number(body.order))
      ? Math.max(0, Math.min(9999, Math.round(Number(body.order))))
      : 0,
  };
}

// Public: active partners only
router.get('/', async (req, res, next) => {
  try {
    const items = await BrandPartner.find({ isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .lean();

    res.json({ items: items.map(withId) });
  } catch (err) {
    next(err);
  }
});

// Staff: all partners
router.get('/manage', ...requireRole('editor'), async (req, res, next) => {
  try {
    const items = await BrandPartner.find()
      .sort({ order: 1, createdAt: 1 })
      .lean();

    res.json({ items: items.map(withId) });
  } catch (err) {
    next(err);
  }
});

// Create
router.post('/', ...requireRole('editor'), async (req, res, next) => {
  try {
    const partner = await BrandPartner.create(
      validatePartner(req.body)
    );

    res.status(201).json(withId(partner));
  } catch (err) {
    next(err);
  }
});

// Update
router.put('/:id', ...requireRole('editor'), async (req, res, next) => {
  try {
    const partner = await BrandPartner.findById(req.params.id);

    if (!partner) {
      throw new HttpError(404, 'Brand partner not found.');
    }

    Object.assign(partner, validatePartner(req.body));

    await partner.save();

    res.json(withId(partner));
  } catch (err) {
    next(err);
  }
});

// Delete
router.delete('/:id', ...requireRole('editor'), async (req, res, next) => {
  try {
    const partner = await BrandPartner.findById(req.params.id);

    if (!partner) {
      throw new HttpError(404, 'Brand partner not found.');
    }

    await partner.deleteOne();

    res.json({ message: 'Brand partner deleted.' });
  } catch (err) {
    next(err);
  }
});

// Reorder
router.patch('/reorder', ...requireRole('editor'), async (req, res, next) => {
  try {
    const items = req.body?.items;

    if (!Array.isArray(items) || items.length > 200) {
      throw new HttpError(400, 'Invalid reorder data.');
    }

    const operations = items.map((item, index) => ({
      updateOne: {
        filter: { _id: item.id },
        update: { $set: { order: index } },
      },
    }));

    if (operations.length) {
      await BrandPartner.bulkWrite(operations);
    }

    res.json({ message: 'Brand order updated.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
