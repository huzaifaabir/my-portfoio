import { Link } from 'react-router-dom';
import { staffApi } from '../../lib/services.js';
import { useAsync } from '../../hooks/useAsync.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatDateTime } from '../../lib/format.js';
import { ErrorState, PageLoader } from '../../components/States.jsx';
import PageHeader from './PageHeader.jsx';

export default function Dashboard() {
  const { me, can } = useAuth();
  const { data, loading, error, reload } = useAsync(() => staffApi.stats(), []);
  useDocumentTitle('Dashboard');

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const stats = [
    { label: 'Projects', value: data.projects, sub: `${data.published} published · ${data.drafts} draft` },
    { label: 'Unread messages', value: data.unread, sub: `${data.messages} total`, hide: !can('manageMessages') },
    { label: 'Active staff', value: data.staff, sub: 'With dashboard access', hide: !can('manageUsers') },
  ].filter((s) => !s.hide);

  return (
    <div>
      <PageHeader title={`Welcome back${me?.name ? `, ${me.name.split(' ')[0]}` : ''} 👋`} text="Here is a summary of your portfolio. Use the menu to update content." />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="card">
            <p className="text-sm text-muted">{s.label}</p>
            <p className="mt-2 text-4xl font-extrabold tabular-nums">{s.value}</p>
            <p className="mt-1 text-xs text-muted">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="card">
          <h2 className="text-lg font-semibold">Quick actions</h2>
          <div className="mt-5 grid gap-3">
            <Link to="/admin/projects/new" className="btn-primary btn-sm justify-start">+ Add a new project</Link>
            <Link to="/admin/profile" className="btn-ghost btn-sm justify-start">Edit hero & about</Link>
            <Link to="/admin/resume" className="btn-ghost btn-sm justify-start">Update skills & experience</Link>
            {can('manageMessages') && <Link to="/admin/messages" className="btn-ghost btn-sm justify-start">Read messages</Link>}
          </div>
        </div>

        {can('manageMessages') && (
          <div className="card">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recent messages</h2>
              <Link to="/admin/messages" className="text-sm text-accent hover:underline">View all</Link>
            </div>
            {data.recentMessages.length === 0 ? (
              <p className="mt-6 text-sm text-muted">No messages yet.</p>
            ) : (
              <ul className="mt-5 divide-y divide-line">
                {data.recentMessages.map((m) => (
                  <li key={m._id} className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <p className={`truncate text-sm ${m.read ? 'text-muted' : 'font-semibold'}`}>{m.name}{m.subject ? ` — ${m.subject}` : ''}</p>
                      <p className="text-xs text-muted">{formatDateTime(m.createdAt)}</p>
                    </div>
                    {!m.read && <span className="badge text-accent">New</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
