const mongoose = require('mongoose');

const exchangeRateSchema = new mongoose.Schema({
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'RUB']
  },
  rate: {
    type: Number,
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ExchangeRate', exchangeRateSchema);
