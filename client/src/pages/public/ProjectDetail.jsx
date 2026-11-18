
import { Link, useParams } from 'react-router-dom';
import { publicApi } from '../../lib/services.js';
import { useAsync } from '../../hooks/useAsync.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { imageSrc } from '../../lib/api.js';
import { ErrorState, PageLoader } from '../../components/States.jsx';

export default function ProjectDetail() {
  const { id } = useParams();

  const { data: project, loading, error, reload } = useAsync(
    () => publicApi.project(id),
    [id]
  );

  useDocumentTitle(project?.title || 'Project');

  if (loading) return <PageLoader />;

  if (error) {
    return (
      <div className="pt-32 container-x">
        <ErrorState message={error} onRetry={reload} />

        <div className="mt-6 text-center">
          <Link to="/projects" className="btn-ghost btn-sm">
            ← Back to all projects
          </Link>
        </div>
      </div>
    );
  }

  if (!project) return null;

  const src = imageSrc(project.image);

  const clientUrl =
    typeof project.clientUrl === 'string' &&
    /^https?:\/\/[^\s]+$/i.test(project.clientUrl.trim())
      ? project.clientUrl.trim()
      : '';

  const projectUrl =
    typeof project.link === 'string' &&
    /^https?:\/\/[^\s]+$/i.test(project.link.trim())
      ? project.link.trim()
      : '';

  return (
    <article className="pt-28 sm:pt-32">
      <div className="container-x">
        <Link
          to="/projects"
          className="text-sm text-muted hover:text-white"
        >
          ← All projects
        </Link>

        <div className="mt-6 grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-start">
          <div className="overflow-hidden rounded-[1.75rem] border border-line bg-surface">
            {src ? (
              <img
                src={src}
                alt={project.title}
                className="w-full object-cover"
              />
            ) : (
              <div className="aspect-video w-full bg-surface-2" />
            )}
          </div>

          <div className="lg:sticky lg:top-28">
            {project.category && (
              <p className="eyebrow">{project.category}</p>
            )}

            <h1 className="mt-3 text-4xl font-extrabold">
              {project.title}
            </h1>

            {project.description && (
              <p className="mt-4 text-lg text-muted">
                {project.description}
              </p>
            )}

            <div className="mt-8 flex flex-wrap items-start gap-x-6 gap-y-4">
              {project.client && (
                <div>
                  <p className="text-xs text-muted">CLIENT</p>

                  <div className="mt-1 font-semibold">
                    {clientUrl ? (
                      <a
                        href={clientUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-accent hover:underline"
                      >
                        {project.client}
                        <span aria-hidden="true">↗</span>
                      </a>
                    ) : (
                      project.client
                    )}
                  </div>
                </div>
              )}

              {project.category && (
                <div>
                  <p className="text-xs text-muted">CATEGORY</p>
                  <p className="mt-1 font-medium">
                    {project.category}
                  </p>
                </div>
              )}
            </div>

            {projectUrl && (
              <div className="mt-6">
                <a
                  href={projectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary inline-flex items-center gap-2"
                >
                  Live View ↗
                </a>
              </div>
            )}

            {project.tags?.length > 0 && (
              <ul className="mt-6 flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <li key={tag} className="badge text-text">
                    {tag}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {project.details && (
          <div className="mt-16 max-w-3xl">
            <h2 className="text-2xl font-bold">
              About this project
            </h2>

            <p className="mt-4 whitespace-pre-line leading-relaxed text-muted">
              {project.details}
            </p>
          </div>
        )}
      </div>
    </article>
  );
}
