const mongoose = require('mongoose');

const incomeSchema = new mongoose.Schema({
  source: {
    type: String,
    required: true,
    trim: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  currency: {
    type: String,
    enum: ['USD', 'UZS'],
    default: 'USD',
  },
  date: {
    type: Date,
    default: Date.now,
  },
  description: {
    type: String,
    default: '',
  },
  category: {
    type: String,
    enum: ['sales', 'service', 'other'],
    default: 'sales',
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

module.exports = mongoose.model('Income', incomeSchema);
