
import { Link } from 'react-router-dom';
import { useSite } from '../context/SiteContext.jsx';
import SocialLinks from './SocialLinks.jsx';

export default function Footer() {
  const { profile } = useSite();
  const year = new Date().getFullYear();
  const socials = profile?.socials || [];

  return (
    <footer className="mt-24 border-t border-line">
      <div className="container-x flex flex-col gap-8 py-12 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-lg font-semibold">
            {profile?.siteName || 'Designed By Huzaifa'}
          </p>

          {profile?.footerText && (
            <p className="mt-2 max-w-md text-sm text-muted">
              {profile.footerText}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-4 md:items-end">
          {socials.length > 0 && (
            <SocialLinks socials={socials} />
          )}

          <nav
            className="flex gap-5 text-sm text-muted"
            aria-label="Footer navigation"
          >
            <Link to="/projects" className="hover:text-white">
              Work
            </Link>

            <Link to="/about" className="hover:text-white">
              About
            </Link>

            <Link to="/contact" className="hover:text-white">
              Contact
            </Link>
          </nav>

          <p className="text-xs text-muted">
            © {year} {profile?.siteName || 'Huzaifa Abir'}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
