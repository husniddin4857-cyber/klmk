const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  cashier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    price: {
      type: Number,
      default: 0
    },
    originalPrice: {
      type: Number,
      default: 0
    },
    salePrice: {
      type: Number,
      default: 0
    },
    imei: {
      type: String,
      default: ''
    },
    total: {
      type: Number,
      required: true
    }
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  paidAmount: {
    type: Number,
    required: true
  },
  change: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    enum: ['USD', 'UZS', 'BOTH'],
    default: 'USD'
  },
  paymentMethods: [{
    type: {
      type: String,
      enum: ['cash', 'debt', 'click', 'terminal'],
      required: true
    },
    amount: {
      type: Number,
      required: true
    }
  }],
  status: {
    type: String,
    enum: ['completed', 'pending', 'cancelled'],
    default: 'completed'
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for performance
saleSchema.index({ customer: 1 });
saleSchema.index({ branch: 1 });
saleSchema.index({ cashier: 1 });
saleSchema.index({ createdAt: -1 });
saleSchema.index({ status: 1 });

module.exports = mongoose.model('Sale', saleSchema);
