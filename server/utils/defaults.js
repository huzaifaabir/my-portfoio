// Starting content, used only the first time the database is empty.
// Everything here is editable from the admin dashboard. Replace the sample text with your own.
module.exports = {
  siteName: 'Huzaifa Abir',
  footerText: 'Graphic design for brands, media and campaigns.',
  hero: {
    badge: 'Available for new projects',
    name: 'Huzaifa Abir',
    title: 'Graphic Designer',
    tagline: 'I create clear, striking visuals that help brands and newsrooms connect with their audience.',
    image: { url: '/assets/huzaifa.png', path: '' },
    primaryLabel: 'View my work',
    primaryHref: '/projects',
    secondaryLabel: 'Contact me',
    secondaryHref: '/contact',
  },
  about: {
    bio: 'I am Huzaifa Abir, a graphic designer working on posters, social media creatives and visual identity for news and media organisations. I focus on clean layouts, strong typography and visuals that communicate quickly.',
    highlights: ['Visual direction', 'Layout & typography', 'Social media creatives'],
  },
  contact: { email: '', phone: '', whatsapp: '', location: '', availability: '' },
  socials: [],
  skills: [
    { name: 'Adobe Photoshop', level: 90, category: 'Software' },
    { name: 'Adobe Illustrator', level: 85, category: 'Software' },
    { name: 'Adobe InDesign', level: 80, category: 'Software' },
    { name: 'Typography', level: 85, category: 'Design' },
  ],
  experience: [
    { company: 'Khela TV', role: 'Graphic Designer', startYear: '2024', endYear: 'Present', description: '' },
    { company: 'Odhikar News', role: 'Graphic Designer', startYear: '2026', endYear: 'Present', description: '' },
  ],
  services: [
    { title: 'Poster Design', description: 'Eye-catching posters for news, events and campaigns.', icon: '🖼️' },
    { title: 'Social Media Creatives', description: 'Scroll-stopping post and story designs for digital audiences.', icon: '📱' },
    { title: 'Visual Identity', description: 'Logos, colour systems and brand guidelines.', icon: '✨' },
  ],
};
