
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

// Supported social platforms
const SOCIAL_PLATFORMS = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'behance', label: 'Behance' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'github', label: 'GitHub' },
  { value: 'twitter', label: 'X (Twitter)' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'whatsapp', label: 'WhatsApp' },
];

// Shared save logic
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

        {text && (
          <p className="mt-1 text-sm text-muted">{text}</p>
        )}

        {locked && (
          <p className="mt-3 rounded-lg bg-accent-2/10 px-3 py-2 text-xs text-violet-200">
            Only Admins can edit this section.
          </p>
        )}
      </div>

      {children}
    </section>
  );
}

function SaveBar({ saving, disabled, onSave }) {
  return (
    <div className="flex justify-end pt-2">
      <button
        type="button"
        className="btn-primary btn-sm"
        onClick={onSave}
        disabled={saving || disabled}
      >
        {saving ? 'Saving...' : 'Save section'}
      </button>
    </div>
  );
}

// Site Identity Section
function SiteSection({
  siteName,
  footerText,
  logo,
  canEdit,
}) {
  const [form, setForm] = useState({
    siteName: siteName || '',
    footerText: footerText || '',
    logo: logo || { url: '', path: '' },
  });

  const { save, saving } = useSave('site');

  const submit = (e) => {
    e?.preventDefault();

    if (!form.siteName.trim()) return;

    save(form);
  };

  const removeLogo = () => {
    setForm((current) => ({
      ...current,
      logo: { url: '', path: '' },
    }));
  };

  return (
    <SectionCard
      title="Site identity"
      text="Manage your website name and logo. The uploaded logo is used in the Navbar and browser tab favicon."
      locked={!canEdit}
    >
      <form
        onSubmit={submit}
        className="grid gap-5 sm:grid-cols-2"
      >
        <Field label="Site name" htmlFor="s-name" required>
          <Input
            id="s-name"
            value={form.siteName}
            onChange={(e) =>
              setForm((current) => ({
                ...current,
                siteName: e.target.value,
              }))
            }
            maxLength={120}
            disabled={!canEdit}
          />
        </Field>

        <Field label="Footer text" htmlFor="s-foot">
          <Input
            id="s-foot"
            value={form.footerText}
            onChange={(e) =>
              setForm((current) => ({
                ...current,
                footerText: e.target.value,
              }))
            }
            maxLength={300}
            disabled={!canEdit}
          />
        </Field>

        <div className="sm:col-span-2 space-y-3">
          <div>
            <h3 className="text-sm font-semibold">
              Website Logo
            </h3>

            <p className="mt-1 text-xs text-muted">
              Upload a transparent PNG logo. It will be used in the
              Navbar and as the browser favicon.
            </p>
          </div>

          {canEdit ? (
            <div className="w-[100px] max-w-full">
              <ImageUploader
                label="Website logo"
                folder="profile"
                value={form.logo}
                onChange={(img) =>
                  setForm((current) => ({
                    ...current,
                    logo: img,
                  }))
                }
                aspect="aspect-square"
                rounded={false}
                help="PNG recommended."
              />
            </div>
          ) : form.logo?.url ? (
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border border-line bg-surface p-2">
              <img
                src={form.logo.url}
                alt="Website logo preview"
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ) : (
            <p className="text-xs text-muted">
              No website logo uploaded.
            </p>
          )}

          {form.logo?.url && canEdit && (
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={removeLogo}
                disabled={saving}
              >
                Remove logo
              </button>

              <span className="text-xs text-muted">
                Logo removal will take effect after saving.
              </span>
            </div>
          )}
        </div>

        <div className="sm:col-span-2">
          <SaveBar
            saving={saving}
            disabled={!canEdit}
            onSave={submit}
          />
        </div>
      </form>
    </SectionCard>
  );
}

