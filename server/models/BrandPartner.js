
const mongoose = require('mongoose');

const brandPartnerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    logo: {
      url: {
        type: String,
        required: true,
        trim: true,
      },
      path: {
        type: String,
        default: '',
        trim: true,
      },
    },
    website: {
      type: String,
      default: '',
      trim: true,
      maxlength: 600,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
      min: 0,
      max: 9999,
    },
  },
  { timestamps: true }
);

brandPartnerSchema.index({ order: 1, createdAt: 1 });

module.exports = mongoose.model('BrandPartner', brandPartnerSchema);
