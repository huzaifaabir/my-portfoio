
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { useSite } from '../../context/SiteContext.jsx';
import { publicApi } from '../../lib/services.js';
import { useAsync } from '../../hooks/useAsync.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { imageSrc } from '../../lib/api.js';

import ProjectCard from '../../components/ProjectCard.jsx';
import Reveal from '../../components/Reveal.jsx';

import {
  ErrorState,
  PageLoader,
  SkeletonCards,
  EmptyState,
} from '../../components/States.jsx';

/* CTA LINK */

function CtaLink({ href, className, children }) {
  if (!href) return null;

  return href.startsWith('/') ? (
    <Link to={href} className={className}>{children}</Link>
  ) : (
    <a href={href} className={className}>{children}</a>
  );
}

/* CINEMATIC NAME */

function AnimatedName({ name }) {
  const letters = useMemo(
    () => Array.from(name || 'HUZAIFA ABIR'),
    [name]
  );

  return (
    <span className="hero-name-animation" aria-label={name || 'HUZAIFA ABIR'}>
      {letters.map((letter, index) => (
        <span
          key={`${letter}-${index}`}
          className="hero-name-char"
          style={{ '--char-index': index }}
          aria-hidden="true"
        >
          {letter === ' ' ? '\u00A0' : letter}
        </span>
      ))}
    </span>
  );
}

/* FLOATING PHOTOSHOP TOOLS */

