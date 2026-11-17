import { useEffect, useRef, useState } from 'react';
import { staffApi } from '../lib/services.js';
import { useToast } from '../context/ToastContext.jsx';
import { errorMessage } from '../lib/format.js';

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Image picker with instant local preview, upload to Firebase Storage, and remove.
// value = { url, path }. onChange receives the same shape.
export default function ImageUploader({ value, onChange, folder, label = 'Image', aspect = 'aspect-video', rounded = 'rounded-2xl', help }) {
  const inputRef = useRef(null);
  const toast = useToast();
  const [preview, setPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  // Files uploaded in this editing session. If the user removes one before saving, we delete it.
  const sessionUploads = useRef(new Set());

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!TYPES.includes(file.type)) return setError('Please choose a JPG, PNG, WEBP or GIF image.');
    if (file.size > MAX_BYTES) return setError('The image is larger than 5 MB. Please choose a smaller file.');

    setError('');
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const uploaded = await staffApi.uploadImage(file, folder);
      sessionUploads.current.add(uploaded.path);
      onChange(uploaded);
      toast.success('Image uploaded.');
    } catch (err) {
      setError(errorMessage(err));
      setPreview('');
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

  const shown = preview || value?.url || '';

  return (
    <div className="space-y-3">
      {label && <span className="label">{label}</span>}
      <div className={`relative overflow-hidden border border-dashed border-line bg-surface-2 ${rounded} ${aspect} ${shown ? '' : 'flex items-center justify-center'}`}>
        {shown ? (
          <img src={shown} alt="Image preview" className="h-full w-full object-cover" />
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
        <button type="button" className="btn-ghost btn-sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
          {shown ? 'Change image' : 'Choose image'}
        </button>
        {shown && !uploading && (
          <button type="button" className="btn-ghost btn-sm text-danger" onClick={remove}>Remove</button>
        )}
      </div>
      {help && !error && <p className="help">{help}</p>}
      {error && <p role="alert" className="error-text">{error}</p>}
    </div>
  );
}
