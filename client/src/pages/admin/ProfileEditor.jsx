import { useState } from 'react';
import { useSite } from '../../context/SiteContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { staffApi } from '../../lib/services.js';
import { errorMessage } from '../../lib/format.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { Field, Input, Textarea } from '../../components/Form.jsx';
import ImageUploader from '../../components/ImageUploader.jsx';
import ListEditor from '../../components/admin/ListEditor.jsx';
import { ErrorState, PageLoader } from '../../components/States.jsx';
import PageHeader from './PageHeader.jsx';

// Shared save logic: saves one section, then refreshes the public site data
function useSave(section) {
  const { refresh } = useSite();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const save = async (payload) => {
    setSaving(true);
    try {
      await staffApi.updateSection(section, payload);
      await refresh();
      toast.success('Saved successfully.');
      return true;
    } catch (err) {
      toast.error(errorMessage(err));
      return false;
    } finally {
      setSaving(false);
    }
  };
  return { save, saving };
}

function SectionCard({ title, text, locked, children }) {
  return (
    <section className="card space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        {text && <p className="mt-1 text-sm text-muted">{text}</p>}
        {locked && <p className="mt-3 rounded-lg bg-accent-2/10 px-3 py-2 text-xs text-violet-200">Only Admins can edit this section.</p>}
      </div>
      {children}
    </section>
  );
}

function SaveBar({ saving, disabled, onSave }) {
  return (
    <div className="flex justify-end pt-2">
      <button type="button" className="btn-primary btn-sm" onClick={onSave} disabled={saving || disabled}>
        {saving ? 'Saving...' : 'Save section'}
      </button>
    </div>
  );
}

function HeroSection({ hero, canEdit }) {
  const [form, setForm] = useState({ ...hero, image: hero.image || { url: '', path: '' } });
  const { save, saving } = useSave('hero');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.title.trim()) return;
    save(form);
  };
  return (
    <SectionCard title="Hero section" text="The first thing visitors see: your name, role, photo and main buttons." >
      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <ImageUploader label="Profile photo" folder="profile" value={form.image} onChange={(img) => setForm((f) => ({ ...f, image: img }))} aspect="aspect-[4/5]" rounded="rounded-2xl" help="Portrait photo works best. JPG, PNG or WEBP, max 5 MB." />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Badge text" htmlFor="h-badge" help="Small label above your name, e.g. Available for new projects"><Input id="h-badge" value={form.badge} onChange={set('badge')} maxLength={100} disabled={!canEdit} /></Field>
          <Field label="Full name" htmlFor="h-name" required><Input id="h-name" value={form.name} onChange={set('name')} maxLength={100} disabled={!canEdit} /></Field>
          <Field label="Job title" htmlFor="h-title" required><Input id="h-title" value={form.title} onChange={set('title')} maxLength={100} disabled={!canEdit} /></Field>
          <Field label="Primary button text" htmlFor="h-pl"><Input id="h-pl" value={form.primaryLabel} onChange={set('primaryLabel')} maxLength={40} disabled={!canEdit} /></Field>
          <Field label="Primary button link" htmlFor="h-ph" help="Internal path like /projects, or a full https:// link"><Input id="h-ph" value={form.primaryHref} onChange={set('primaryHref')} maxLength={300} disabled={!canEdit} /></Field>
          <Field label="Secondary button text" htmlFor="h-sl"><Input id="h-sl" value={form.secondaryLabel} onChange={set('secondaryLabel')} maxLength={40} disabled={!canEdit} /></Field>
          <Field label="Secondary button link" htmlFor="h-sh"><Input id="h-sh" value={form.secondaryHref} onChange={set('secondaryHref')} maxLength={300} disabled={!canEdit} /></Field>
          <div className="sm:col-span-2">
            <Field label="Tagline" htmlFor="h-tag" help="One or two sentences that describe what you do."><Textarea id="h-tag" rows={3} value={form.tagline} onChange={set('tagline')} maxLength={300} disabled={!canEdit} /></Field>
          </div>
          <div className="sm:col-span-2"><SaveBar saving={saving} disabled={!canEdit} onSave={submit} /></div>
        </div>
      </form>
    </SectionCard>
  );
}

function AboutSection({ about, canEdit }) {
  const [bio, setBio] = useState(about.bio || '');
  const [highlights, setHighlights] = useState((about.highlights || []).join('\n'));
  const { save, saving } = useSave('about');
  const submit = (e) => {
    e?.preventDefault();
    save({ bio, highlights: highlights.split('\n').map((s) => s.trim()).filter(Boolean) });
  };
  return (
    <SectionCard title="About me" text="Your biography and a few short highlight tags.">
      <form onSubmit={submit} className="space-y-5">
        <Field label="Biography" htmlFor="a-bio" help="Up to 3000 characters. Line breaks are kept."><Textarea id="a-bio" rows={7} value={bio} onChange={(e) => setBio(e.target.value)} maxLength={3000} disabled={!canEdit} /></Field>
        <Field label="Highlight tags" htmlFor="a-hl" help="One tag per line, up to 8 tags."><Textarea id="a-hl" rows={4} value={highlights} onChange={(e) => setHighlights(e.target.value)} disabled={!canEdit} /></Field>
        <SaveBar saving={saving} disabled={!canEdit} onSave={submit} />
      </form>
    </SectionCard>
  );
}

