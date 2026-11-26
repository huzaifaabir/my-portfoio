import { Link } from 'react-router-dom';
import { useSite } from '../../context/SiteContext.jsx';
import { publicApi } from '../../lib/services.js';
import { useAsync } from '../../hooks/useAsync.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { PageLoader, ErrorState, EmptyState } from '../../components/States.jsx';
import Reveal from '../../components/Reveal.jsx';

const money = (value) => new Intl.NumberFormat('en-BD').format(value);

export default function Services() {
  const { profile } = useSite();
  const { data, loading, error, reload } = useAsync(() => publicApi.services(), []);
  useDocumentTitle('Services & Pricing');
  const items = data?.items || [];
  const whatsapp = String(profile?.contact?.whatsapp || '').replace(/\D/g, '');

  function order(service, pack) {
    if (!whatsapp) return;
    const price = pack ? `৳${money(pack.price)}` : service.startingPrice !== null ? `৳${money(service.startingPrice)}+` : 'Price to be discussed';
    const message = [
      'Hello Huzaifa, I would like to place an order.',
      `Service: ${service.title}`,
      pack ? `Package: ${pack.name}` : '',
      `Price: ${price}`,
      'Please share the next steps.'
    ].filter(Boolean).join('\n');
    window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="pt-28 sm:pt-32">
      <section className="container-x pb-20">
        <Reveal>
          <p className="eyebrow">What I can do for you</p>
          <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">Services & Pricing</h1>
          <p className="mt-4 max-w-2xl text-muted">Choose a service or package to discuss your project and get started.</p>
        </Reveal>
        {loading && <div className="pt-10"><PageLoader /></div>}
        {error && <div className="pt-10"><ErrorState message={error} onRetry={reload} /></div>}
        {!loading && !error && items.length === 0 && <div className="pt-10"><EmptyState title="Services are being updated" text="Please check back soon." /></div>}
        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {items.map((service, index) => (
            <Reveal key={service.id} delay={index * 60}>
              <article className="card card-hover flex h-full flex-col">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold">{service.title}</h2>
                  {service.description && <p className="mt-3 text-sm text-muted">{service.description}</p>}
                  {service.startingPrice !== null && <p className="mt-5 text-2xl font-bold gradient-text">৳{money(service.startingPrice)}<span className="ml-1 text-sm font-normal text-muted">starting from</span></p>}
                  {service.packages?.length > 0 && <div className="mt-5 space-y-3">{service.packages.map((pack) => <div key={pack.name} className="flex items-start justify-between gap-3 border-t border-line pt-3"><div><p className="font-medium">{pack.name}</p>{pack.description && <p className="mt-1 text-xs text-muted">{pack.description}</p>}</div><p className="shrink-0 font-semibold">৳{money(pack.price)}</p></div>)}</div>}
                  {service.deliveryTime && <p className="mt-4 text-xs text-muted">Delivery: {service.deliveryTime}</p>}
                  {service.inclusions?.length > 0 && <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted">{service.inclusions.map((line) => <li key={line}>{line}</li>)}</ul>}
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  {service.packages?.length > 0
                    ? service.packages.map((pack) => <button key={pack.name} className="btn-primary btn-sm" onClick={() => order(service, pack)} disabled={!whatsapp}>Order {pack.name}</button>)
                    : <button className="btn-primary btn-sm" onClick={() => order(service)} disabled={!whatsapp}>Order via WhatsApp</button>}
                </div>
                {!whatsapp && <p className="mt-3 text-xs text-muted">WhatsApp number is not configured yet.</p>}
              </article>
            </Reveal>
          ))}
        </div>
        <p className="mt-10 text-center text-sm text-muted">Need something custom? <Link to="/contact" className="text-accent hover:underline">Get in touch</Link>.</p>
      </section>
    </div>
  );
}
