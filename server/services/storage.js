
const crypto = require('crypto');
const { detectImageType } = require('../utils/fileType');
const HttpError = require('../utils/httpError');

const ALLOWED_FOLDERS = new Set(['profile', 'projects']);

let imageKitClientPromise;

async function getImageKit() {
  const privateKey = (process.env.IMAGEKIT_PRIVATE_KEY || '').trim();

  if (!privateKey) {
    throw new HttpError(503, 'ImageKit Private Key is not configured.');
  }

  if (!imageKitClientPromise) {
    imageKitClientPromise = import('@imagekit/nodejs').then(
      ({ default: ImageKit }) => new ImageKit({ privateKey })
    );
  }

  return imageKitClientPromise;
}

function isImageKitConfigured() {
  return Boolean(
    (process.env.IMAGEKIT_PRIVATE_KEY || '').trim() &&
    (process.env.IMAGEKIT_URL_ENDPOINT || '').trim()
  );
}

async function uploadImage(buffer, folder) {
  if (!ALLOWED_FOLDERS.has(folder)) {
    throw new HttpError(400, 'Invalid upload folder.');
  }

  const type = detectImageType(buffer);

  if (!type) {
    throw new HttpError(400, 'Only JPG, PNG, WEBP or GIF images are allowed.');
  }

  const imageKit = await getImageKit();

  const fileName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${type.ext}`;

  const { toFile } = await import('@imagekit/nodejs');

  const file = await toFile(buffer, fileName);

  const uploaded = await imageKit.files.upload({
    file,
    fileName,
    folder: `/portfolio/${folder}`,
    useUniqueFileName: true,
    isPrivateFile: false,
  });

  if (!uploaded.url || !uploaded.fileId) {
    throw new HttpError(502, 'ImageKit did not return a valid image URL.');
  }

  return {
    url: uploaded.url,
    path: uploaded.fileId,
  };
}

async function deleteImage(fileId) {
  if (!fileId || typeof fileId !== 'string') return;

  const imageKit = await getImageKit();

  try {
    await imageKit.files.delete(fileId);
  } catch (err) {
    // Do not silently ignore an unsuccessful deletion.
    if (err.status !== 404) {
      throw err;
    }
  }
}

module.exports = {
  uploadImage,
  deleteImage,
  isImageKitConfigured,
};
