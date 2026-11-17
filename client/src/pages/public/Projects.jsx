import { useMemo, useState } from 'react';
import { publicApi } from '../../lib/services.js';
import { useAsync } from '../../hooks/useAsync.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import ProjectCard from '../../components/ProjectCard.jsx';
import Reveal from '../../components/Reveal.jsx';
import { EmptyState, ErrorState, SkeletonCards } from '../../components/States.jsx';

export default function Projects() {
  const { data, loading, error, reload } = useAsync(() => publicApi.projects(), []);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  useDocumentTitle('Work');

  const items = data?.items || [];
  const categories = useMemo(() => ['All', ...new Set(items.map((p) => p.category).filter(Boolean))], [items]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((p) => {
      if (category !== 'All' && p.category !== category) return false;
      if (!q) return true;
      return [p.title, p.description, p.client, p.category, ...(p.tags || [])].join(' ').toLowerCase().includes(q);
    });
  }, [items, category, search]);

  return (
    <div className="pt-28 sm:pt-32">
      <section className="container-x">
        <Reveal>
          <p className="eyebrow">Portfolio</p>
          <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">Selected work</h1>
          <p className="mt-4 max-w-2xl text-muted">A collection of posters, social media creatives and visual identity projects.</p>
        </Reveal>

        <div className="mt-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={category === c}
                onClick={() => setCategory(c)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${category === c ? 'bg-accent text-white' : 'border border-line text-muted hover:text-white'}`}
              >
                {c}
              </button>
            ))}
          </div>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            aria-label="Search projects"
            className="input md:max-w-xs"
          />
        </div>

        <div className="mt-12 pb-12">
          {loading && <SkeletonCards count={6} />}
          {error && <ErrorState message={error} onRetry={reload} />}
          {!loading && !error && items.length === 0 && (
            <EmptyState title="No projects yet" text="New work will appear here soon." />
          )}
          {!loading && !error && items.length > 0 && shown.length === 0 && (
            <EmptyState title="No matching projects" text="Try a different search or category." />
          )}
          {shown.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((p, i) => (
                <Reveal key={p.id} delay={(i % 3) * 80}><ProjectCard project={p} /></Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
