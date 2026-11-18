
const router = require('express').Router();
const { requireRole } = require('../middleware/auth');
const { imageUpload } = require('../middleware/upload');
const { uploadImage, deleteImage } = require('../services/storage');
const HttpError = require('../utils/httpError');

router.post('/', ...requireRole('editor'), (req, res, next) => {
  imageUpload(req, res, async (err) => {
    if (err) return next(err);

    try {
      if (!req.file) {
        throw new HttpError(400, 'Please choose an image file.');
      }

      const folder = String(req.query.folder || '');
      const uploaded = await uploadImage(req.file.buffer, folder);

      res.status(201).json(uploaded);
    } catch (error) {
      next(error);
    }
  });
});

router.delete('/', ...requireRole('editor'), async (req, res, next) => {
  try {
    const fileId =
      typeof req.body?.path === 'string' ? req.body.path.trim() : '';

    if (!fileId || fileId.length > 300) {
      throw new HttpError(400, 'Invalid ImageKit file ID.');
    }

    await deleteImage(fileId);

    res.json({ message: 'Image removed successfully.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
