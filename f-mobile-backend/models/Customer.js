const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true
  },
  email: {
    type: String,
    sparse: true
  },
  address: String,
  telegramUserId: {
    type: String,
    sparse: true
  },
  debt: {
    type: Number,
    default: 0
  },
  totalPurchase: {
    type: Number,
    default: 0
  },
  branches: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
  }],
  active: {
    type: Boolean,
    default: true
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

// Add indexes for performance
customerSchema.index({ phone: 1 });
customerSchema.index({ name: 1 });
customerSchema.index({ branches: 1 });
customerSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Customer', customerSchema);
