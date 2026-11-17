import { useMemo, useState } from 'react';
import { staffApi } from '../../lib/services.js';
import { useAsync } from '../../hooks/useAsync.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { ROLE_LABEL, ROLE_RANK, errorMessage, formatDate, isEmail } from '../../lib/format.js';
import { Field, Input, Select, Toggle } from '../../components/Form.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import { ErrorState, PageLoader } from '../../components/States.jsx';
import PageHeader from './PageHeader.jsx';

// Mirrors the server rules so the UI only offers actions that will succeed.
// The server still enforces every rule.
function canTouch(actor, target, adminCount) {
  if (target.role === 'superadmin') return false;
  if (target.id === actor.id || target.email === actor.email) return false;
  if (ROLE_RANK[actor.role] <= ROLE_RANK[target.role]) return false;
  const isAdminLevel = ['admin', 'superadmin'].includes(target.role) && target.status === 'active';
  return !(isAdminLevel && adminCount <= 1);
}

export default function Users() {
  const { me } = useAuth();
  const toast = useToast();
  const { data, loading, error, reload, setData } = useAsync(() => staffApi.users(), []);
  const [form, setForm] = useState({ email: '', name: '', role: '' });
  const [formErrors, setFormErrors] = useState({});
  const [creating, setCreating] = useState(false);
  const [resetLink, setResetLink] = useState('');
  const [pendingRemove, setPendingRemove] = useState(null);
  const [busy, setBusy] = useState(false);
  useDocumentTitle('Users & Access');

  const roles = data?.assignableRoles || [];
  const adminCount = useMemo(() => (data?.items || []).filter((u) => ['admin', 'superadmin'].includes(u.role) && u.status === 'active').length, [data]);

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const actor = { id: data.currentUserId, email: me.email, role: me.role };
  const defaultRole = roles[0] || '';
  const roleForm = form.role || defaultRole;

  async function addUser(e) {
    e.preventDefault();
    const found = {};
    if (!isEmail(form.email.trim())) found.email = 'Please enter a valid email address.';
    if (!roleForm) found.role = 'Choose a role.';
    setFormErrors(found);
    if (Object.keys(found).length) return;

    setCreating(true);
    try {
      const result = await staffApi.createUser({ email: form.email.trim(), name: form.name.trim(), role: roleForm });
      setData((d) => ({ ...d, items: [...d.items, result.user] }));
      setForm({ email: '', name: '', role: '' });
      setResetLink(result.resetLink || '');
      toast.success(result.resetLink
        ? 'Staff account created. Share the setup link below with them.'
        : 'Staff access granted to the existing account.');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setCreating(false);
    }
  }

  async function changeRole(user, role) {
    try {
      const updated = await staffApi.updateUser(user.id, { role });
      setData((d) => ({ ...d, items: d.items.map((u) => (u.id === user.id ? { ...u, ...updated, id: user.id } : u)) }));
      toast.success(`${user.email} is now ${ROLE_LABEL[role]}.`);
    } catch (err) {
      toast.error(errorMessage(err));
      reload();
    }
  }

  async function toggleStatus(user) {
    const status = user.status === 'active' ? 'disabled' : 'active';
    try {
      await staffApi.updateUser(user.id, { status });
      setData((d) => ({ ...d, items: d.items.map((u) => (u.id === user.id ? { ...u, status } : u)) }));
      toast.success(status === 'active' ? 'Access restored.' : 'Access disabled.');
    } catch (err) {
      toast.error(errorMessage(err));
      reload();
    }
  }

  async function confirmRemove() {
    setBusy(true);
    try {
      await staffApi.deleteUser(pendingRemove.id);
      setData((d) => ({ ...d, items: d.items.filter((u) => u.id !== pendingRemove.id) }));
      toast.success('Staff access removed.');
      setPendingRemove(null);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Users & access"
        text={`Super Admins manage Admins and Editors. Admins manage Editors. The last active administrator can never be removed. You are signed in as ${ROLE_LABEL[me.role]}.`}
      />

      {roles.length > 0 && (
        <form onSubmit={addUser} noValidate className="card mb-8 grid gap-5 md:grid-cols-[1.2fr_1fr_0.9fr_auto] md:items-end" aria-label="Add staff member">
          <Field label="Email" htmlFor="u-email" required error={formErrors.email}>
            <Input id="u-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} invalid={!!formErrors.email} />
          </Field>
          <Field label="Name" htmlFor="u-name"><Input id="u-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={120} /></Field>
          <Field label="Role" htmlFor="u-role" required error={formErrors.role}>
            <Select id="u-role" value={roleForm} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {roles.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </Select>
          </Field>
          <button type="submit" className="btn-primary btn-sm h-11" disabled={creating}>{creating ? 'Adding...' : 'Add staff'}</button>
        </form>
      )}

      {resetLink && (
        <div role="status" className="card mb-8 border-accent-2/40 bg-accent-2/10">
          <p className="font-semibold">Share this one-time password setup link</p>
          <p className="mt-1 text-sm text-muted">The new person should open it and choose their own password. It is shown only once.</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <code className="block min-w-0 flex-1 truncate rounded-lg bg-bg px-3 py-2 text-xs">{resetLink}</code>
            <div className="flex gap-2">
              <button className="btn-ghost btn-sm" onClick={() => navigator.clipboard?.writeText(resetLink).then(() => toast.info('Link copied.')).catch(() => toast.error('Could not copy. Select and copy it manually.'))}>Copy</button>
              <button className="btn-ghost btn-sm" onClick={() => setResetLink('')}>Dismiss</button>
            </div>
          </div>
        </div>
      )}

      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wider text-muted">
            <tr>
              <th scope="col" className="px-5 py-4 font-semibold">Member</th>
              <th scope="col" className="px-5 py-4 font-semibold">Role</th>
              <th scope="col" className="px-5 py-4 font-semibold">Status</th>
              <th scope="col" className="px-5 py-4 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {data.items.map((u) => {
              const editable = canTouch(actor, u, adminCount);
              const isSelf = u.id === actor.id;
              const canChangeRole = editable && roles.length > 0;
              const roleOptions = [...new Set([u.role, ...roles])];
              return (
                <tr key={u.id} className="align-middle">
                  <td className="px-5 py-4">
                    <p className="font-medium">{u.name || '—'} {isSelf && <span className="text-xs text-muted">(you)</span>}</p>
                    <p className="text-xs text-muted">{u.email}</p>
                    <p className="text-[11px] text-muted/70">Added {formatDate(u.createdAt)}</p>
                  </td>
                  <td className="px-5 py-4">
                    {canChangeRole ? (
                      <Select aria-label={`Role for ${u.email}`} value={u.role} onChange={(e) => changeRole(u, e.target.value)} className="w-40 py-2">
                        {roleOptions.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                      </Select>
                    ) : (
                      <span className="badge text-text">{ROLE_LABEL[u.role]}</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`badge ${u.status === 'active' ? 'text-success' : 'text-danger'}`}>{u.status === 'active' ? 'Active' : 'Disabled'}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      {editable && (
                        <button className="btn-ghost btn-sm" onClick={() => toggleStatus(u)}>{u.status === 'active' ? 'Disable' : 'Enable'}</button>
                      )}
                      {editable && (
                        <button className="btn-ghost btn-sm text-danger" onClick={() => setPendingRemove(u)}>Remove</button>
                      )}
                      {!editable && <span className="text-xs text-muted">Protected</span>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!pendingRemove}
        danger
        busy={busy}
        title="Remove staff access?"
        message={pendingRemove ? `${pendingRemove.email} will lose access to this dashboard. Their login account is kept.` : ''}
        confirmLabel="Remove access"
        onConfirm={confirmRemove}
        onCancel={() => setPendingRemove(null)}
      />
    </div>
  );
}
