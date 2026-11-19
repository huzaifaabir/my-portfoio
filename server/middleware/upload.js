
const multer = require('multer');

// Images only, maximum 5 MB, one file per request.
const imageUpload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },

  fileFilter: (req, file, cb) => {
    const allowed = /^image\/(jpeg|png|webp|gif)$/i.test(
      file.mimetype
    );

    if (!allowed) {
      const error = new Error(
        'Only JPG, PNG, WEBP or GIF images are allowed.'
      );

      error.status = 400;
      return cb(error);
    }

    return cb(null, true);
  },
}).single('file');

module.exports = { imageUpload };