// Hero Section
function HeroSection({ hero, canEdit }) {
  const [form, setForm] = useState({
    ...hero,
    image: hero.image || { url: '', path: '' },
  });

  const { save, saving } = useSave('hero');

  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e?.preventDefault();

    if (!form.name.trim() || !form.title.trim()) return;

    save(form);
  };

  return (
    <SectionCard
      title="Hero section"
      text="The first thing visitors see: your name, role, photo and main buttons."
    >
      <form
        onSubmit={submit}
        className="grid gap-6 lg:grid-cols-[260px_1fr]"
      >
        <ImageUploader
          label="Profile photo"
          folder="profile"
          value={form.image}
          onChange={(img) =>
            setForm((f) => ({ ...f, image: img }))
          }
          aspect="aspect-[4/5]"
          rounded="rounded-2xl"
          help="Portrait photo works best. JPG, PNG or WEBP, max 5 MB."
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Badge text"
            htmlFor="h-badge"
            help="Small label above your name, e.g. Available for new projects"
          >
            <Input
              id="h-badge"
              value={form.badge}
              onChange={set('badge')}
              maxLength={100}
              disabled={!canEdit}
            />
          </Field>

          <Field label="Full name" htmlFor="h-name" required>
            <Input
              id="h-name"
              value={form.name}
              onChange={set('name')}
              maxLength={100}
              disabled={!canEdit}
            />
          </Field>

          <Field label="Job title" htmlFor="h-title" required>
            <Input
              id="h-title"
              value={form.title}
              onChange={set('title')}
              maxLength={100}
              disabled={!canEdit}
            />
          </Field>

          <Field label="Primary button text" htmlFor="h-pl">
            <Input
              id="h-pl"
              value={form.primaryLabel}
              onChange={set('primaryLabel')}
              maxLength={40}
              disabled={!canEdit}
            />
          </Field>

          <Field
            label="Primary button link"
            htmlFor="h-ph"
            help="Internal path like /projects, or a full https:// link"
          >
            <Input
              id="h-ph"
              value={form.primaryHref}
              onChange={set('primaryHref')}
              maxLength={300}
              disabled={!canEdit}
            />
          </Field>

          <Field label="Secondary button text" htmlFor="h-sl">
            <Input
              id="h-sl"
              value={form.secondaryLabel}
              onChange={set('secondaryLabel')}
              maxLength={40}
              disabled={!canEdit}
            />
          </Field>

          <Field label="Secondary button link" htmlFor="h-sh">
            <Input
              id="h-sh"
              value={form.secondaryHref}
              onChange={set('secondaryHref')}
              maxLength={300}
              disabled={!canEdit}
            />
          </Field>

          <div className="sm:col-span-2">
            <Field
              label="Tagline"
              htmlFor="h-tag"
              help="One or two sentences that describe what you do."
            >
              <Textarea
                id="h-tag"
                rows={3}
                value={form.tagline}
                onChange={set('tagline')}
                maxLength={300}
                disabled={!canEdit}
              />
            </Field>
          </div>

          <div className="sm:col-span-2">
            <SaveBar
              saving={saving}
              disabled={!canEdit}
              onSave={submit}
            />
          </div>
        </div>
      </form>
    </SectionCard>
  );
}

// About Section
function AboutSection({ about, canEdit }) {
  const [bio, setBio] = useState(about.bio || '');
  const [highlights, setHighlights] = useState(
    (about.highlights || []).join('\n')
  );

  const { save, saving } = useSave('about');

  const submit = (e) => {
    e?.preventDefault();

    save({
      bio,
      highlights: highlights
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
    });
  };

  return (
    <SectionCard
      title="About me"
      text="Your biography and a few short highlight tags."
    >
      <form onSubmit={submit} className="space-y-5">
        <Field
          label="Biography"
          htmlFor="a-bio"
          help="Up to 3000 characters. Line breaks are kept."
        >
          <Textarea
            id="a-bio"
            rows={7}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={3000}
            disabled={!canEdit}
          />
        </Field>

        <Field
          label="Highlight tags"
          htmlFor="a-hl"
          help="One tag per line, up to 8 tags."
        >
          <Textarea
            id="a-hl"
            rows={4}
            value={highlights}
            onChange={(e) => setHighlights(e.target.value)}
            disabled={!canEdit}
          />
        </Field>

        <SaveBar
          saving={saving}
          disabled={!canEdit}
          onSave={submit}
        />
      </form>
    </SectionCard>
  );
}

