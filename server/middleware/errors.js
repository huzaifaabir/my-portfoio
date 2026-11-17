const multer = require('multer');

function notFound(req, res) {
  res.status(404).json({ message: 'This API route does not exist.' });
}

// Central error handler. Express 5 forwards rejected promises here automatically.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'The image is larger than 5 MB.' : 'The file could not be uploaded.';
    return res.status(400).json({ message });
  }
  if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'The request body is not valid JSON.' });
  if (err.name === 'ValidationError') {
    const first = Object.values(err.errors || {})[0];
    return res.status(400).json({ message: first?.message || 'Some information is invalid.' });
  }
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid ID.' });
  if (err.code === 11000) return res.status(409).json({ message: 'This record already exists.' });
  if (err.status && err.status < 500) return res.status(err.status).json({ message: err.message });
  if (err.code === 'FIREBASE_CONFIG') return res.status(503).json({ message: 'Server authentication is not configured yet.' });
  console.error('API error:', err);
  return res.status(500).json({ message: 'Something went wrong on the server. Please try again.' });
}

module.exports = { notFound, errorHandler };
