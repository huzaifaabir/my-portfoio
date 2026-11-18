
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import {
  faFacebook,
  faInstagram,
  faBehance,
  faLinkedin,
  faYoutube,
  faGithub,
  faXTwitter,
  faTiktok,
  faWhatsapp,
} from '@fortawesome/free-brands-svg-icons';

const SOCIAL_ICONS = {
  facebook: faFacebook,
  instagram: faInstagram,
  behance: faBehance,
  linkedin: faLinkedin,
  youtube: faYoutube,
  github: faGithub,
  twitter: faXTwitter,
  x: faXTwitter,
  tiktok: faTiktok,
  whatsapp: faWhatsapp,
};

const SOCIAL_LABELS = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  behance: 'Behance',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  github: 'GitHub',
  twitter: 'X (Twitter)',
  x: 'X (Twitter)',
  tiktok: 'TikTok',
  whatsapp: 'WhatsApp',
};

export default function SocialLinks({
  socials = [],
  className = '',
}) {
  const validSocials = socials.filter((social) => {
    const platform = String(social.platform || '')
      .trim()
      .toLowerCase();

    const url = String(social.url || '').trim();

    return Boolean(SOCIAL_ICONS[platform] && /^https:\/\/[^\s]+$/i.test(url));
  });

  if (!validSocials.length) return null;

  return (
    <div className={`flex flex-wrap items-center gap-4 ${className}`}>
      {validSocials.map((social, index) => {
        const platform = String(social.platform)
          .trim()
          .toLowerCase();

        const icon = SOCIAL_ICONS[platform];

        return (
          <a
            key={`${platform}-${index}`}
            href={social.url.trim()}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={SOCIAL_LABELS[platform]}
            title={SOCIAL_LABELS[platform]}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-muted transition hover:border-accent hover:text-accent"
          >
            <FontAwesomeIcon
              icon={icon}
              className="text-xl"
            />
          </a>
        );
      })}
    </div>
  );
}
