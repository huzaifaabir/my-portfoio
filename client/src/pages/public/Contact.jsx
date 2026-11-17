import { useState } from 'react';
import { publicApi } from '../../lib/services.js';
import { useSite } from '../../context/SiteContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { errorMessage, isEmail } from '../../lib/format.js';
import { Field, Input, Textarea } from '../../components/Form.jsx';
import Reveal from '../../components/Reveal.jsx';
import { ErrorState, PageLoader } from '../../components/States.jsx';

const EMPTY = { name: '', email: '', subject: '', message: '', website: '' };

// Client-side checks mirror the server rules. The server is the real gatekeeper.
function validate(v) {
  const e = {};
  if (v.name.trim().length < 2) e.name = 'Please enter your name.';
  if (!isEmail(v.email.trim())) e.email = 'Please enter a valid email address.';
  if (v.message.trim().length < 10) e.message = 'Your message should be at least 10 characters.';
  return e;
}

export default function Contact() {
  const { profile, loading, error, refresh } = useSite();
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  useDocumentTitle('Contact');

  if (loading) return <PageLoader />;
  if (error || !profile) return <div className="pt-28"><ErrorState message={error} onRetry={refresh} /></div>;

  const { contact, socials = [] } = profile;
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSending(true);
    try {
      await publicApi.sendMessage({ ...form, name: form.name.trim(), email: form.email.trim() });
      setSent(true);
      setForm(EMPTY);
      toast.success('Message sent. Thank you!');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="pt-28 sm:pt-32">
      <section className="container-x pb-20">
        <Reveal>
          <p className="eyebrow">Contact</p>
          <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">Let us create something together</h1>
          <p className="mt-4 max-w-2xl text-muted">Share a few details about your project and I will reply as soon as possible.</p>
        </Reveal>

        <div className="mt-14 grid gap-10 lg:grid-cols-[1.3fr_1fr]">
          <Reveal>
            {sent ? (
              <div className="card text-center">
                <p className="text-5xl">✅</p>
                <h2 className="mt-4 text-2xl font-bold">Thanks for reaching out!</h2>
                <p className="mt-2 text-muted">Your message has been received.</p>
                <button className="btn-ghost mt-6" onClick={() => setSent(false)}>Send another message</button>
              </div>
            ) : (
              <form onSubmit={submit} noValidate className="card space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Your name" htmlFor="c-name" required error={errors.name}>
                    <Input id="c-name" autoComplete="name" value={form.name} onChange={set('name')} invalid={!!errors.name} maxLength={100} />
                  </Field>
                  <Field label="Email" htmlFor="c-email" required error={errors.email}>
                    <Input id="c-email" type="email" autoComplete="email" value={form.email} onChange={set('email')} invalid={!!errors.email} maxLength={160} />
                  </Field>
                </div>
                <Field label="Subject" htmlFor="c-subject">
                  <Input id="c-subject" value={form.subject} onChange={set('subject')} maxLength={150} placeholder="e.g. Poster design for an event" />
                </Field>
                <Field label="Message" htmlFor="c-message" required error={errors.message}>
                  <Textarea id="c-message" rows={6} value={form.message} onChange={set('message')} invalid={!!errors.message} maxLength={3000} placeholder="Tell me about your project..." />
                </Field>
                {/* Honeypot: hidden from people, bots often fill it */}
                <div className="hidden" aria-hidden="true">
                  <label>Website <input tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} /></label>
                </div>
                <button type="submit" className="btn-primary w-full sm:w-auto" disabled={sending}>
                  {sending ? 'Sending...' : 'Send message'}
                </button>
              </form>
            )}
          </Reveal>

          <Reveal delay={120} className="space-y-6">
            <div className="card space-y-5">
              <h2 className="text-lg font-semibold">Contact details</h2>
              {contact.email && <InfoRow label="Email" value={contact.email} href={`mailto:${contact.email}`} />}
              {contact.phone && <InfoRow label="Phone" value={contact.phone} href={`tel:${contact.phone.replace(/\s/g, '')}`} />}
              {contact.whatsapp && <InfoRow label="WhatsApp" value={contact.whatsapp} href={`https://wa.me/${contact.whatsapp.replace(/\D/g, '')}`} />}
              {contact.location && <InfoRow label="Location" value={contact.location} />}
              {contact.availability && <InfoRow label="Availability" value={contact.availability} />}
              {!contact.email && !contact.phone && !contact.whatsapp && (
                <p className="text-sm text-muted">Direct contact details will be added soon. Please use the form.</p>
              )}
            </div>
            {socials.length > 0 && (
              <div className="card">
                <h2 className="mb-4 text-lg font-semibold">Follow my work</h2>
                <ul className="flex flex-wrap gap-2">
                  {socials.map((s) => (
                    <li key={s.platform + s.url}><a href={s.url} target="_blank" rel="noopener noreferrer" className="badge hover:text-white">{s.platform}</a></li>
                  ))}
                </ul>
              </div>
            )}
          </Reveal>
        </div>
      </section>
    </div>
  );
}

function InfoRow({ label, value, href }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
      {href ? <a href={href} className="mt-1 block break-all font-medium hover:text-accent">{value}</a> : <p className="mt-1 font-medium">{value}</p>}
    </div>
  );
}
