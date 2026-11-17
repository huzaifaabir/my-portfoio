const multer = require('multer');

// Images only, 5 MB max, one file. Kept in memory and sent straight to Firebase Storage.
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    const ok = /^image\/(jpeg|png|webp|gif)$/.test(file.mimetype);
    cb(ok ? null : Object.assign(new Error('Only JPG, PNG, WEBP or GIF images are allowed.'), { status: 400 }), ok);
  },
}).single('file');

module.exports = { imageUpload };
