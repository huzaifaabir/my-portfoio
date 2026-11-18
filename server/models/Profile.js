const mongoose = require('mongoose');
const { Schema } = mongoose;
const { imageSchema } = require('./_image');

// Single document (key: "main") that holds all editable portfolio content.
const profileSchema = new Schema(
  {
    key: { type: String, default: 'main', unique: true },
    siteName: { type: String, default: 'Huzaifa Abir', maxlength: 120 },
    footerText: { type: String, default: '', maxlength: 300 },
    hero: {
      badge: { type: String, default: '', maxlength: 100 },
      name: { type: String, default: 'Huzaifa Abir', maxlength: 100 },
      title: { type: String, default: 'Graphic Designer', maxlength: 100 },
      tagline: { type: String, default: '', maxlength: 300 },
      image: { type: imageSchema, default: () => ({}) },
      primaryLabel: { type: String, default: 'View my work', maxlength: 40 },
      primaryHref: { type: String, default: '/projects', maxlength: 300 },
      secondaryLabel: { type: String, default: 'Contact me', maxlength: 40 },
      secondaryHref: { type: String, default: '/contact', maxlength: 300 },
    },
    about: {
      bio: { type: String, default: '', maxlength: 3000 },
      highlights: { type: [String], default: [] },
    },
    contact: {
      email: { type: String, default: '', maxlength: 160 },
      phone: { type: String, default: '', maxlength: 30 },
      whatsapp: { type: String, default: '', maxlength: 30 },
      location: { type: String, default: '', maxlength: 120 },
      availability: { type: String, default: '', maxlength: 120 },
    },
    socials: {
      type: [{ platform: { type: String, maxlength: 40 }, url: { type: String, maxlength: 300 }, _id: false }],
      default: [],
    },
    skills: {
      type: [{ name: { type: String, maxlength: 60 }, level: { type: Number, min: 0, max: 100, default: 50 }, category: { type: String, default: '', maxlength: 40 }, _id: false }],
      default: [],
    },
    
experience: {
  type: [{
    company: { type: String, maxlength: 120 },
    companyUrl: { type: String, default: '', maxlength: 600 },
    role: { type: String, maxlength: 120 },
    startYear: { type: String, maxlength: 10 },
    endYear: { type: String, default: 'Present', maxlength: 20 },
    description: { type: String, default: '', maxlength: 600 },
    _id: false,
  }],
  default: [],
},

    services: {
      type: [{ title: { type: String, maxlength: 80 }, description: { type: String, default: '', maxlength: 300 }, icon: { type: String, default: '', maxlength: 20 }, _id: false }],
      default: [],
    },
    updatedBy: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Profile', profileSchema);
