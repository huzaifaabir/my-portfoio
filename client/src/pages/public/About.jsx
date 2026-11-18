
import { Link } from 'react-router-dom';
import { useSite } from '../../context/SiteContext.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { imageSrc } from '../../lib/api.js';
import Reveal from '../../components/Reveal.jsx';
import { ErrorState, PageLoader } from '../../components/States.jsx';

export default function About() {
  const { profile, loading, error, refresh } = useSite();
  useDocumentTitle('About');

  if (loading) return <PageLoader />;
  if (error || !profile) return <div className="pt-28"><ErrorState message={error} onRetry={refresh} /></div>;

  const { about, skills = [], experience = [], services = [], hero, contact, socials = [] } = profile;
  const photo = imageSrc(hero.image);
  const categories = [...new Set(skills.map((s) => s.category).filter(Boolean))];
  const ungrouped = skills.filter((s) => !s.category);

  return (
    <div className="pt-28 sm:pt-32">
      <section className="container-x pb-16">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <Reveal>
            <div className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-[1.75rem] border border-line bg-surface">
              {photo ? <img src={photo} alt={hero.name} className="h-full w-full object-cover object-top" /> : <div className="grid h-full place-items-center text-6xl font-bold gradient-text">HA</div>}
            </div>
          </Reveal>

          <Reveal delay={120}>
            <p className="eyebrow">About</p>
            <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">{hero.name}</h1>
            <p className="mt-2 text-lg text-accent-2">{hero.title}</p>
            <p className="mt-6 whitespace-pre-line text-base leading-relaxed text-muted sm:text-lg">{about.bio || 'Bio coming soon.'}</p>

            {about.highlights?.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-2">
                {about.highlights.map((h) => <span key={h} className="badge px-4 py-1.5 text-text">{h}</span>)}
              </div>
            )}

            {(contact.location || contact.availability) && (
              <dl className="mt-8 grid grid-cols-2 gap-4 text-sm">
                {contact.location && (<div><dt className="text-muted">Based in</dt><dd className="font-medium">{contact.location}</dd></div>)}
                {contact.availability && (<div><dt className="text-muted">Availability</dt><dd className="font-medium">{contact.availability}</dd></div>)}
              </dl>
            )}
          </Reveal>
        </div>
      </section>

      {skills.length > 0 && (
        <section className="section">
          <div className="container-x grid gap-12 lg:grid-cols-2">
            <Reveal>
              <p className="eyebrow">Skills</p>
              <h2 className="mt-3 text-3xl font-bold">Tools & expertise</h2>

              <div className="mt-8 space-y-6">
                {[...categories.map((c) => [c, skills.filter((s) => s.category === c)]), ...(ungrouped.length ? [['Other', ungrouped]] : [])].map(([group, list]) => (
                  <div key={group}>
                    <p className="mb-3 text-sm font-semibold text-muted">{group}</p>
                    <div className="space-y-4">
                      {list.map((s) => (
                        <div key={s.name}>
                          <div className="mb-1.5 flex justify-between text-sm">
                            <span>{s.name}</span>
                            <span className="text-muted">{s.level}%</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label={s.name} aria-valuenow={s.level} aria-valuemin={0} aria-valuemax={100}>
                            <div className="h-full rounded-full transition-[width] duration-1000" style={{ width: `${s.level}%`, background: 'linear-gradient(90deg,var(--color-accent),var(--color-accent-2))' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {experience.length > 0 && (
        <section className="section">
          <div className="container-x">
            <Reveal>
              <p className="eyebrow">Experience</p>
              <h2 className="mt-3 text-3xl font-bold">Where I have worked</h2>
            </Reveal>

            <ol className="relative mt-12 space-y-10 border-l border-line pl-8">
              {experience.map((e, i) => {
                const companyUrl =
                  typeof e.companyUrl === 'string' &&
                  /^https?:\/\/[^\s]+$/i.test(e.companyUrl.trim())
                    ? e.companyUrl.trim()
                    : '';

                return (
                  <li key={`${e.company}-${i}`} className="relative">
                    <Reveal delay={i * 100}>
                      <span className="absolute -left-[37px] top-1.5 h-3 w-3 rounded-full bg-accent shadow-[0_0_14px_var(--color-accent)]" aria-hidden="true" />

                      <p className="text-sm font-medium text-accent">
                        {[e.startYear, e.endYear].filter(Boolean).join(' – ')}
                      </p>

                      <h3 className="mt-1 text-xl font-semibold">
                        {e.role}
                        {e.company && (
                          <>
                            <span className="text-muted"> · </span>
                            {companyUrl ? (
                              <a
                                href={companyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted underline decoration-transparent underline-offset-4 transition hover:text-accent hover:decoration-current"
                                title={`Visit ${e.company}`}
                              >
                                {e.company}
                                <span className="ml-1 text-xs" aria-hidden="true">↗</span>
                              </a>
                            ) : (
                              <span className="text-muted">{e.company}</span>
                            )}
                          </>
                        )}
                      </h3>

                      {e.description && (
                        <p className="mt-2 max-w-2xl text-sm text-muted">{e.description}</p>
                      )}
                    </Reveal>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>
      )}

      {services.length > 0 && (
        <section className="section">
          <div className="container-x">
            <Reveal>
              <p className="eyebrow">Services</p>
              <h2 className="mt-3 text-3xl font-bold">How I can help</h2>
            </Reveal>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((s) => (
                <div key={s.title} className="card card-hover">
                  <p className="text-3xl">{s.icon || '✦'}</p>
                  <h3 className="mt-4 font-semibold">{s.title}</h3>
                  {s.description && <p className="mt-2 text-sm text-muted">{s.description}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section">
        <div className="container-x flex flex-col items-start justify-between gap-8 rounded-[2rem] border border-line bg-surface p-10 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold">Let us work together</h2>
            {socials.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2">
                {socials.map((s) => (
                  <li key={s.platform + s.url}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="badge hover:text-white">{s.platform}</a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Link to="/contact" className="btn-primary">Contact me</Link>
        </div>
      </section>
    </div>
  );
}
