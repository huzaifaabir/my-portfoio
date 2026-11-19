
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { staffApi } from '../../lib/services.js';
import { useSite } from '../../context/SiteContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { errorMessage } from '../../lib/format.js';
import { Field, Input, Textarea, Toggle } from '../../components/Form.jsx';
import ImageUploader from '../../components/ImageUploader.jsx';
import { ErrorState, PageLoader } from '../../components/States.jsx';
import PageHeader from './PageHeader.jsx';

const MAX_IMAGES = 20;

const EMPTY = {
  title: '',
  category: '',
  client: '',
  clientUrl: '',
  description: '',
  link: '',
  tags: '',
  details: '',
  images: [],
  featured: false,
  published: true,
  order: 0,
};

export default function ProjectEditor() {
  const { id } = useParams();
  const editing = Boolean(id);

  const navigate = useNavigate();
  const toast = useToast();
  const { refresh } = useSite();

  const imageKeyRef = useRef(0);

  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(editing);
  const [loadError, setLoadError] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useDocumentTitle(editing ? 'Edit project' : 'New project');

  // Generate a stable key for each image uploader.
  function createImageItem(image = { url: '', path: '' }) {
    imageKeyRef.current += 1;

    return {
      key: `project-image-${imageKeyRef.current}`,
      image: {
        url: image?.url || '',
        path: image?.path || '',
      },
    };
  }

  // Load existing project.
  useEffect(() => {
    if (!editing) return;

    let alive = true;

    staffApi.manageProjects()
      .then(({ items }) => {
        const p = items.find((x) => x.id === id);

        if (!alive) return;

        if (!p) {
          setLoadError('This project does not exist or was deleted.');
          return;
        }

        // Support both new multiple images and old single image.
        const existingImages =
          Array.isArray(p.images) && p.images.length
            ? p.images
            : p.image?.url
              ? [p.image]
              : [];

        setForm({
          ...EMPTY,
          ...p,
          clientUrl: p.clientUrl || '',
          tags: (p.tags || []).join(', '),
          images: existingImages.map((img) => createImageItem(img)),
        });
      })
      .catch((err) => {
        if (alive) setLoadError(errorMessage(err));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [editing, id]);

  const set = (key) => (e) => {
    const value =
      e.target.type === 'checkbox'
        ? e.target.checked
        : e.target.value;

    setForm((f) => ({ ...f, [key]: value }));
  };

  // Update an image at a particular position.
  function updateImage(index, image) {
    setForm((f) => ({
      ...f,
      images: f.images.map((item, i) =>
        i === index
          ? {
              ...item,
              image: {
                url: image?.url || '',
                path: image?.path || '',
              },
            }
          : item
      ),
    }));
  }

  // Add another image uploader.
  function addImage() {
    if (form.images.length >= MAX_IMAGES) {
      toast.error(`You can add a maximum of ${MAX_IMAGES} images.`);
      return;
    }

    setForm((f) => ({
      ...f,
      images: [...f.images, createImageItem()],
    }));
  }

  // Remove an empty uploader slot.
  function removeEmptySlot(index) {
    setForm((f) => ({
      ...f,
      images: f.images.filter((_, i) => i !== index),
    }));
  }

  // Reorder images.
  function moveImage(index, direction) {
    const targetIndex = index + direction;

    if (targetIndex < 0 || targetIndex >= form.images.length) {
      return;
    }

    setForm((f) => {
      const images = [...f.images];

      [images[index], images[targetIndex]] = [
        images[targetIndex],
        images[index],
      ];

      return {
        ...f,
        images,
      };
    });
  }

  function validate() {
    const e = {};

    if (!form.title.trim()) {
      e.title = 'Please enter a project title.';
    }

    if (
      form.clientUrl.trim() &&
      !/^https?:\/\/[^\s]+$/i.test(form.clientUrl.trim())
    ) {
      e.clientUrl = 'Enter a valid URL starting with https:// or http://';
    }

    if (
      form.link.trim() &&
      !/^https?:\/\/[^\s]+$/i.test(form.link.trim())
    ) {
      e.link = 'Enter a valid URL starting with https:// or http://';
    }

    return e;
  }

  async function submit(e) {
    e.preventDefault();

    const found = validate();
    setErrors(found);

    if (Object.keys(found).length) return;

    // Only save successfully uploaded images.
    const images = form.images
      .map((item) => item.image)
      .filter((img) => img?.url);

    const payload = {
      ...form,

      title: form.title.trim(),
      category: form.category.trim(),
      client: form.client.trim(),
      clientUrl: form.clientUrl.trim(),
      description: form.description.trim(),
      link: form.link.trim(),
      details: form.details.trim(),

      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 10),

      order: Number(form.order) || 0,

      // Multiple images support.
      images,

      // Keep the first image in the legacy field for compatibility.
      image: images[0] || { url: '', path: '' },
    };

    setSaving(true);

    try {
      if (editing) {
        await staffApi.updateProject(id, payload);
      } else {
        await staffApi.createProject(payload);
      }

      await refresh();

      toast.success(editing ? 'Project updated.' : 'Project created.');
      navigate('/admin/projects');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <PageLoader />;
  if (loadError) return <ErrorState message={loadError} />;

  return (
    <div>
      <PageHeader
        title={editing ? 'Edit project' : 'New project'}
        text="Add your project details, client website and optional live preview."
        actions={
          <Link to="/admin/projects" className="btn-ghost btn-sm">
            ← Back to projects
          </Link>
        }
      />

      <form
        onSubmit={submit}
        noValidate
        className="grid gap-8 xl:grid-cols-[1fr_380px]"
      >
        <div className="card space-y-6">
          <Field
            label="Project title"
            htmlFor="p-title"
            required
            error={errors.title}
          >
            <Input
              id="p-title"
              value={form.title}
              onChange={set('title')}
              invalid={!!errors.title}
              maxLength={120}
            />
          </Field>

          <Field label="Category" htmlFor="p-cat">
            <Input
              id="p-cat"
              value={form.category}
              onChange={set('category')}
              maxLength={60}
              placeholder="e.g. Poster, Social Media, Logo"
            />
          </Field>

          <Field label="Client" htmlFor="p-client">
            <Input
              id="p-client"
              value={form.client}
              onChange={set('client')}
              maxLength={120}
              placeholder="e.g. GlobalED"
            />
          </Field>

          <Field
            label="Client website (Optional)"
            htmlFor="p-client-url"
            error={errors.clientUrl}
            help="This link will be attached to the client name. Visitors can click the name to open the client's website."
          >
            <Input
              id="p-client-url"
              type="url"
              value={form.clientUrl}
              onChange={set('clientUrl')}
              invalid={!!errors.clientUrl}
              maxLength={600}
              placeholder="https://example.com"
            />
          </Field>

          <Field
            label="Project description"
            htmlFor="p-desc"
            help="Short description shown on project cards. Up to 300 characters."
          >
            <Textarea
              id="p-desc"
              rows={3}
              value={form.description}
              onChange={set('description')}
              maxLength={300}
            />
          </Field>

          <Field
            label="Project link (Optional)"
            htmlFor="p-link"
            error={errors.link}
            help="Add a live preview or design link. A Live View button will appear on the website only when this field has a link."
          >
            <Input
              id="p-link"
              type="url"
              value={form.link}
              onChange={set('link')}
              invalid={!!errors.link}
              maxLength={300}
              placeholder="https://example.com/live-preview"
            />
          </Field>

          <Field
            label="Tags"
            htmlFor="p-tags"
            help="Separate with commas, e.g. Typography, Print, Campaign"
          >
            <Input
              id="p-tags"
              value={form.tags}
              onChange={set('tags')}
              maxLength={400}
            />
          </Field>

          <Field
            label="Full project details (Optional)"
            htmlFor="p-details"
            help="Additional project information shown on the project detail page."
          >
            <Textarea
              id="p-details"
              rows={6}
              value={form.details}
              onChange={set('details')}
              maxLength={5000}
            />
          </Field>
        </div>

        <aside className="space-y-6">
          {/* Multiple project images */}
          <div className="card space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold">Project images</h3>
                <p className="text-sm text-muted mt-1">
                  Upload multiple images for this project.
                </p>
              </div>

              <span className="text-xs text-muted whitespace-nowrap">
                {form.images.length}/{MAX_IMAGES}
              </span>
            </div>

            {form.images.length === 0 && (
              <div className="rounded-xl border border-dashed border-line p-5 text-center">
                <p className="text-sm text-muted">
                  No project images added yet.
                </p>
                <p className="text-xs text-muted mt-1">
                  Add images to create a project gallery.
                </p>
              </div>
            )}

            <div className="space-y-6">
              {form.images.map((item, index) => (
                <div
                  key={item.key}
                  className="rounded-xl border border-line p-3 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">
                        Image {index + 1}
                      </span>

                      {index === 0 && (
                        <span className="rounded-full bg-primary/10 text-primary px-2 py-1 text-[10px] font-semibold">
                          COVER IMAGE
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="btn-ghost btn-sm"
                        title="Move image up"
                        aria-label="Move image up"
                        disabled={index === 0}
                        onClick={() => moveImage(index, -1)}
                      >
                        ↑
                      </button>

                      <button
                        type="button"
                        className="btn-ghost btn-sm"
                        title="Move image down"
                        aria-label="Move image down"
                        disabled={index === form.images.length - 1}
                        onClick={() => moveImage(index, 1)}
                      >
                        ↓
                      </button>

                      {!item.image.url && (
                        <button
                          type="button"
                          className="btn-ghost btn-sm text-red-500"
                          title="Remove empty image slot"
                          onClick={() => removeEmptySlot(index)}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  <ImageUploader
                    label={`Project image ${index + 1}`}
                    folder="projects"
                    value={item.image}
                    onChange={(img) => updateImage(index, img)}
                    aspect="aspect-[4/3]"
                    help="JPG, PNG, WEBP or GIF, max 5 MB."
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              className="btn-ghost w-full"
              onClick={addImage}
              disabled={form.images.length >= MAX_IMAGES}
            >
              + Add another image
            </button>

            <p className="text-xs text-muted">
              The first image will be used as the main project image.
              You can change the image order using the arrow buttons.
            </p>
          </div>

          <div className="card space-y-5">
            <Toggle
              id="p-pub"
              label="Published (visible on the website)"
              checked={form.published}
              onChange={(v) =>
                setForm((f) => ({ ...f, published: v }))
              }
            />

            <Toggle
              id="p-feat"
              label="Featured on the home page"
              checked={form.featured}
              onChange={(v) =>
                setForm((f) => ({ ...f, featured: v }))
              }
            />

            <Field
              label="Display order"
              htmlFor="p-order"
              help="Lower numbers appear first."
            >
              <Input
                id="p-order"
                type="number"
                min="0"
                max="9999"
                value={form.order}
                onChange={set('order')}
              />
            </Field>
          </div>

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={saving}
          >
            {saving
              ? 'Saving...'
              : editing
                ? 'Save changes'
                : 'Create project'}
          </button>
        </aside>
      </form>
    </div>
  );
}
