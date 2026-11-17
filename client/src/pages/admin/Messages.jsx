import { useState } from 'react';
import { staffApi } from '../../lib/services.js';
import { useAsync } from '../../hooks/useAsync.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useToast } from '../../context/ToastContext.jsx';
import { errorMessage, formatDateTime } from '../../lib/format.js';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import { EmptyState, ErrorState, PageLoader } from '../../components/States.jsx';
import PageHeader from './PageHeader.jsx';

export default function Messages() {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const { data, loading, error, reload, setData } = useAsync(() => staffApi.messages(unreadOnly), [unreadOnly]);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  useDocumentTitle('Messages');

  async function toggleRead(m) {
    try {
      const updated = await staffApi.setMessageRead(m.id, !m.read);
      setData((d) => ({
        ...d,
        items: d.items.map((x) => (x.id === m.id ? { ...x, read: updated.read } : x)),
        unread: d.unread + (updated.read ? -1 : 1),
      }));
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  async function confirmDelete() {
    setBusy(true);
    try {
      await staffApi.deleteMessage(pendingDelete.id);
      setData((d) => ({
        ...d,
        items: d.items.filter((x) => x.id !== pendingDelete.id),
        unread: pendingDelete.read ? d.unread : Math.max(0, d.unread - 1),
      }));
      toast.success('Message deleted.');
      setPendingDelete(null);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Messages"
        text={data ? `${data.unread} unread · ${data.items.length} shown` : 'Messages sent through your contact form.'}
        actions={(
          <div className="flex gap-2" role="group" aria-label="Filter messages">
            <button className={`btn-sm ${!unreadOnly ? 'btn-primary' : 'btn-ghost'}`} aria-pressed={!unreadOnly} onClick={() => setUnreadOnly(false)}>All</button>
            <button className={`btn-sm ${unreadOnly ? 'btn-primary' : 'btn-ghost'}`} aria-pressed={unreadOnly} onClick={() => setUnreadOnly(true)}>Unread</button>
          </div>
        )}
      />

      {loading && <PageLoader />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && data.items.length === 0 && <EmptyState title={unreadOnly ? 'No unread messages' : 'No messages yet'} text="Messages from your contact page will appear here." />}

      {data && data.items.length > 0 && (
        <ul className="space-y-4">
          {data.items.map((m) => (
            <li key={m.id} className={`card ${m.read ? '' : 'border-accent/40'}`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{m.name}</p>
                    {!m.read && <span className="badge text-accent">Unread</span>}
                  </div>
                  <a href={`mailto:${m.email}`} className="text-sm text-muted hover:text-white">{m.email}</a>
                  <p className="mt-1 text-xs text-muted">{formatDateTime(m.createdAt)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className="btn-ghost btn-sm" onClick={() => toggleRead(m)}>{m.read ? 'Mark unread' : 'Mark read'}</button>
                  <a className="btn-ghost btn-sm" href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject || 'Your message'}`)}`}>Reply</a>
                  <button className="btn-ghost btn-sm text-danger" onClick={() => setPendingDelete(m)}>Delete</button>
                </div>
              </div>
              {m.subject && <p className="mt-4 text-sm font-medium">{m.subject}</p>}
              <p className="mt-2 whitespace-pre-line text-sm text-muted">{m.message}</p>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        danger
        busy={busy}
        title="Delete this message?"
        message="This cannot be undone."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
