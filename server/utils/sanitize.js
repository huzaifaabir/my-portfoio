
// Input cleaning + validation for every write endpoint.
// Whatever is not listed here is dropped.

const HttpError = require('./httpError');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HTTP_URL_RE = /^https?:\/\/[^\s]+$/i;

const str = (v, max = 200) =>
  typeof v === 'string' ? v.trim().slice(0, max) : '';

const strList = (v, max, itemMax) =>
  Array.isArray(v)
    ? v.slice(0, max).map((x) => str(x, itemMax)).filter(Boolean)
    : [];

const num = (v, min, max, fallback) => {
  const n = Number(v);

  return Number.isFinite(n)
    ? Math.min(max, Math.max(min, Math.round(n)))
    : fallback;
};

const bool = (v, fallback = false) =>
  typeof v === 'boolean'
    ? v
    : v === 'true'
      ? true
      : v === 'false'
        ? false
        : fallback;

const isEmail = (v) =>
  typeof v === 'string' && v.length <= 160 && EMAIL_RE.test(v);

const httpUrl = (v) => {
  const s = str(v, 600);
  return HTTP_URL_RE.test(s) ? s : '';
};

// Links inside the site or external HTTP(S) links only.
const siteOrHttpLink = (v) => {
  const s = str(v, 300);
  return HTTP_URL_RE.test(s) || /^\/(?!\/)/.test(s) ? s : '';
};

// Accept ImageKit URLs, Firebase Storage URLs and bundled local assets.
function image(v) {
  // Missing or empty image is valid.
  if (
    v == null ||
    v === '' ||
    (
      typeof v === 'object' &&
      !Array.isArray(v) &&
      !str(v.url, 600) &&
      !str(v.path, 300)
    )
  ) {
    return { url: '', path: '' };
  }

  if (typeof v !== 'object' || Array.isArray(v)) {
    throw new HttpError(
      400,
      'Invalid image reference. Upload the image again.'
    );
  }

  const url = str(v.url, 600);
  const path = str(v.path, 300);

  let validUrl = false;

  try {
    const parsedUrl = new URL(url);

    const isHttps = parsedUrl.protocol === 'https:';

    const isImageKitHost =
      parsedUrl.hostname === 'ik.imagekit.io' ||
      parsedUrl.hostname.endsWith('.imagekit.io');

    const isFirebaseHost =
      parsedUrl.hostname === 'firebasestorage.googleapis.com';

    validUrl =
      isHttps &&
      (isImageKitHost || isFirebaseHost);
  } catch {
    validUrl = /^\/assets\/[^\s]+$/i.test(url);
  }

  const pathOk =
    path === '' ||
    (
      !path.includes('..') &&
      !path.includes('\\') &&
      !path.startsWith('/') &&
      /^[a-zA-Z0-9/_-]+$/.test(path)
    );

  if (!validUrl || !pathOk) {
    throw new HttpError(
      400,
      'Invalid image reference. Upload the image again.'
    );
  }

  return { url, path };
}

function required(value, label) {
  if (!value) {
    throw new HttpError(400, `${label} is required.`);
  }

  return value;
}

const sections = {
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
    return {
      bio: str(b.bio, 3000),
      highlights: strList(b.highlights, 8, 120),
    };
  },

  skills(b) {
    const list = Array.isArray(b) ? b : [];

    return list
      .slice(0, 30)
      .map((s) => ({
        name: str(s?.name, 60),
        level: num(s?.level, 0, 100, 50),
        category: str(s?.category, 40),
      }))
      .filter((s) => s.name);
  },

  experience(b) {
    const list = Array.isArray(b) ? b : [];

    return list
      .slice(0, 20)
      .map((e) => {
        const companyUrl = str(e?.companyUrl, 600);

        if (companyUrl && !HTTP_URL_RE.test(companyUrl)) {
          throw new HttpError(
            400,
            'Company link must start with http:// or https://'
          );
        }

        return {
          company: str(e?.company, 120),
          companyUrl,
          role: str(e?.role, 120),
          startYear: str(e?.startYear, 10),
          endYear: str(e?.endYear, 20) || 'Present',
          description: str(e?.description, 600),
        };
      })
      .filter((e) => e.company || e.role);
  },

  services(b) {
    const list = Array.isArray(b) ? b : [];

    return list
      .slice(0, 12)
      .map((s) => ({
        title: str(s?.title, 80),
        description: str(s?.description, 300),
        icon: str(s?.icon, 20),
      }))
      .filter((s) => s.title);
  },

  contact(b) {
    const email = str(b.email, 160);

    if (email && !isEmail(email)) {
      throw new HttpError(400, 'Please enter a valid contact email.');
    }

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

    return list
      .slice(0, 10)
      .map((s) => ({
        platform: str(s?.platform, 40),
        url: httpUrl(s?.url),
      }))
      .filter((s) => s.platform && s.url);
  },

  site(b) {
    return {
      siteName: required(str(b.siteName, 120), 'Site name'),
      footerText: str(b.footerText, 300),
      logo: image(b.logo),
    };
  },
};

const TOP_LEVEL_SECTIONS = new Set(['site']);

// Project fields with multiple image support.
const projectFields = (b) => {
  const title = required(str(b.title, 120), 'Project title');

  const clientUrl = str(b.clientUrl, 600);

  if (clientUrl && !HTTP_URL_RE.test(clientUrl)) {
    throw new HttpError(
      400,
      'Client website must start with http:// or https://'
    );
  }

  const link = str(b.link, 300);

  if (link && !HTTP_URL_RE.test(link)) {
    throw new HttpError(
      400,
      'Project link must start with http:// or https://'
    );
  }

  // Support up to 20 images per project.
  const images = Array.isArray(b.images)
    ? b.images
        .slice(0, 20)
        .map((item) => image(item))
        .filter((item) => item.url)
    : [];

  // Keep compatibility with projects using the old single image field.
  const legacyImage = image(b.image);

  // Use the legacy image if no new images array is provided.
  const finalImages =
    images.length > 0
      ? images
      : legacyImage.url
        ? [legacyImage]
        : [];

  return {
    title,
    category: str(b.category, 60),
    description: str(b.description, 300),
    details: str(b.details, 5000),
    client: str(b.client, 120),
    clientUrl,
    tags: strList(b.tags, 10, 30),
    link,

    // New multiple images field.
    images: finalImages,

    // First image remains available for older frontend components.
    image: finalImages[0] || { url: '', path: '' },

    featured: bool(b.featured, false),
    published: bool(b.published, true),
    order: num(b.order, 0, 9999, 0),
  };
};

const messageFields = (b) => {
  const name = str(b.name, 100);
  const email = str(b.email, 160).toLowerCase();
  const message = str(b.message, 3000);

  if (name.length < 2) {
    throw new HttpError(400, 'Please enter your name.');
  }

  if (!isEmail(email)) {
    throw new HttpError(400, 'Please enter a valid email address.');
  }

  if (message.length < 10) {
    throw new HttpError(
      400,
      'Your message should be at least 10 characters.'
    );
  }

  return {
    name,
    email,
    subject: str(b.subject, 150),
    message,
  };
};

const staffFields = (b) => {
  const email = str(b.email, 160).toLowerCase();

  if (!isEmail(email)) {
    throw new HttpError(400, 'Please enter a valid email address.');
  }

  return {
    email,
    name: str(b.name, 120),
  };
};

module.exports = {
  sections,
  TOP_LEVEL_SECTIONS,
  projectFields,
  messageFields,
  staffFields,
  image,
  isEmail,
  str,
};
