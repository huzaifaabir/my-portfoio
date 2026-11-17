import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';

export default function NotFound() {
  useDocumentTitle('Page not found');
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center">
      <p className="gradient-text text-8xl font-extrabold">404</p>
      <h1 className="text-2xl font-bold">This page could not be found</h1>
      <p className="max-w-md text-muted">The link may be broken or the page may have moved.</p>
      <div className="flex gap-3">
        <Link to="/" className="btn-primary btn-sm">Go home</Link>
        <Link to="/projects" className="btn-ghost btn-sm">View work</Link>
      </div>
    </div>
  );
}
