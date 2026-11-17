// Input cleaning + validation for every write endpoint. Whatever is not listed here is dropped.
const HttpError = require('./httpError');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HTTP_URL_RE = /^https?:\/\/[^\s]+$/i;
const FIREBASE_URL_PREFIX = 'https://firebasestorage.googleapis.com/v0/b/';

const str = (v, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const strList = (v, max, itemMax) => (Array.isArray(v) ? v.slice(0, max).map((x) => str(x, itemMax)).filter(Boolean) : []);
const num = (v, min, max, fallback) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback;
};
const bool = (v, fallback = false) => (typeof v === 'boolean' ? v : v === 'true' ? true : v === 'false' ? false : fallback);
const isEmail = (v) => typeof v === 'string' && v.length <= 160 && EMAIL_RE.test(v);
const httpUrl = (v) => {
  const s = str(v, 300);
  return HTTP_URL_RE.test(s) ? s : '';
};
// Links inside the site (/projects) or external http(s) links only
const siteOrHttpLink = (v) => {
  const s = str(v, 300);
  return HTTP_URL_RE.test(s) || /^\/(?!\/)/.test(s) ? s : '';
};

// Image objects must point to our Firebase Storage (or the bundled default under /assets)
function image(v) {
  if (!v || typeof v !== 'object') return { url: '', path: '' };
  const url = str(v.url, 600);
  const path = str(v.path, 300);
  const urlOk = url.startsWith(FIREBASE_URL_PREFIX) || url.startsWith('/assets/');
  const pathOk = path === '' || (path.startsWith('portfolio/') && !path.includes('..'));
  if (!urlOk || !pathOk) throw new HttpError(400, 'Invalid image reference. Upload the image again.');
  return { url, path };
}

function required(value, label) {
  if (!value) throw new HttpError(400, `${label} is required.`);
  return value;
}

const sections = {
  // ---- editor and above -----------------------------------------------------
  hero(b) {
    return {
      badge: str(b.badge, 100),
      name: required(str(b.name, 100), 'Name'),
      title: required(str(b.title, 100), 'Job title'),
      tagline: str(b.tagline, 300),
      image: image(b.image),
      primaryLabel: str(b.primaryLabel, 40),
      primaryHref: siteOrHttpLink(b.primaryHref),
      secondaryLabel: str(b.secondaryLabel, 40),
      secondaryHref: siteOrHttpLink(b.secondaryHref),
    };
  },
  about(b) {
    return { bio: str(b.bio, 3000), highlights: strList(b.highlights, 8, 120) };
  },
  skills(b) {
    const list = Array.isArray(b) ? b : [];
    return list.slice(0, 30)
      .map((s) => ({ name: str(s?.name, 60), level: num(s?.level, 0, 100, 50), category: str(s?.category, 40) }))
      .filter((s) => s.name);
  },
  experience(b) {
    const list = Array.isArray(b) ? b : [];
    return list.slice(0, 20)
      .map((e) => ({
        company: str(e?.company, 120),
        role: str(e?.role, 120),
        startYear: str(e?.startYear, 10),
        endYear: str(e?.endYear, 20) || 'Present',
        description: str(e?.description, 600),
      }))
      .filter((e) => e.company || e.role);
  },
  services(b) {
    const list = Array.isArray(b) ? b : [];
    return list.slice(0, 12)
      .map((s) => ({ title: str(s?.title, 80), description: str(s?.description, 300), icon: str(s?.icon, 20) }))
      .filter((s) => s.title);
  },
  // ---- admin and above ------------------------------------------------------
  contact(b) {
    const email = str(b.email, 160);
    if (email && !isEmail(email)) throw new HttpError(400, 'Please enter a valid contact email.');
    return {
      email,
      phone: str(b.phone, 30),
      whatsapp: str(b.whatsapp, 30),
      location: str(b.location, 120),
      availability: str(b.availability, 120),
    };
  },
  socials(b) {
    const list = Array.isArray(b) ? b : [];
    return list.slice(0, 10)
      .map((s) => ({ platform: str(s?.platform, 40), url: httpUrl(s?.url) }))
      .filter((s) => s.platform && s.url);
  },
  site(b) {
    return { siteName: required(str(b.siteName, 120), 'Site name'), footerText: str(b.footerText, 300) };
  },
};

// Keys that must be written as top-level fields instead of under a section object
const TOP_LEVEL_SECTIONS = new Set(['site']);

const projectFields = (b) => {
  const title = required(str(b.title, 120), 'Project title');
  return {
    title,
    category: str(b.category, 60),
    description: str(b.description, 300),
    details: str(b.details, 5000),
    client: str(b.client, 120),
    tags: strList(b.tags, 10, 30),
    link: httpUrl(b.link),
    image: image(b.image),
    featured: bool(b.featured, false),
    published: bool(b.published, true),
    order: num(b.order, 0, 9999, 0),
  };
};

const messageFields = (b) => {
  const name = str(b.name, 100);
  const email = str(b.email, 160).toLowerCase();
  const message = str(b.message, 3000);
  if (name.length < 2) throw new HttpError(400, 'Please enter your name.');
  if (!isEmail(email)) throw new HttpError(400, 'Please enter a valid email address.');
  if (message.length < 10) throw new HttpError(400, 'Your message should be at least 10 characters.');
  return { name, email, subject: str(b.subject, 150), message };
};

const staffFields = (b) => {
  const email = str(b.email, 160).toLowerCase();
  if (!isEmail(email)) throw new HttpError(400, 'Please enter a valid email address.');
  return { email, name: str(b.name, 120) };
};

module.exports = { sections, TOP_LEVEL_SECTIONS, projectFields, messageFields, staffFields, image, isEmail, str };
