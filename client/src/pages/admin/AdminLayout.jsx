import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { ROLE_LABEL } from '../../lib/format.js';

// Menu entries. The permission decides who sees each item.
const MENU = [
  { to: '/admin', label: 'Dashboard', end: true, icon: '▦' },
  { to: '/admin/profile', label: 'Profile & Contact', icon: '👤', permission: 'manageContent' },
  { to: '/admin/resume', label: 'Skills & Experience', icon: '⭐', permission: 'manageContent' },
  { to: '/admin/projects', label: 'Projects', icon: '🖼️', permission: 'manageContent' },
  { to: '/admin/messages', label: 'Messages', icon: '✉️', permission: 'manageMessages' },
  { to: '/admin/users', label: 'Users & Access', icon: '🔑', permission: 'manageUsers' },
  { to: '/admin/account', label: 'My account', icon: '⚙️' },
];

export default function AdminLayout() {
  const { me, can, logout } = useAuth();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const items = MENU.filter((m) => !m.permission || can(m.permission));

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      toast.error('Could not log out. Please try again.');
    }
  };

  const nav = (
    <nav className="flex flex-col gap-1" aria-label="Admin navigation">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={() => setOpen(false)}
          className={({ isActive }) => `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition ${isActive ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-muted hover:bg-white/5 hover:text-white'}`}
        >
          <span aria-hidden="true">{item.icon}</span>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );

  const userBox = (
    <div className="rounded-xl border border-line bg-surface-2 p-4">
      <p className="truncate text-sm font-semibold">{me?.name || me?.email}</p>
      <p className="truncate text-xs text-muted">{me?.email}</p>
      <span className="badge mt-2 text-accent">{ROLE_LABEL[me?.role] || me?.role}</span>
    </div>
  );

  return (
    <div className="min-h-screen md:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col gap-8 overflow-y-auto border-r border-line bg-surface/60 p-6 md:flex">
        <Link to="/admin" className="flex items-center gap-2 text-lg font-bold">
          <span className="gradient-text">Admin</span> Panel
        </Link>
        {userBox}
        {nav}
        <div className="mt-auto space-y-2">
          <Link to="/" className="btn-ghost btn-sm w-full">View website ↗</Link>
          <button onClick={handleLogout} className="btn-danger btn-sm w-full">Log out</button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-line bg-bg/90 px-5 py-4 backdrop-blur md:hidden">
        <span className="font-bold"><span className="gradient-text">Admin</span> Panel</span>
        <button className="btn-ghost btn-sm" aria-expanded={open} aria-controls="admin-mobile-nav" onClick={() => setOpen((v) => !v)}>
          {open ? 'Close' : 'Menu'}
        </button>
      </div>
      {open && (
        <div id="admin-mobile-nav" className="space-y-4 border-b border-line bg-bg p-5 md:hidden">
          {userBox}
          {nav}
          <button onClick={handleLogout} className="btn-danger btn-sm w-full">Log out</button>
        </div>
      )}

      <main className="min-w-0 flex-1 px-5 py-8 sm:px-10 lg:py-12">
        <Outlet />
      </main>
    </div>
  );
}
