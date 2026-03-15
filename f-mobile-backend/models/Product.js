const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true
  },
  buyPrice: {
    type: Number,
    required: true
  },
  sellPrice: {
    type: Number,
    required: true
  },
  discountPrice: {
    type: Number,
    default: null
  },
  stock: {
    type: Number,
    default: 0
  },
  imei: {
    type: String,
    default: ''
  },
  imeiList: [{
    imei: {
      type: String,
      required: true
    },
    used: {
      type: Boolean,
      default: false
    }
  }],
  barcode: {
    type: String,
    unique: true,
    sparse: true
  },
  branch: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  isMainWarehouse: {
    type: Boolean,
    default: false
  },
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
productSchema.index({ name: 1 });
productSchema.index({ branch: 1 });
productSchema.index({ category: 1 });
productSchema.index({ 'imeiList.imei': 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ isMainWarehouse: 1 });

module.exports = mongoose.model('Product', productSchema);
