const mongoose = require('mongoose');

const imeiSchema = new mongoose.Schema({
  imei: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: /^\d{15}$/,
  },
  product: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ['available', 'sold', 'damaged', 'lost'],
    default: 'available',
  },
  purchaseDate: {
    type: Date,
    default: Date.now,
  },
  saleDate: {
    type: Date,
    default: null,
  },
  customer: {
    type: String,
    default: '',
  },
  notes: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for faster searches
imeiSchema.index({ imei: 1 });
imeiSchema.index({ status: 1 });
imeiSchema.index({ product: 1 });

module.exports = mongoose.model('IMEI', imeiSchema);
