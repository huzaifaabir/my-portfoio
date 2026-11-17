import { Link, useParams } from 'react-router-dom';
import { publicApi } from '../../lib/services.js';
import { useAsync } from '../../hooks/useAsync.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { imageSrc } from '../../lib/api.js';
import { ErrorState, PageLoader } from '../../components/States.jsx';

export default function ProjectDetail() {
  const { id } = useParams();
  const { data: project, loading, error, reload } = useAsync(() => publicApi.project(id), [id]);
  useDocumentTitle(project?.title || 'Project');

  if (loading) return <PageLoader />;
  if (error) {
    return (
      <div className="pt-32 container-x">
        <ErrorState message={error} onRetry={reload} />
        <div className="mt-6 text-center"><Link to="/projects" className="btn-ghost btn-sm">← Back to all projects</Link></div>
      </div>
    );
  }

  const src = imageSrc(project.image);
  return (
    <article className="pt-28 sm:pt-32">
      <div className="container-x">
        <Link to="/projects" className="text-sm text-muted hover:text-white">← All projects</Link>

        <div className="mt-6 grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-start">
          <div className="overflow-hidden rounded-[1.75rem] border border-line bg-surface">
            {src ? <img src={src} alt={project.title} className="w-full object-cover" /> : <div className="aspect-video w-full bg-surface-2" />}
          </div>

          <div className="lg:sticky lg:top-28">
            {project.category && <p className="eyebrow">{project.category}</p>}
            <h1 className="mt-3 text-4xl font-extrabold">{project.title}</h1>
            {project.description && <p className="mt-4 text-lg text-muted">{project.description}</p>}

            <dl className="mt-8 grid grid-cols-2 gap-5 text-sm">
              {project.client && (<div><dt className="text-muted">Client</dt><dd className="mt-1 font-medium">{project.client}</dd></div>)}
              {project.category && (<div><dt className="text-muted">Category</dt><dd className="mt-1 font-medium">{project.category}</dd></div>)}
            </dl>

            {project.tags?.length > 0 && (
              <ul className="mt-6 flex flex-wrap gap-2">
                {project.tags.map((t) => <li key={t} className="badge text-text">{t}</li>)}
              </ul>
            )}

            {project.link && (
              <a href={project.link} target="_blank" rel="noopener noreferrer" className="btn-primary mt-8">View live project ↗</a>
            )}
          </div>
        </div>

        {project.details && (
          <div className="mt-16 max-w-3xl">
            <h2 className="text-2xl font-bold">About this project</h2>
            <p className="mt-4 whitespace-pre-line leading-relaxed text-muted">{project.details}</p>
          </div>
        )}
      </div>
    </article>
  );
}
