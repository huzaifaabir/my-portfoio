const router = require('express').Router();
const Service = require('../models/Service');
const { requireRole } = require('../middleware/auth');
const HttpError = require('../utils/httpError');
const { withId } = require('../utils/serialize');

function clean(body = {}) {
  const title = typeof body.title === 'string' ? body.title.trim().slice(0, 120) : '';
  if (!title) throw new HttpError(400, 'Service title is required.');
  const startingPrice = body.startingPrice === '' || body.startingPrice === null || body.startingPrice === undefined
    ? null : Number(body.startingPrice);
  if (startingPrice !== null && (!Number.isFinite(startingPrice) || startingPrice < 0 || startingPrice > 10000000)) {
    throw new HttpError(400, 'Enter a valid starting price.');
  }
  const packages = Array.isArray(body.packages) ? body.packages.slice(0, 20).map((item) => {
    const name = String(item?.name || '').trim().slice(0, 80);
    const price = Number(item?.price);
    if (!name || !Number.isFinite(price) || price < 0 || price > 10000000) {
      throw new HttpError(400, 'Each package needs a name and valid price.');
    }
    return { name, price, description: String(item?.description || '').trim().slice(0, 500) };
  }) : [];
  return {
    title,
    description: String(body.description || '').trim().slice(0, 1000),
    startingPrice,
    packages,
    deliveryTime: String(body.deliveryTime || '').trim().slice(0, 100),
    inclusions: Array.isArray(body.inclusions) ? body.inclusions.slice(0, 20).map((x) => String(x).trim().slice(0, 160)).filter(Boolean) : [],
    isActive: typeof body.isActive === 'boolean' ? body.isActive : true,
    featured: Boolean(body.featured),
    order: Number.isFinite(Number(body.order)) ? Math.max(0, Math.min(9999, Math.round(Number(body.order)))) : 0,
  };
}

const DEFAULT_SERVICES = [
  { title: 'Logo Design', description: 'A distinctive logo crafted to represent your brand.', startingPrice: 2000, order: 0 },
  { title: 'Social Media Design', description: 'Professional social media creatives for your brand.', packages: [{ name: '3 Designs', price: 1000 }, { name: '5 Designs', price: 1500 }], order: 1 },
  { title: 'A4 Flyer Design', description: 'A clean, impactful A4 flyer for promotions and announcements.', startingPrice: 500, order: 2 },
  { title: 'Full Branding', description: 'A consistent visual identity for your business.', order: 3 },
  { title: 'Business Card Design', description: 'Professional business card design.', order: 4 },
  { title: 'Brochure Design', description: 'Informative brochure layouts for your brand.', order: 5 },
  { title: 'Web Banner Design', description: 'Digital banners for websites and campaigns.', order: 6 },
  { title: 'YouTube Thumbnail Design', description: 'Attention-grabbing thumbnails for video content.', order: 7 },
  { title: 'Poster Design', description: 'Creative posters for events, campaigns and promotions.', order: 8 },
  { title: 'Video Editing', description: 'Professional editing for social and promotional videos.', order: 9 },
  { title: 'Motion Graphics', description: 'Animated visuals and motion design.', order: 10 },
  { title: 'Photo Editing', description: 'Professional photo retouching and enhancement.', order: 11 },
].map((item) => ({ isActive: true, featured: false, ...item }));

async function ensureDefaultServices() {
  if (!(await Service.exists())) {
    await Service.insertMany(DEFAULT_SERVICES);
  }
}

// Public active service catalogue
router.get('/', async (req, res, next) => {
  try {
    await ensureDefaultServices();
    const items = await Service.find({ isActive: true }).sort({ order: 1, createdAt: 1 }).lean();
    res.json({ items: items.map(withId) });
  } catch (err) { next(err); }
});

// Editor+ service management
router.get('/manage', ...requireRole('editor'), async (req, res, next) => {
  try {
    await ensureDefaultServices();
    const items = await Service.find().sort({ order: 1, createdAt: 1 }).lean();
    res.json({ items: items.map(withId) });
  } catch (err) { next(err); }
});

router.post('/', ...requireRole('editor'), async (req, res, next) => {
  try {
    const item = await Service.create(clean(req.body));
    res.status(201).json(withId(item));
  } catch (err) { next(err); }
});

router.put('/:id', ...requireRole('editor'), async (req, res, next) => {
  try {
    const item = await Service.findById(req.params.id);
    if (!item) throw new HttpError(404, 'Service not found.');
    Object.assign(item, clean(req.body));
    await item.save();
    res.json(withId(item));
  } catch (err) { next(err); }
});

router.delete('/:id', ...requireRole('editor'), async (req, res, next) => {
  try {
    const item = await Service.findById(req.params.id);
    if (!item) throw new HttpError(404, 'Service not found.');
    await item.deleteOne();
    res.json({ message: 'Service deleted.' });
  } catch (err) { next(err); }
});

module.exports = router;
