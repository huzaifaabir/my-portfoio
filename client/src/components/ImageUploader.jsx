
import { useEffect, useRef, useState } from 'react';
import { staffApi } from '../lib/services.js';
import { useToast } from '../context/ToastContext.jsx';
import { errorMessage } from '../lib/format.js';

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const CROP_SIZE = 320;

export default function ImageUploader({
  value,
  onChange,
  folder,
  label = 'Image',
  aspect = 'aspect-video',
  rounded = 'rounded-2xl',
  help,
}) {
  const inputRef = useRef(null);
  const dragRef = useRef(null);
  const sessionUploads = useRef(new Set());

  const toast = useToast();

  const [candidate, setCandidate] = useState(null);
  const [preview, setPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('square');
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    return () => {
      if (candidate?.url) URL.revokeObjectURL(candidate.url);
    };
  }, [candidate?.url]);

  const isGif = candidate?.file?.type === 'image/gif';

  function resetCrop() {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }

  function closeEditor() {
    setCandidate(null);
    setError('');
    resetCrop();
  }

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';

    if (!file) return;

    if (!TYPES.includes(file.type)) {
      setError('Please choose a JPG, PNG, WEBP or GIF image.');
      return;
    }

    if (file.size > MAX_BYTES) {
      setError('The image is larger than 5 MB. Please choose a smaller file.');
      return;
    }

    setError('');

    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      setCandidate({
        file,
        url,
        width: image.naturalWidth,
        height: image.naturalHeight,
      });

      setMode('square');
      resetCrop();
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      setError('Unable to read this image. Please try another file.');
    };

    image.src = url;
  }

  function getCropBounds() {
    if (!candidate) return null;

    const { width, height } = candidate;
    const scale = (CROP_SIZE / Math.min(width, height)) * zoom;

    const cropSide = CROP_SIZE / scale;

    const centerX = width / 2 - offset.x / scale;
    const centerY = height / 2 - offset.y / scale;

    const sx = Math.max(0, Math.min(width - cropSide, centerX - cropSide / 2));
    const sy = Math.max(0, Math.min(height - cropSide, centerY - cropSide / 2));

    return { sx, sy, side: cropSide };
  }

  function startDrag(e) {
    if (mode !== 'square' || isGif) return;

    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);

    dragRef.current = {
      x: e.clientX,
      y: e.clientY,
      offsetX: offset.x,
      offsetY: offset.y,
    };

    setDragging(true);
  }

  function moveDrag(e) {
    if (!dragRef.current || !candidate) return;

    const { width, height } = candidate;
    const scale = (CROP_SIZE / Math.min(width, height)) * zoom;

    const displayWidth = width * scale;
    const displayHeight = height * scale;

    const maxX = Math.max(0, (displayWidth - CROP_SIZE) / 2);
    const maxY = Math.max(0, (displayHeight - CROP_SIZE) / 2);

    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;

    setOffset({
      x: Math.max(-maxX, Math.min(maxX, dragRef.current.offsetX + dx)),
      y: Math.max(-maxY, Math.min(maxY, dragRef.current.offsetY + dy)),
    });
  }

  function stopDrag() {
    dragRef.current = null;
    setDragging(false);
  }

  async function createCroppedFile() {
    const bounds = getCropBounds();
    if (!bounds) throw new Error('Unable to crop this image.');

    const canvas = document.createElement('canvas');
    const side = Math.max(1, Math.floor(bounds.side));

    canvas.width = side;
    canvas.height = side;

    const image = new Image();
    image.src = candidate.url;

    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error('Unable to process the image.'));
    });

    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Your browser does not support image cropping.');
    }

    context.drawImage(
      image,
      bounds.sx,
      bounds.sy,
      bounds.side,
      bounds.side,
      0,
      0,
      side,
      side
    );

    const mimeType =
      candidate.file.type === 'image/png'
        ? 'image/png'
        : candidate.file.type === 'image/webp'
          ? 'image/webp'
          : 'image/jpeg';

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result) resolve(result);
          else reject(new Error('Could not create the cropped image.'));
        },
        mimeType,
        0.92
      );
    });

    const extension =
      mimeType === 'image/png'
        ? 'png'
        : mimeType === 'image/webp'
          ? 'webp'
          : 'jpg';

    return new File(
      [blob],
      `cropped-${Date.now()}.${extension}`,
      { type: mimeType }
    );
  }

  async function confirmUpload() {
    if (!candidate || uploading) return;

    setUploading(true);
    setError('');

    try {
      // Full Size sends the original file.
      // GIF is always uploaded as Full Size to preserve animation.
      const file =
        mode === 'square' && !isGif
          ? await createCroppedFile()
          : candidate.file;

      if (file.size > MAX_BYTES) {
        throw new Error('The processed image is larger than 5 MB.');
      }

      const uploaded = await staffApi.uploadImage(file, folder);

      sessionUploads.current.add(uploaded.path);
      onChange(uploaded);

      setPreview('');
      setCandidate(null);
      resetCrop();

      toast.success('Image uploaded successfully.');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setUploading(false);
    }
  }

  async function remove() {
    const path = value?.path;

    if (path && sessionUploads.current.has(path)) {
      sessionUploads.current.delete(path);
      staffApi.deleteUpload(path).catch(() => {});
    }

    setPreview('');
    setError('');
    onChange({ url: '', path: '' });
  }

  function selectMode(nextMode) {
    setMode(nextMode);
    resetCrop();
  }

  const shown = preview || value?.url || '';

  const imageScale = candidate
    ? (CROP_SIZE / Math.min(candidate.width, candidate.height)) * zoom
    : 1;

  const imageWidth = candidate ? candidate.width * imageScale : CROP_SIZE;
  const imageHeight = candidate ? candidate.height * imageScale : CROP_SIZE;

  const imageLeft = (CROP_SIZE - imageWidth) / 2 + offset.x;
  const imageTop = (CROP_SIZE - imageHeight) / 2 + offset.y;

  return (
    <div className="space-y-3">
      {label && <span className="label">{label}</span>}

      <div
        className={`relative overflow-hidden border border-dashed border-line bg-surface-2 ${rounded} ${aspect} ${
          shown ? '' : 'flex items-center justify-center'
        }`}
      >
        {shown ? (
          <img
            src={shown}
            alt="Image preview"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="px-6 text-center text-sm text-muted">
            <p className="text-2xl">🖼️</p>
            <p className="mt-2">No image selected</p>
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-bg/70 backdrop-blur-sm">
            <p className="text-sm font-medium">Uploading...</p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={TYPES.join(',')}
          className="sr-only"
          onChange={handleFile}
          aria-label={`Choose ${label}`}
        />

        <button
          type="button"
          className="btn-ghost btn-sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {shown ? 'Change image' : 'Choose image'}
        </button>

        {shown && !uploading && (
          <button
            type="button"
            className="btn-ghost btn-sm text-danger"
            onClick={remove}
          >
            Remove
          </button>
        )}
      </div>

      {help && !error && <p className="help">{help}</p>}
      {error && <p role="alert" className="error-text">{error}</p>}

      {/* Image editing modal */}
      {candidate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/80 p-4">
          <div className="my-auto w-full max-w-lg rounded-2xl border border-line bg-surface p-5 shadow-2xl">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Prepare your image</h3>
                <p className="mt-1 text-xs text-muted">
                  Choose how you want to upload this image.
                </p>
              </div>

              <button
                type="button"
                className="btn-ghost btn-sm"
                onClick={closeEditor}
                disabled={uploading}
              >
                ✕
              </button>
            </div>

            <div className="mb-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => selectMode('square')}
                disabled={isGif || uploading}
                className={`rounded-xl border p-3 text-left transition ${
                  mode === 'square'
                    ? 'border-accent bg-accent/10'
                    : 'border-line bg-surface-2'
                } ${isGif ? 'cursor-not-allowed opacity-40' : ''}`}
              >
                <span className="block text-sm font-semibold">1:1</span>
                <span className="mt-1 block text-xs text-muted">
                  Square crop
                </span>
              </button>

              <button
                type="button"
                onClick={() => selectMode('full')}
                disabled={uploading}
                className={`rounded-xl border p-3 text-left transition ${
                  mode === 'full'
                    ? 'border-accent bg-accent/10'
                    : 'border-line bg-surface-2'
                }`}
              >
                <span className="block text-sm font-semibold">Full Size</span>
                <span className="mt-1 block text-xs text-muted">
                  Original dimensions
                </span>
              </button>
            </div>

            {mode === 'square' && !isGif ? (
              <>
                <div className="flex justify-center">
                  <div
                    className="relative overflow-hidden rounded-lg bg-black touch-none select-none"
                    style={{
                      width: CROP_SIZE,
                      height: CROP_SIZE,
                      maxWidth: '100%',
                      cursor: dragging ? 'grabbing' : 'grab',
                    }}
                    onPointerDown={startDrag}
                    onPointerMove={moveDrag}
                    onPointerUp={stopDrag}
                    onPointerCancel={stopDrag}
                    onLostPointerCapture={stopDrag}
                  >
                    <img
                      src={candidate.url}
                      alt="Crop preview"
                      draggable="false"
                      className="pointer-events-none absolute max-w-none"
                      style={{
                        width: imageWidth,
                        height: imageHeight,
                        left: imageLeft,
                        top: imageTop,
                      }}
                    />

                    <div className="pointer-events-none absolute inset-0 border-2 border-white/80" />
                  </div>
                </div>

                <p className="mt-3 text-center text-xs text-muted">
                  Drag the image to adjust its position.
                </p>

                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-medium">Zoom</label>
                    <span className="text-xs text-muted">
                      {zoom.toFixed(1)}x
                    </span>
                  </div>

                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.05"
                    value={zoom}
                    disabled={uploading}
                    onChange={(e) => {
                      setZoom(Number(e.target.value));
                      setOffset({ x: 0, y: 0 });
                    }}
                    className="w-full accent-accent"
                  />
                </div>

                <button
                  type="button"
                  className="btn-ghost btn-sm mt-3"
                  onClick={resetCrop}
                  disabled={uploading}
                >
                  Reset crop
                </button>
              </>
            ) : (
              <div className="overflow-hidden rounded-xl border border-line bg-surface-2 p-3">
                <div className="flex max-h-64 items-center justify-center overflow-hidden">
                  <img
                    src={candidate.url}
                    alt="Full image preview"
                    className="max-h-64 max-w-full object-contain"
                  />
                </div>

                <p className="mt-3 text-center text-xs text-muted">
                  {isGif
                    ? 'GIF animation will be preserved. Square crop is unavailable for GIF files.'
                    : 'The original image dimensions and aspect ratio will be preserved.'}
                </p>
              </div>
            )}

            <div className="mt-5 rounded-lg bg-surface-2 px-3 py-2 text-xs text-muted">
              {candidate.width} × {candidate.height}px
              {' · '}
              {(candidate.file.size / (1024 * 1024)).toFixed(2)} MB
            </div>

            {error && (
              <p role="alert" className="error-text mt-3">
                {error}
              </p>
            )}

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className="btn-ghost btn-sm"
                onClick={closeEditor}
                disabled={uploading}
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn-primary btn-sm"
                onClick={confirmUpload}
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Confirm & Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
