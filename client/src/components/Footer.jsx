import { Link } from 'react-router-dom';
import { useSite } from '../context/SiteContext.jsx';

export default function Footer() {
  const { profile } = useSite();
  const year = new Date().getFullYear();
  const socials = profile?.socials || [];

  return (
    <footer className="mt-24 border-t border-line">
      <div className="container-x flex flex-col gap-8 py-12 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-lg font-semibold">{profile?.siteName || 'Huzaifa Abir'}</p>
          {profile?.footerText && <p className="mt-2 max-w-md text-sm text-muted">{profile.footerText}</p>}
        </div>
        <div className="flex flex-col gap-4 md:items-end">
          {socials.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {socials.map((s) => (
                <li key={s.platform + s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="badge hover:border-accent/50 hover:text-white">{s.platform}</a>
                </li>
              ))}
            </ul>
          )}
          <nav className="flex gap-5 text-sm text-muted" aria-label="Footer navigation">
            <Link to="/projects" className="hover:text-white">Work</Link>
            <Link to="/about" className="hover:text-white">About</Link>
            <Link to="/contact" className="hover:text-white">Contact</Link>
          </nav>
          <p className="text-xs text-muted">© {year} {profile?.siteName || 'Huzaifa Abir'}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
