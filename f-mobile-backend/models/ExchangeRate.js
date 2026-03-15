const mongoose = require('mongoose');

const exchangeRateSchema = new mongoose.Schema({
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'RUB']
  },
  rate: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
exchangeRateSchema.index({ currency: 1, date: -1 });

module.exports = mongoose.model('ExchangeRate', exchangeRateSchema);
