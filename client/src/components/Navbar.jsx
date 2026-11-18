
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useSite } from '../context/SiteContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/about', label: 'About' },
  { to: '/projects', label: 'Work' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const { profile } = useSite();
  const { can } = useAuth();

  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const location = useLocation();

  const canAccessAdmin = can('manageContent');

  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    let ticking = false;

    const updateScroll = () => {
      if (ticking) return;

      ticking = true;

      window.requestAnimationFrame(() => {
        const scrollTop = window.scrollY;
        const scrollableHeight =
          document.documentElement.scrollHeight - window.innerHeight;

        const progress =
          scrollableHeight > 0
            ? Math.min(100, Math.max(0, (scrollTop / scrollableHeight) * 100))
            : 0;

        setScrollProgress(progress);
        setScrolled(scrollTop > 12);

        ticking = false;
      });
    };

    updateScroll();

    window.addEventListener('scroll', updateScroll, { passive: true });
    window.addEventListener('resize', updateScroll);

    return () => {
      window.removeEventListener('scroll', updateScroll);
      window.removeEventListener('resize', updateScroll);
    };
  }, [location.pathname]);

  const name = profile?.siteName || 'Huzaifa Abir';

  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      {/* Scroll Progress Bar */}
      <div
        className="fixed inset-x-0 top-0 z-[60] h-[3px] bg-transparent"
        role="progressbar"
        aria-label="Page scroll progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(scrollProgress)}
      >
        <div
          className="h-full origin-left transition-[width] duration-150 ease-out"
          style={{
            width: `${scrollProgress}%`,
            background:
              'linear-gradient(90deg,var(--color-accent),var(--color-accent-2))',
            boxShadow: '0 0 10px var(--color-accent)',
          }}
        />
      </div>

      <header
        className={`fixed inset-x-0 top-0 z-50 transition duration-300 ${
          scrolled || open
            ? 'border-b border-line bg-bg/80 backdrop-blur-xl'
            : 'bg-transparent'
        }`}
      >
        <nav
          className="container-x flex h-16 items-center justify-between"
          aria-label="Main navigation"
        >
          <Link
            to="/"
            className="flex items-center gap-2.5 font-semibold tracking-tight"
            aria-label={`${name} home`}
          >
            <span
              className="grid h-9 w-9 place-items-center rounded-xl text-sm font-bold text-white"
              style={{
                background:
                  'linear-gradient(120deg,var(--color-accent),var(--color-accent-2))',
              }}
            >
              {initials}
            </span>
            <span className="hidden sm:inline">{name}</span>
          </Link>

          <ul className="hidden items-center gap-1 md:flex">
            {LINKS.map((l) => (
              <li key={l.to}>
                <NavLink
                  to={l.to}
                  end={l.end}
                  className={({ isActive }) =>
                    `rounded-full px-4 py-2 text-sm transition ${
                      isActive
                        ? 'bg-white/10 text-white'
                        : 'text-muted hover:text-white'
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <Link
              to="/contact"
              className="btn-primary btn-sm hidden sm:inline-flex"
            >
              Hire me
            </Link>

            {canAccessAdmin && (
              <Link
                to="/admin"
                className={`hidden items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition sm:inline-flex ${
                  location.pathname.startsWith('/admin')
                    ? 'border-accent bg-accent/15 text-white'
                    : 'border-line text-muted hover:border-accent hover:text-white'
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                Admin
              </Link>
            )}

            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-xl border border-line md:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? 'Close menu' : 'Open menu'}
              onClick={() => setOpen((v) => !v)}
            >
              <span className="space-y-1.5">
                <span
                  className={`block h-0.5 w-5 bg-white transition ${
                    open ? 'translate-y-2 rotate-45' : ''
                  }`}
                />
                <span
                  className={`block h-0.5 w-5 bg-white transition ${
                    open ? 'opacity-0' : ''
                  }`}
                />
                <span
                  className={`block h-0.5 w-5 bg-white transition ${
                    open ? '-translate-y-2 -rotate-45' : ''
                  }`}
                />
              </span>
            </button>
          </div>
        </nav>

        {open && (
          <div
            id="mobile-menu"
            className="border-t border-line bg-bg/95 backdrop-blur-xl md:hidden"
          >
            <ul className="container-x flex flex-col gap-1 py-4">
              {LINKS.map((l) => (
                <li key={l.to}>
                  <NavLink
                    to={l.to}
                    end={l.end}
                    className={({ isActive }) =>
                      `block rounded-xl px-4 py-3 text-base ${
                        isActive ? 'bg-white/10 text-white' : 'text-muted'
                      }`
                    }
                  >
                    {l.label}
                  </NavLink>
                </li>
              ))}

              {canAccessAdmin && (
                <li className="pt-2">
                  <NavLink
                    to="/admin"
                    className={({ isActive }) =>
                      `flex items-center gap-2 rounded-xl border px-4 py-3 text-base font-medium ${
                        isActive
                          ? 'border-accent bg-accent/15 text-white'
                          : 'border-line text-muted'
                      }`
                    }
                  >
                    <span aria-hidden="true">🛡️</span>
                    Admin Dashboard
                  </NavLink>
                </li>
              )}

              <li className="pt-2">
                <Link
                  to="/contact"
                  className="btn-primary btn-sm inline-flex"
                >
                  Hire me
                </Link>
              </li>
            </ul>
          </div>
        )}
      </header>
    </>
  );
}