function SiteSection({ siteName, footerText, canEdit }) {
  const [form, setForm] = useState({ siteName, footerText });
  const { save, saving } = useSave('site');
  const submit = (e) => {
    e?.preventDefault();
    if (!form.siteName.trim()) return;
    save(form);
  };
  return (
    <SectionCard title="Site identity" text="Name shown in the navigation bar and page titles." locked={!canEdit}>
      <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
        <Field label="Site name" htmlFor="s-name" required><Input id="s-name" value={form.siteName} onChange={(e) => setForm({ ...form, siteName: e.target.value })} maxLength={120} disabled={!canEdit} /></Field>
        <Field label="Footer text" htmlFor="s-foot"><Input id="s-foot" value={form.footerText} onChange={(e) => setForm({ ...form, footerText: e.target.value })} maxLength={300} disabled={!canEdit} /></Field>
        <div className="sm:col-span-2"><SaveBar saving={saving} disabled={!canEdit} onSave={submit} /></div>
      </form>
    </SectionCard>
  );
}

function ContactSection({ contact, canEdit }) {
  const [form, setForm] = useState(contact);
  const { save, saving } = useSave('contact');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const submit = (e) => {
    e?.preventDefault();
    save(form);
  };
  return (
    <SectionCard title="Contact information" text="Shown on the contact page. Leave a field empty to hide it." locked={!canEdit}>
      <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
        <Field label="Public email" htmlFor="c-email"><Input id="c-email" type="email" value={form.email} onChange={set('email')} maxLength={160} disabled={!canEdit} /></Field>
        <Field label="Phone" htmlFor="c-phone"><Input id="c-phone" value={form.phone} onChange={set('phone')} maxLength={30} disabled={!canEdit} /></Field>
        <Field label="WhatsApp number" htmlFor="c-wa" help="Include the country code, e.g. 8801XXXXXXXXX"><Input id="c-wa" value={form.whatsapp} onChange={set('whatsapp')} maxLength={30} disabled={!canEdit} /></Field>
        <Field label="Location" htmlFor="c-loc"><Input id="c-loc" value={form.location} onChange={set('location')} maxLength={120} disabled={!canEdit} /></Field>
        <div className="sm:col-span-2"><Field label="Availability" htmlFor="c-av" help="e.g. Open for freelance projects"><Input id="c-av" value={form.availability} onChange={set('availability')} maxLength={120} disabled={!canEdit} /></Field></div>
        <div className="sm:col-span-2"><SaveBar saving={saving} disabled={!canEdit} onSave={submit} /></div>
      </form>
    </SectionCard>
  );
}

function SocialsSection({ socials, canEdit }) {
  const [items, setItems] = useState(socials);
  const { save, saving } = useSave('socials');
  const toast = useToast();
  const submit = () => {
    const clean = items
      .map((s) => ({ platform: (s.platform || '').trim(), url: (s.url || '').trim() }))
      .filter((s) => s.platform || s.url);
    if (clean.some((s) => !s.platform || !/^https?:\/\//.test(s.url))) {
      return toast.error('Each social link needs a platform name and a URL starting with https://');
    }
    save(clean);
  };
  return (
    <SectionCard title="Social links" text="Links to your profiles. Each link must start with https://" locked={!canEdit}>
      <ListEditor
        items={items}
        onChange={setItems}
        disabled={!canEdit}
        itemLabel="Link"
        addLabel="Add social link"
        emptyItem={{ platform: '', url: '' }}
        fields={[
          { key: 'platform', label: 'Platform', placeholder: 'e.g. Behance' },
          { key: 'url', label: 'URL', placeholder: 'https://...' },
        ]}
      />
      <SaveBar saving={saving} disabled={!canEdit} onSave={submit} />
    </SectionCard>
  );
}

export default function ProfileEditor() {
  const { profile, loading, error, refresh } = useSite();
  const { can } = useAuth();
  useDocumentTitle('Profile');

  if (loading) return <PageLoader />;
  if (error || !profile) return <ErrorState message={error} onRetry={refresh} />;

  const canSettings = can('manageSettings');
  return (
    <div>
      <PageHeader title="Profile & contact" text="Update how your portfolio presents you. Each section saves separately." />
      <div className="space-y-8">
        <HeroSection key={`h-${profile.updatedAt}`} hero={profile.hero} canEdit={can('manageContent')} />
        <AboutSection key={`a-${profile.updatedAt}`} about={profile.about} canEdit={can('manageContent')} />
        <SiteSection siteName={profile.siteName} footerText={profile.footerText} canEdit={canSettings} />
        <ContactSection contact={profile.contact} canEdit={canSettings} />
        <SocialsSection socials={profile.socials || []} canEdit={canSettings} />
      </div>
    </div>
  );
}
