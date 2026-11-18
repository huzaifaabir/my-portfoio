
import { Link } from 'react-router-dom';
import { imageSrc } from '../lib/api.js';

export default function ProjectCard({ project }) {
  const src = imageSrc(project.image);

  const clientUrl =
    typeof project.clientUrl === 'string' &&
    /^https?:\/\/[^\s]+$/i.test(project.clientUrl.trim())
      ? project.clientUrl.trim()
      : '';

  return (
    <article className="card card-hover group flex flex-col overflow-hidden p-0">
      <Link
        to={`/projects/${project.id}`}
        className="block"
        aria-label={`View project: ${project.title}`}
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-surface-2">
          {src ? (
            <img
              src={src}
              alt={project.title}
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div
              className="grid h-full place-items-center text-4xl opacity-60"
              style={{
                background:
                  'linear-gradient(135deg,rgba(255,61,110,.35),rgba(124,92,255,.35))',
              }}
            >
              🎨
            </div>
          )}

          {project.featured && (
            <span className="badge absolute left-3 top-3 bg-bg/70 text-white backdrop-blur">
              Featured
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-5">
        {project.category && (
          <p className="eyebrow text-[11px]">{project.category}</p>
        )}

        <Link
          to={`/projects/${project.id}`}
          className="text-lg font-semibold transition hover:text-accent"
        >
          {project.title}
        </Link>

        {project.description && (
          <p className="line-clamp-2 text-sm text-muted">
            {project.description}
          </p>
        )}

        {project.client && (
          <div className="mt-2">
            <p className="text-xs text-muted">CLIENT</p>

            {clientUrl ? (
              <a
                href={clientUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-accent transition hover:underline"
              >
                {project.client}
                <span aria-hidden="true">↗</span>
              </a>
            ) : (
              <p className="font-semibold">{project.client}</p>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
