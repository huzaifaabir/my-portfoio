import { useEffect, useState } from 'react';
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

const EMPTY = {
  title: '', category: '', client: '', description: '', details: '', link: '',
  tags: '', image: { url: '', path: '' }, featured: false, published: true, order: 0,
};

export default function ProjectEditor() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();
  const { refresh } = useSite();
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(editing);
  const [loadError, setLoadError] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  useDocumentTitle(editing ? 'Edit project' : 'New project');

  // Load the existing project when editing
  useEffect(() => {
    if (!editing) return;
    let alive = true;
    staffApi.manageProjects()
      .then(({ items }) => {
        const p = items.find((x) => x.id === id);
        if (!alive) return;
        if (!p) return setLoadError('This project does not exist or was deleted.');
        setForm({ ...EMPTY, ...p, tags: (p.tags || []).join(', '), image: p.image || { url: '', path: '' } });
      })
      .catch((err) => alive && setLoadError(errorMessage(err)))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [editing, id]);

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
  };

  function validate() {
    const e = {};
    if (!form.title.trim()) e.title = 'Please enter a project title.';
    if (form.link && !/^https?:\/\//.test(form.link.trim())) e.link = 'Links must start with https://';
    return e;
  }

  async function submit(e) {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;

    const payload = {
      ...form,
      title: form.title.trim(),
      link: form.link.trim(),
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 10),
      order: Number(form.order) || 0,
    };
    setSaving(true);
    try {
      if (editing) await staffApi.updateProject(id, payload);
      else await staffApi.createProject(payload);
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
        text="Images are stored in Firebase Storage. Save to publish the changes."
        actions={<Link to="/admin/projects" className="btn-ghost btn-sm">← Back to projects</Link>}
      />

      <form onSubmit={submit} noValidate className="grid gap-8 xl:grid-cols-[1fr_380px]">
        <div className="card space-y-6">
          <Field label="Project title" htmlFor="p-title" required error={errors.title}>
            <Input id="p-title" value={form.title} onChange={set('title')} invalid={!!errors.title} maxLength={120} />
          </Field>
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Category" htmlFor="p-cat" help="e.g. Poster, Social Media, Logo"><Input id="p-cat" value={form.category} onChange={set('category')} maxLength={60} /></Field>
            <Field label="Client" htmlFor="p-client"><Input id="p-client" value={form.client} onChange={set('client')} maxLength={120} /></Field>
          </div>
          <Field label="Short description" htmlFor="p-desc" help="Shown on project cards. Up to 300 characters."><Textarea id="p-desc" rows={2} value={form.description} onChange={set('description')} maxLength={300} /></Field>
          <Field label="Full details" htmlFor="p-details" help="Shown on the project page. Up to 5000 characters."><Textarea id="p-details" rows={8} value={form.details} onChange={set('details')} maxLength={5000} /></Field>
          <Field label="Project link (optional)" htmlFor="p-link" error={errors.link} help="A live link or case study, starting with https://"><Input id="p-link" type="url" value={form.link} onChange={set('link')} invalid={!!errors.link} maxLength={300} placeholder="https://" /></Field>
          <Field label="Tags" htmlFor="p-tags" help="Separate with commas, e.g. Typography, Print, Campaign"><Input id="p-tags" value={form.tags} onChange={set('tags')} maxLength={400} /></Field>
        </div>

        <aside className="space-y-6">
          <div className="card space-y-6">
            <ImageUploader label="Project image" folder="projects" value={form.image} onChange={(img) => setForm((f) => ({ ...f, image: img }))} aspect="aspect-[4/3]" help="Shown as the card thumbnail. JPG, PNG, WEBP or GIF, max 5 MB." />
          </div>
          <div className="card space-y-5">
            <Toggle id="p-pub" label="Published (visible on the website)" checked={form.published} onChange={(v) => setForm((f) => ({ ...f, published: v }))} />
            <Toggle id="p-feat" label="Featured on the home page" checked={form.featured} onChange={(v) => setForm((f) => ({ ...f, featured: v }))} />
            <Field label="Display order" htmlFor="p-order" help="Lower numbers appear first."><Input id="p-order" type="number" min="0" max="9999" value={form.order} onChange={set('order')} /></Field>
          </div>
          <button type="submit" className="btn-primary w-full" disabled={saving}>{saving ? 'Saving...' : editing ? 'Save changes' : 'Create project'}</button>
        </aside>
      </form>
    </div>
  );
}
