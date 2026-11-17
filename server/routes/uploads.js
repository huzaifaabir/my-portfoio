const router = require('express').Router();
const { requireRole } = require('../middleware/auth');
const { imageUpload } = require('../middleware/upload');
const { uploadImage, deleteImage } = require('../services/storage');
const HttpError = require('../utils/httpError');

// Editor and above: upload one image. Returns { url, path } to store with the content.
router.post('/', ...requireRole('editor'), (req, res, next) => {
  imageUpload(req, res, async (err) => {
    if (err) return next(err);
    try {
      if (!req.file) throw new HttpError(400, 'Please choose an image file.');
      const folder = String(req.query.folder || '');
      const { url, path } = await uploadImage(req.file.buffer, folder);
      res.status(201).json({ url, path });
    } catch (e) {
      next(e);
    }
  });
});

// Editor and above: remove an upload that was never saved (e.g. the user removed it before saving)
router.delete('/', ...requireRole('editor'), async (req, res, next) => {
  try {
    const path = typeof req.body?.path === 'string' ? req.body.path : '';
    if (!path.startsWith('portfolio/') || path.includes('..')) throw new HttpError(400, 'Invalid file path.');
    await deleteImage(path);
    res.json({ message: 'File removed.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