// Contact Section
function ContactSection({ contact, canEdit }) {
  const [form, setForm] = useState(contact);
  const { save, saving } = useSave('contact');

  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e?.preventDefault();
    save(form);
  };

  return (
    <SectionCard
      title="Contact information"
      text="Shown on the contact page. Leave a field empty to hide it."
      locked={!canEdit}
    >
      <form
        onSubmit={submit}
        className="grid gap-5 sm:grid-cols-2"
      >
        <Field label="Public email" htmlFor="c-email">
          <Input
            id="c-email"
            type="email"
            value={form.email}
            onChange={set('email')}
            maxLength={160}
            disabled={!canEdit}
          />
        </Field>

        <Field label="Phone" htmlFor="c-phone">
          <Input
            id="c-phone"
            value={form.phone}
            onChange={set('phone')}
            maxLength={30}
            disabled={!canEdit}
          />
        </Field>

        <Field
          label="WhatsApp number"
          htmlFor="c-wa"
          help="Include the country code, e.g. 8801XXXXXXXXX"
        >
          <Input
            id="c-wa"
            value={form.whatsapp}
            onChange={set('whatsapp')}
            maxLength={30}
            disabled={!canEdit}
          />
        </Field>

        <Field label="Location" htmlFor="c-loc">
          <Input
            id="c-loc"
            value={form.location}
            onChange={set('location')}
            maxLength={120}
            disabled={!canEdit}
          />
        </Field>

        <div className="sm:col-span-2">
          <Field
            label="Availability"
            htmlFor="c-av"
            help="e.g. Open for freelance projects"
          >
            <Input
              id="c-av"
              value={form.availability}
              onChange={set('availability')}
              maxLength={120}
              disabled={!canEdit}
            />
          </Field>
        </div>

        <div className="sm:col-span-2">
          <SaveBar
            saving={saving}
            disabled={!canEdit}
            onSave={submit}
          />
        </div>
      </form>
    </SectionCard>
  );
}

// Social Links Section
function SocialsSection({ socials, canEdit }) {
  const [items, setItems] = useState(
    (socials || []).map((s) => ({
      ...s,
      platform: String(s.platform || '').trim().toLowerCase(),
    }))
  );

  const { save, saving } = useSave('socials');
  const toast = useToast();

  const submit = () => {
    const clean = items
      .map((s) => ({
        platform: String(s.platform || '').trim().toLowerCase(),
        url: String(s.url || '').trim(),
      }))
      .filter((s) => s.platform || s.url);

    if (clean.some((s) => !s.platform || !s.url)) {
      return toast.error(
        'Please select a platform and enter its URL.'
      );
    }

    if (
      clean.some(
        (s) => !/^https:\/\/[^\s]+$/i.test(s.url)
      )
    ) {
      return toast.error(
        'Each profile URL must start with https://'
      );
    }

    const platforms = clean.map((s) => s.platform);

    if (new Set(platforms).size !== platforms.length) {
      return toast.error(
        'Each social platform can only be added once.'
      );
    }

    if (
      clean.some(
        (s) =>
          !SOCIAL_PLATFORMS.some(
            (platform) => platform.value === s.platform
          )
      )
    ) {
      return toast.error(
        'Please select a supported social platform.'
      );
    }

    save(clean);
  };

  return (
    <SectionCard
      title="Social links"
      text="Select a platform and enter your profile URL. Each platform can only be added once."
      locked={!canEdit}
    >
      <ListEditor
        items={items}
        onChange={setItems}
        disabled={!canEdit}
        itemLabel="Social link"
        addLabel="Add social link"
        emptyItem={{ platform: '', url: '' }}
        fields={[
          {
            key: 'platform',
            label: 'Platform',
            type: 'select',
            placeholder: 'Select platform',
            options: SOCIAL_PLATFORMS,
            unique: true,
          },
          {
            key: 'url',
            label: 'Profile URL',
            placeholder: 'https://...',
            max: 300,
          },
        ]}
      />

      <SaveBar
        saving={saving}
        disabled={!canEdit}
        onSave={submit}
      />
    </SectionCard>
  );
}

// Main Profile Editor
export default function ProfileEditor() {
  const { profile, loading, error, refresh } = useSite();
  const { can } = useAuth();

  useDocumentTitle('Profile');

  if (loading) return <PageLoader />;

  if (error || !profile) {
    return <ErrorState message={error} onRetry={refresh} />;
  }

  const canSettings = can('manageSettings');

  return (
    <div>
      <PageHeader
        title="Profile & contact"
        text="Update how your portfolio presents you. Each section saves separately."
      />

      <div className="space-y-8">

        {/* Site Identity first */}
        <SiteSection
          key={`s-${profile.updatedAt}`}
          siteName={profile.siteName}
          footerText={profile.footerText}
          logo={profile.logo}
          canEdit={canSettings}
        />

        <HeroSection
          key={`h-${profile.updatedAt}`}
          hero={profile.hero}
          canEdit={can('manageContent')}
        />

        <AboutSection
          key={`a-${profile.updatedAt}`}
          about={profile.about}
          canEdit={can('manageContent')}
        />

        <ContactSection
          key={`c-${profile.updatedAt}`}
          contact={profile.contact}
          canEdit={canSettings}
        />

        <SocialsSection
          key={`socials-${profile.updatedAt}`}
          socials={profile.socials}
          canEdit={canSettings}
        />

      </div>
    </div>
  );
}