const photoshopTools = [
  {
    name: 'Move Tool',
    className: 'tool-move',
    icon: <svg viewBox="0 0 48 48" fill="none"><path d="M24 4V44M4 24H44M24 4L17 12M24 4L31 12M24 44L17 36M24 44L31 36M4 24L12 17M4 24L12 31M44 24L36 17M44 24L36 31" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  },
  {
    name: 'Brush Tool',
    className: 'tool-brush',
    icon: <svg viewBox="0 0 48 48" fill="none"><path d="M31 6L42 17L22 37L11 26L31 6Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" /><path d="M11 26C8 30 7 34 9 37C11 40 17 39 20 35M8 42H25" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>,
  },
  {
    name: 'Pen Tool',
    className: 'tool-pen',
    icon: <svg viewBox="0 0 48 48" fill="none"><path d="M24 4L39 19L24 44L9 19L24 4Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" /><path d="M9 19H39M24 4L24 44" stroke="currentColor" strokeWidth="2" /><circle cx="24" cy="19" r="3" fill="currentColor" /></svg>,
  },
  {
    name: 'Crop Tool',
    className: 'tool-crop',
    icon: <svg viewBox="0 0 48 48" fill="none"><path d="M15 5V33C15 35 17 37 19 37H44M5 15H33C35 15 37 17 37 19V44" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  },
  {
    name: 'Type Tool',
    className: 'tool-type',
    icon: <svg viewBox="0 0 48 48" fill="none"><path d="M8 11V6H40V11M24 6V42M16 42H32" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  },
  {
    name: 'Lasso Tool',
    className: 'tool-lasso',
    icon: <svg viewBox="0 0 48 48" fill="none"><path d="M24 7C35 7 43 13 43 21C43 29 35 34 24 34C13 34 5 29 5 21C5 13 13 7 24 7Z" stroke="currentColor" strokeWidth="2.5" strokeDasharray="3 3" /><path d="M18 34C17 39 19 43 23 43C26 43 28 40 27 37" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>,
  },
  {
    name: 'Magic Wand',
    className: 'tool-wand',
    icon: <svg viewBox="0 0 48 48" fill="none"><path d="M9 39L34 14L40 20L15 45L9 39Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" /><path d="M31 5V10M29 7H34M42 29V34M40 31H45M10 5V10M8 7H13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>,
  },
  {
    name: 'Eyedropper',
    className: 'tool-eyedropper',
    icon: <svg viewBox="0 0 48 48" fill="none"><path d="M35 5L43 13L37 19L29 11L35 5Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" /><path d="M29 11L11 29L7 41L19 37L37 19M24 16L32 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  },
];

function FloatingPhotoshopTools() {
  return (
    <div className="hero-tools-layer" aria-hidden="true">
      {photoshopTools.map((tool) => (
        <div key={tool.name} className={`hero-tool-icon ${tool.className}`} title={tool.name}>
          {tool.icon}
        </div>
      ))}
    </div>
  );
}

/* PHOTOSHOP TRANSFORM FRAME */

function TransformOverlay() {
  return (
    <div className="transform-demo-overlay" aria-hidden="true">
      <div className="transform-demo-animation">
        <div className="transform-demo-box">
          <span className="transform-handle handle-tl" />
          <span className="transform-handle handle-tm" />
          <span className="transform-handle handle-tr" />
          <span className="transform-handle handle-ml" />
          <span className="transform-handle handle-mr" />
          <span className="transform-handle handle-bl" />
          <span className="transform-handle handle-bm" />
          <span className="transform-handle handle-br" />
          <span className="transform-center-point" />
        </div>

        <div className="transform-demo-cursor">
          <svg viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M4 2L4 29L11 22L16 35L21 33L16 20L27 20L4 2Z"
              fill="#ec4382"
              stroke="#171717"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

/* HOME PAGE */

export default function Home() {
  const { profile, loading, error, refresh } = useSite();
  const projects = useAsync(() => publicApi.projects(), []);

  useDocumentTitle('');

  const heroRef = useRef(null);
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    const element = heroRef.current;

    if (!element || typeof IntersectionObserver === 'undefined') {
      setHeroVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setHeroVisible(entry.isIntersecting),
      { threshold: 0.12 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const featured = useMemo(() => {
    const list = projects.data?.items || [];
    const starred = list.filter((p) => p.featured);
    return (starred.length ? starred : list).slice(0, 3);
  }, [projects.data]);

  if (loading) return <PageLoader />;

  if (error || !profile) {
    return (
      <div className="pt-28">
        <ErrorState message={error} onRetry={refresh} />
      </div>
    );
  }

  const { hero, about, services = [] } = profile;
  const heroImage = imageSrc(hero.image);

  return (
    <>
      {/* HERO */}

      <section
        ref={heroRef}
        className={`hero-section relative isolate overflow-hidden pt-32 sm:pt-40 ${heroVisible ? 'is-visible' : ''}`}
      >
        <FloatingPhotoshopTools />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[520px] w-[820px] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
          style={{ background: 'radial-gradient(closest-side,var(--color-accent),transparent)' }}
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-40 -z-10 h-[420px] w-[420px] rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(closest-side,var(--color-accent-2),transparent)' }}
        />

        <div className="container-x grid items-center gap-14 pb-20 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative z-[1]">
            {hero.badge && (
              <span className="hero-badge badge mb-6 gap-2 bg-white/5 text-text">
                <span className="h-2 w-2 rounded-full bg-success shadow-[0_0_12px_var(--color-success)]" />
                {hero.badge}
              </span>
            )}

            <p className="hero-intro text-lg text-muted">Hi, I am</p>

            <h1 className="hero-name-heading mt-2 text-5xl font-extrabold sm:text-6xl lg:text-7xl">
              <AnimatedName name={hero.name} />
            </h1>

            <p className="hero-title mt-4 text-xl font-medium text-text/90 sm:text-2xl">
              {hero.title}
            </p>

            {hero.tagline && (
              <p className="hero-tagline mt-6 max-w-xl text-base text-muted sm:text-lg">
                {hero.tagline}
              </p>
            )}

            <div className="hero-actions mt-10 flex flex-wrap gap-3">
              <CtaLink href={hero.primaryHref} className="btn-primary">
                {hero.primaryLabel}
              </CtaLink>
              <CtaLink href={hero.secondaryHref} className="btn-ghost">
                {hero.secondaryLabel}
              </CtaLink>
            </div>
          </div>

          {/* IMAGE + OUTER TRANSFORM FRAME */}

          <div className="hero-image-container relative z-[1] mx-auto w-full max-w-md">
            <div
              aria-hidden="true"
              className="absolute -inset-4 rounded-[2rem] opacity-60 blur-2xl"
              style={{ background: 'linear-gradient(120deg,var(--color-accent),var(--color-accent-2))' }}
            />

            <div className="hero-image-frame relative aspect-[4/5] overflow-hidden rounded-[1.75rem] border border-line bg-surface">
              {heroImage ? (
                <img
                  src={heroImage}
                  alt={hero.name}
                  className="h-full w-full object-cover object-top"
                  fetchPriority="high"
                />
              ) : (
                <div className="grid h-full place-items-center text-7xl font-bold gradient-text">
                  HA
                </div>
              )}
            </div>

            {heroImage && <TransformOverlay />}
          </div>
        </div>
      </section>

      {/* ABOUT */}

      {(about.bio || about.highlights?.length > 0) && (
        <section className="section">
          <div className="container-x grid gap-12 lg:grid-cols-2 lg:items-center">
            <Reveal>
              <p className="eyebrow">About me</p>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                Design that works as hard as your message.
              </h2>
              <p className="mt-5 whitespace-pre-line text-muted">{about.bio}</p>
              <Link to="/about" className="btn-ghost mt-8">Read more about me →</Link>
            </Reveal>

            <Reveal delay={150} className="flex flex-wrap content-start gap-3">
              {(about.highlights || []).map((h) => (
                <span key={h} className="glass px-5 py-3 text-sm font-medium">{h}</span>
              ))}
            </Reveal>
          </div>
        </section>
      )}

      {/* SERVICES */}

      {services.length > 0 && (
        <section className="section">
          <div className="container-x">
            <Reveal>
              <p className="eyebrow">What I do</p>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Services</h2>
            </Reveal>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((s, i) => (
                <Reveal key={s.title} delay={i * 80}>
                  <div className="card card-hover h-full">
                    <p className="text-3xl">{s.icon || '✦'}</p>
                    <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                    {s.description && <p className="mt-2 text-sm text-muted">{s.description}</p>}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FEATURED WORK */}

      <section className="section" id="work">
        <div className="container-x">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <Reveal>
              <p className="eyebrow">Selected work</p>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Featured projects</h2>
            </Reveal>
            <Link to="/projects" className="btn-ghost btn-sm">View all projects</Link>
          </div>

          <div className="mt-12">
            {projects.loading && <SkeletonCards count={3} />}

            {projects.error && (
              <ErrorState message={projects.error} onRetry={projects.reload} />
            )}

            {!projects.loading && !projects.error && featured.length === 0 && (
              <EmptyState title="Projects are coming soon" text="Check back shortly to see new work." />
            )}

            {featured.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((p, i) => (
                  <Reveal key={p.id} delay={i * 90}>
                    <ProjectCard project={p} autoSlide />
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CONTACT CTA */}

      <section className="section">
        <div className="container-x">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2rem] border border-line bg-surface p-10 text-center sm:p-16">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-0 opacity-30"
                style={{ background: 'radial-gradient(60% 80% at 50% 0%,var(--color-accent),transparent)' }}
              />

              <h2 className="relative text-3xl font-bold sm:text-4xl">Have a project in mind?</h2>
              <p className="relative mx-auto mt-4 max-w-xl text-muted">
                Tell me about your idea, timeline and goals, and I will get back to you soon.
              </p>
              <div className="relative mt-8">
                <Link to="/contact" className="btn-primary">Start a conversation</Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
