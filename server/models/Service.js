const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  price: { type: Number, required: true, min: 0, max: 10000000 },
  description: { type: String, default: '', maxlength: 500 },
}, { _id: false });

const serviceSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, default: '', maxlength: 1000 },
  startingPrice: { type: Number, default: null, min: 0, max: 10000000 },
  packages: { type: [packageSchema], default: [] },
  deliveryTime: { type: String, default: '', maxlength: 100 },
  inclusions: { type: [String], default: [] },
  isActive: { type: Boolean, default: true },
  featured: { type: Boolean, default: false },
  order: { type: Number, default: 0, min: 0, max: 9999 },
}, { timestamps: true });

serviceSchema.index({ isActive: 1, order: 1 });
module.exports = mongoose.model('Service', serviceSchema);
