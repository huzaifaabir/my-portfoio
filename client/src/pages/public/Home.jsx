import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSite } from '../../context/SiteContext.jsx';
import { publicApi } from '../../lib/services.js';
import { useAsync } from '../../hooks/useAsync.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { imageSrc } from '../../lib/api.js';
import ProjectCard from '../../components/ProjectCard.jsx';
import Reveal from '../../components/Reveal.jsx';
import { ErrorState, PageLoader, SkeletonCards, EmptyState } from '../../components/States.jsx';

// Internal links (/projects) use the router, external ones open normally
function CtaLink({ href, className, children }) {
  if (!href) return null;
  return href.startsWith('/') ? <Link to={href} className={className}>{children}</Link> : <a href={href} className={className}>{children}</a>;
}

export default function Home() {
  const { profile, loading, error, refresh } = useSite();
  const projects = useAsync(() => publicApi.projects(), []);
  useDocumentTitle('');

  const featured = useMemo(() => {
    const list = projects.data?.items || [];
    const starred = list.filter((p) => p.featured);
    return (starred.length ? starred : list).slice(0, 3);
  }, [projects.data]);

  if (loading) return <PageLoader />;
  if (error || !profile) return <div className="pt-28"><ErrorState message={error} onRetry={refresh} /></div>;

  const { hero, about, services = [] } = profile;
  const heroImage = imageSrc(hero.image);

  return (
    <>
      {/* HERO */}
      <section className="relative isolate overflow-hidden pt-32 sm:pt-40">
        <div aria-hidden="true" className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[520px] w-[820px] -translate-x-1/2 rounded-full opacity-30 blur-3xl" style={{ background: 'radial-gradient(closest-side,var(--color-accent),transparent)' }} />
        <div aria-hidden="true" className="pointer-events-none absolute right-0 top-40 -z-10 h-[420px] w-[420px] rounded-full opacity-20 blur-3xl" style={{ background: 'radial-gradient(closest-side,var(--color-accent-2),transparent)' }} />

        <div className="container-x grid items-center gap-14 pb-20 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="animate-[fade-up_.8s_ease_both]">
            {hero.badge && (
              <span className="badge mb-6 gap-2 bg-white/5 text-text">
                <span className="h-2 w-2 rounded-full bg-success shadow-[0_0_12px_var(--color-success)]" />
                {hero.badge}
              </span>
            )}
            <p className="text-lg text-muted">Hi, I am</p>
            <h1 className="mt-2 text-5xl font-extrabold sm:text-6xl lg:text-7xl">
              <span className="gradient-text">{hero.name}</span>
            </h1>
            <p className="mt-4 text-xl font-medium text-text/90 sm:text-2xl">{hero.title}</p>
            {hero.tagline && <p className="mt-6 max-w-xl text-base text-muted sm:text-lg">{hero.tagline}</p>}
            <div className="mt-10 flex flex-wrap gap-3">
              <CtaLink href={hero.primaryHref} className="btn-primary">{hero.primaryLabel}</CtaLink>
              <CtaLink href={hero.secondaryHref} className="btn-ghost">{hero.secondaryLabel}</CtaLink>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md animate-[fade-up_1s_ease_both]">
            <div aria-hidden="true" className="absolute -inset-4 rounded-[2rem] opacity-60 blur-2xl" style={{ background: 'linear-gradient(120deg,var(--color-accent),var(--color-accent-2))' }} />
            <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] border border-line bg-surface">
              {heroImage ? (
                <img src={heroImage} alt={hero.name} className="h-full w-full object-cover object-top" fetchPriority="high" />
              ) : (
                <div className="grid h-full place-items-center text-7xl font-bold gradient-text">HA</div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT SNIPPET */}
      {(about.bio || about.highlights?.length > 0) && (
        <section className="section">
          <div className="container-x grid gap-12 lg:grid-cols-2 lg:items-center">
            <Reveal>
              <p className="eyebrow">About me</p>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Design that works as hard as your message.</h2>
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
            {projects.error && <ErrorState message={projects.error} onRetry={projects.reload} />}
            {!projects.loading && !projects.error && featured.length === 0 && (
              <EmptyState title="Projects are coming soon" text="Check back shortly to see new work." />
            )}
            {featured.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((p, i) => (
                  <Reveal key={p.id} delay={i * 90}><ProjectCard project={p} /></Reveal>
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
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-0 opacity-30" style={{ background: 'radial-gradient(60% 80% at 50% 0%,var(--color-accent),transparent)' }} />
              <h2 className="relative text-3xl font-bold sm:text-4xl">Have a project in mind?</h2>
              <p className="relative mx-auto mt-4 max-w-xl text-muted">Tell me about your idea, timeline and goals, and I will get back to you soon.</p>
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
