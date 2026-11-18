
const router = require('express').Router();
const Profile = require('../models/Profile');
const { requireAuth, hasRole } = require('../middleware/auth');
const { sections, TOP_LEVEL_SECTIONS } = require('../utils/sanitize');
const { deleteImage } = require('../services/storage');
const { ensureProfile } = require('../services/ensureProfile');
const HttpError = require('../utils/httpError');

const LIST_SECTIONS = new Set([
  'skills',
  'experience',
  'services',
  'socials',
]);

// Minimum role per section.
const MIN_ROLE = {
  hero: 'editor',
  about: 'editor',
  skills: 'editor',
  experience: 'editor',
  services: 'editor',
  contact: 'admin',
  socials: 'admin',
  site: 'admin',
};

const CLEAN = '-_id -__v -key -updatedBy';

// Checks login + the section's minimum role.
function sectionGuard(req, res, next) {
  const min = MIN_ROLE[req.params.section];

  if (!min) {
    return next(new HttpError(404, 'Unknown profile section.'));
  }

  return requireAuth(req, res, (err) => {
    if (err) return next(err);
    if (res.headersSent) return undefined;

    if (!hasRole(req.user.role, min)) {
      return res.status(403).json({
        message: 'You do not have permission to edit this section.',
      });
    }

    return next();
  });
}

// Public: the full portfolio profile.
router.get('/', async (req, res, next) => {
  try {
    await ensureProfile();

    const profile = await Profile.findOne({ key: 'main' })
      .select(CLEAN)
      .lean();

    res.json(profile);
  } catch (err) {
    next(err);
  }
});

// Staff: update one section of the profile.
router.put('/:section', sectionGuard, async (req, res, next) => {
  try {
    const section = req.params.section;
    let input = req.body || {};

    if (LIST_SECTIONS.has(section)) {
      input = Array.isArray(req.body) ? req.body : req.body?.items;

      if (!Array.isArray(input)) {
        throw new HttpError(400, 'Expected a list of items.');
      }
    }

    if (section === 'site') {
      input = {
        ...input,
        // An omitted or empty logo is valid.
        logo: input.logo || { url: '', path: '' },
      };
    }

    const data = sections[section](input);

    await ensureProfile();

    const before = await Profile.findOne({ key: 'main' }).lean();

    const update = TOP_LEVEL_SECTIONS.has(section)
      ? { ...data }
      : { [section]: data };

    update.updatedBy = req.user.email;

    const saved = await Profile.findOneAndUpdate(
      { key: 'main' },
      { $set: update },
      { new: true, runValidators: true }
    )
      .select(CLEAN)
      .lean();

    // Delete the replaced hero image only after the new value is saved.
    if (
      section === 'hero' &&
      before?.hero?.image?.path &&
      before.hero.image.path !== data.image.path
    ) {
      try {
        await deleteImage(before.hero.image.path);
      } catch (deleteError) {
        console.error(
          'Could not delete previous hero image:',
          deleteError
        );
      }
    }

    // Delete the replaced website logo only after the new value is saved.
    if (
      section === 'site' &&
      before?.logo?.path &&
      before.logo.path !== data.logo.path
    ) {
      try {
        await deleteImage(before.logo.path);
      } catch (deleteError) {
        console.error(
          'Could not delete previous website logo:',
          deleteError
        );
      }
    }

    res.json(saved);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
