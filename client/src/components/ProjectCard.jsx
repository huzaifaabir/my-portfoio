import { Link } from 'react-router-dom';
import { imageSrc } from '../lib/api.js';

export default function ProjectCard({ project }) {
  const src = imageSrc(project.image);
  return (
    <Link
      to={`/projects/${project.id}`}
      className="card card-hover group flex flex-col overflow-hidden p-0"
      aria-label={`View project: ${project.title}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-2">
        {src ? (
          <img src={src} alt={project.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className="grid h-full place-items-center text-4xl opacity-60" style={{ background: 'linear-gradient(135deg,rgba(255,61,110,.35),rgba(124,92,255,.35))' }}>🎨</div>
        )}
        {project.featured && <span className="badge absolute left-3 top-3 bg-bg/70 text-white backdrop-blur">Featured</span>}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        {project.category && <p className="eyebrow text-[11px]">{project.category}</p>}
        <h3 className="text-lg font-semibold">{project.title}</h3>
        {project.description && <p className="line-clamp-2 text-sm text-muted">{project.description}</p>}
      </div>
    </Link>
  );
}
