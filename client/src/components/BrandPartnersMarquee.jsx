import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { publicApi } from '../lib/services.js';
import { useAsync } from '../hooks/useAsync.js';
import Reveal from './Reveal.jsx';

export default function BrandPartnersMarquee() {
  const { data } = useAsync(() => publicApi.brandPartners(), []);
  const partners = useMemo(() => data?.items || [], [data]);
  if (!partners.length) return null;

  const repeated = [...partners, ...partners];

  return (
    <section className="border-y border-line/70 py-9 sm:py-12" aria-label="Brands I’ve worked with">
      <div className="container-x mb-6 text-center">
        <Reveal>
          <p className="eyebrow">Selected clients &amp; brands</p>
          <h2 className="mt-2 text-xl font-semibold sm:text-2xl">Brands I’ve Worked With</h2>
        </Reveal>
      </div>
      <div className="brand-marquee">
        <div className="brand-marquee-track">
          {repeated.map((partner, index) => {
            const logo = partner.logo?.url;
            const content = (
              <div className="brand-marquee-logo" key={`${partner.id}-${index}`}>
                {logo ? <img src={logo} alt={partner.name} loading="lazy" /> : <span className="text-sm font-semibold text-muted">{partner.name}</span>}
              </div>
            );
            return partner.website
              ? <a key={`${partner.id}-${index}`} href={partner.website} target="_blank" rel="noreferrer" aria-label={partner.name}>{content}</a>
              : <div key={`${partner.id}-${index}`}>{content}</div>;
          })}
        </div>
      </div>
    </section>
  );
}
