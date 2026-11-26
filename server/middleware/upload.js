
const multer = require('multer');

const allowedImageTypes = /^image\/(jpeg|png|webp|gif)$/i;

function imageFileFilter(req, file, cb) {
  if (!allowedImageTypes.test(file.mimetype)) {
    const error = new Error(
      'Only JPG, PNG, WEBP or GIF images are allowed.'
    );

    error.status = 400;
    return cb(error);
  }

  return cb(null, true);
}

const storage = multer.memoryStorage();

// Existing single-image uploader.
// Keep this for profile and project uploads.
const imageUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: imageFileFilter,
}).single('file');

// Multiple-image uploader for Brand Partners.
const multipleImageUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 10,
  },
  fileFilter: imageFileFilter,
}).array('files', 10);

module.exports = {
  imageUpload,
  multipleImageUpload,
};
