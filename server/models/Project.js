const mongoose = require('mongoose');
const { imageSchema } = require('./_image');

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    category: { type: String, trim: true, maxlength: 60, default: '', index: true },
    description: { type: String, trim: true, maxlength: 300, default: '' },
    details: { type: String, trim: true, maxlength: 5000, default: '' },
    client: { type: String, trim: true, maxlength: 120, default: '' },
    tags: { type: [String], default: [] },
    link: { type: String, trim: true, maxlength: 300, default: '' },
    image: { type: imageSchema, default: () => ({}) },
    featured: { type: Boolean, default: false, index: true },
    published: { type: Boolean, default: true, index: true },
    order: { type: Number, default: 0, min: 0, max: 9999 },
    createdBy: { type: String, default: '' },
  },
  { timestamps: true }
);

projectSchema.index({ published: 1, order: 1, createdAt: -1 });

module.exports = mongoose.model('Project', projectSchema);
