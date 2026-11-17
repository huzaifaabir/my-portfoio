import { useState } from 'react';
import { Link } from 'react-router-dom';
import { staffApi } from '../../lib/services.js';
import { useAsync } from '../../hooks/useAsync.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useToast } from '../../context/ToastContext.jsx';
import { errorMessage } from '../../lib/format.js';
import { imageSrc } from '../../lib/api.js';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import { EmptyState, ErrorState, PageLoader } from '../../components/States.jsx';
import PageHeader from './PageHeader.jsx';

export default function ProjectsList() {
  const { data, loading, error, reload, setData } = useAsync(() => staffApi.manageProjects(), []);
  const toast = useToast();
  const [target, setTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  useDocumentTitle('Projects');

  async function confirmDelete() {
    setBusy(true);
    try {
      await staffApi.deleteProject(target.id);
      setData((d) => ({ ...d, items: d.items.filter((p) => p.id !== target.id) }));
      toast.success('Project deleted.');
      setTarget(null);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Projects"
        text="Portfolio items shown on the website. Drafts are visible only in this dashboard."
        actions={<Link to="/admin/projects/new" className="btn-primary btn-sm">+ New project</Link>}
      />

      {loading && <PageLoader />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && data.items.length === 0 && (
        <EmptyState title="No projects yet" text="Add your first project to start building your portfolio." action={<Link to="/admin/projects/new" className="btn-primary btn-sm">Add project</Link>} />
      )}

      {data && data.items.length > 0 && (
        <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {data.items.map((p) => (
            <li key={p.id} className="card flex flex-col overflow-hidden p-0">
              <div className="aspect-video bg-surface-2">
                {imageSrc(p.image) ? <img src={imageSrc(p.image)} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-3xl opacity-50">🎨</div>}
              </div>
              <div className="flex flex-1 flex-col gap-3 p-5">
                <div className="flex flex-wrap gap-2">
                  <span className={`badge ${p.published ? 'text-success' : 'text-amber-300'}`}>{p.published ? 'Published' : 'Draft'}</span>
                  {p.featured && <span className="badge text-accent">Featured</span>}
                  {p.category && <span className="badge">{p.category}</span>}
                </div>
                <h2 className="font-semibold">{p.title}</h2>
                <div className="mt-auto flex gap-2 pt-2">
                  <Link to={`/admin/projects/${p.id}/edit`} className="btn-ghost btn-sm">Edit</Link>
                  {p.published && <Link to={`/projects/${p.id}`} className="btn-ghost btn-sm" target="_blank">View ↗</Link>}
                  <button className="btn-ghost btn-sm text-danger" onClick={() => setTarget(p)}>Delete</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={!!target}
        danger
        busy={busy}
        title="Delete this project?"
        message={target ? `"${target.title}" and its image will be permanently removed.` : ''}
        confirmLabel="Delete project"
        onConfirm={confirmDelete}
        onCancel={() => setTarget(null)}
      />
    </div>
  );
}
