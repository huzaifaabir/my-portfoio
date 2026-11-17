// Firebase Storage helpers. Files are stored in the bucket and served through a
// Firebase download-token URL, so they stay public-readable while client writes stay blocked.
const crypto = require('crypto');
const { getStorage } = require('firebase-admin/storage');
const { getFirebaseApp, isFirebaseConfigured } = require('../config/firebase');
const { detectImageType } = require('../utils/fileType');
const HttpError = require('../utils/httpError');

const ALLOWED_FOLDERS = new Set(['profile', 'projects']);

function bucket() {
  if (!isFirebaseConfigured()) {
    throw new HttpError(503, 'File storage is not configured yet. Set FIREBASE_STORAGE_BUCKET and Firebase credentials in server/.env');
  }
  return getStorage(getFirebaseApp()).bucket();
}

// Validates the real file type (magic bytes), stores it and returns { url, path }.
async function uploadImage(buffer, folder) {
  if (!ALLOWED_FOLDERS.has(folder)) throw new HttpError(400, 'Invalid upload folder.');
  const type = detectImageType(buffer);
  if (!type) throw new HttpError(400, 'Only JPG, PNG, WEBP or GIF images are allowed.');

  const path = `portfolio/${folder}/${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${type.ext}`;
  const token = crypto.randomUUID();
  const b = bucket();

  await b.file(path).save(buffer, {
    resumable: false,
    metadata: {
      contentType: type.mime,
      cacheControl: 'public, max-age=31536000',
      metadata: { firebaseStorageDownloadTokens: token },
    },
  });

  const url = `https://firebasestorage.googleapis.com/v0/b/${b.name}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
  return { url, path };
}

// Best-effort delete. Never throws, so a storage hiccup cannot break a successful save.
async function deleteImage(path) {
  if (!path || !path.startsWith('portfolio/') || path.includes('..')) return;
  try {
    await bucket().file(path).delete({ ignoreNotFound: true });
  } catch (err) {
    console.warn('Could not delete storage file:', path, err.message);
  }
}

module.exports = { uploadImage, deleteImage };
