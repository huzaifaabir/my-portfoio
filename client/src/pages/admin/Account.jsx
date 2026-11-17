import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { staffApi } from '../../lib/services.js';
import { ROLE_LABEL, errorMessage } from '../../lib/format.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { Field, Input } from '../../components/Form.jsx';
import PageHeader from './PageHeader.jsx';

export default function Account() {
  const { me, refreshMe, resetPassword, logout } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(me?.name || '');
  const [saving, setSaving] = useState(false);
  useDocumentTitle('My account');

  async function save(e) {
    e.preventDefault();
    if (name.trim().length < 2) return toast.error('Please enter your name (at least 2 characters).');
    setSaving(true);
    try {
      await staffApi.updateMe(name.trim());
      await refreshMe?.();
      toast.success('Profile updated.');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function changePassword() {
    try {
      await resetPassword(me.email);
      toast.success('A password reset link was sent to your email.');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return (
    <div>
      <PageHeader title="My account" text="Your display name and login details." />
      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={save} className="card space-y-5">
          <h2 className="text-lg font-semibold">Profile</h2>
          <Field label="Display name" htmlFor="acc-name" required><Input id="acc-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} /></Field>
          <Field label="Email" htmlFor="acc-email" help="Your login email. Ask a Super Admin to change it."><Input id="acc-email" value={me?.email || ''} disabled readOnly /></Field>
          <Field label="Role" htmlFor="acc-role"><Input id="acc-role" value={ROLE_LABEL[me?.role] || ''} disabled readOnly /></Field>
          <div className="flex justify-end"><button className="btn-primary btn-sm" disabled={saving}>{saving ? 'Saving...' : 'Save name'}</button></div>
        </form>

        <div className="card space-y-5">
          <h2 className="text-lg font-semibold">Security</h2>
          <p className="text-sm text-muted">We will email a secure link to {me?.email}. Open it on this device to choose a new password.</p>
          <button className="btn-ghost btn-sm w-fit" onClick={changePassword}>Send password reset email</button>
          <hr className="border-line" />
          <button className="btn-danger btn-sm w-fit" onClick={() => logout().catch(() => toast.error('Could not log out.'))}>Log out of this device</button>
        </div>
      </div>
    </div>
  );
}
