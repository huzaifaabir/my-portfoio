
const router = require('express').Router();

const { requireRole } = require('../middleware/auth');
const {
  imageUpload,
  multipleImageUpload,
} = require('../middleware/upload');
const {
  uploadImage,
  deleteImage,
} = require('../services/storage');
const HttpError = require('../utils/httpError');

// Upload a single project/profile image.
router.post(
  '/',
  ...requireRole('editor'),
  (req, res, next) => {
    imageUpload(req, res, async (err) => {
      if (err) {
        return next(err);
      }

      try {
        if (!req.file) {
          throw new HttpError(400, 'Please choose an image file.');
        }

        const folder = String(req.query.folder || '').trim();

        if (!['profile', 'projects'].includes(folder)) {
          throw new HttpError(400, 'Invalid upload folder.');
        }

        const uploaded = await uploadImage(
          req.file.buffer,
          folder
        );

        if (!uploaded?.url || !uploaded?.path) {
          throw new HttpError(
            502,
            'ImageKit did not return valid image information.'
          );
        }

        return res.status(201).json(uploaded);
      } catch (error) {
        console.error('Image upload error:', {
          message: error.message,
          status: error.status,
          response: error.response?.data,
        });

        return next(error);
      }
    });
  }
);

// Upload multiple Brand Partner logos in one request.
// Maximum: 10 images, 5 MB per image.
router.post(
  '/batch',
  ...requireRole('editor'),
  (req, res, next) => {
    multipleImageUpload(req, res, async (err) => {
      if (err) {
        return next(err);
      }

      const uploadedImages = [];

      try {
        if (!Array.isArray(req.files) || req.files.length === 0) {
          throw new HttpError(400, 'Please choose at least one image.');
        }

        for (const file of req.files) {
          const uploaded = await uploadImage(
            file.buffer,
            'brands'
          );

          if (!uploaded?.url || !uploaded?.path) {
            throw new HttpError(
              502,
              'ImageKit did not return valid image information.'
            );
          }

          uploadedImages.push(uploaded);
        }

        return res.status(201).json({
          message: 'Brand logos uploaded successfully.',
          items: uploadedImages,
        });
      } catch (error) {
        // Remove already uploaded files if a later upload fails.
        await Promise.allSettled(
          uploadedImages.map((item) => deleteImage(item.path))
        );

        console.error('Batch image upload error:', {
          message: error.message,
          status: error.status,
          response: error.response?.data,
        });

        return next(error);
      }
    });
  }
);

// Delete an uploaded ImageKit image.
router.delete(
  '/',
  ...requireRole('editor'),
  async (req, res, next) => {
    try {
      const fileId =
        typeof req.body?.path === 'string'
          ? req.body.path.trim()
          : '';

      if (!fileId || fileId.length > 300) {
        throw new HttpError(400, 'Invalid ImageKit file ID.');
      }

      await deleteImage(fileId);

      return res.json({
        message: 'Image removed successfully.',
      });
    } catch (error) {
      console.error('Image deletion error:', error.message);
      return next(error);
    }
  }
);

module.exports = router;
