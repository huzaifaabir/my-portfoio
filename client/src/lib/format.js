export const ROLE_LABEL = {
  superadmin: 'Super Admin',
  admin: 'Admin',
  editor: 'Editor',
};

export const ROLE_RANK = { editor: 1, admin: 2, superadmin: 3 };

export function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Human message from any error
export const errorMessage = (err) => err?.message || 'Something went wrong. Please try again.';

export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || '');
