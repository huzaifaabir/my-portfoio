
import { useEffect, useMemo, useState } from 'react';
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

  const images = useMemo(() => {
    if (!project) return [];

    const multipleImages = Array.isArray(project.images)
      ? project.images.map((image) => imageSrc(image)).filter(Boolean)
      : [];

    if (multipleImages.length > 0) return multipleImages;

    const singleImage = imageSrc(project.image);
    return singleImage ? [singleImage] : [];
  }, [project]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    setActiveIndex(0);
    setFade(false);
  }, [id]);

  const changeImage = (index) => {
    if (images.length <= 1 || index === activeIndex) return;

    setFade(true);

    window.setTimeout(() => {
      setActiveIndex(index);
      setFade(false);
    }, 180);
  };

  const showPrevious = () => {
    changeImage((activeIndex - 1 + images.length) % images.length);
  };

  const showNext = () => {
    changeImage((activeIndex + 1) % images.length);
  };

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
          <div>
            <div className="relative overflow-hidden rounded-[1.75rem] border border-line bg-surface">
              {images.length > 0 ? (
                <img
                  src={images[activeIndex]}
                  alt={`${project.title} - Image ${activeIndex + 1}`}
                  className={`block w-full object-cover transition-opacity duration-300 ease-in-out ${
                    fade ? 'opacity-0' : 'opacity-100'
                  }`}
                />
              ) : (
                <div className="aspect-video w-full bg-surface-2" />
              )}

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={showPrevious}
                    aria-label="Previous image"
                    className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/60 text-2xl text-white shadow-lg backdrop-blur transition hover:scale-110 hover:bg-black/85"
                  >
                    ‹
                  </button>

                  <button
                    type="button"
                    onClick={showNext}
                    aria-label="Next image"
                    className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/60 text-2xl text-white shadow-lg backdrop-blur transition hover:scale-110 hover:bg-black/85"
                  >
                    ›
                  </button>

                  <span className="absolute bottom-3 right-3 rounded-full bg-black/65 px-3 py-1 text-xs text-white backdrop-blur">
                    {activeIndex + 1} / {images.length}
                  </span>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                {images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => changeImage(index)}
                    aria-label={`Show image ${index + 1}`}
                    aria-current={activeIndex === index ? 'true' : undefined}
                    className={`relative h-20 w-24 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                      activeIndex === index
                        ? 'border-accent opacity-100'
                        : 'border-line opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${project.title} thumbnail ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
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
