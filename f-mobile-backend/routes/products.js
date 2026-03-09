const express = require('express');
const Product = require('../models/Product');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Get all products (public - for dashboard)
router.get('/public/all', async (req, res) => {
  try {
    console.log('📦 Public all products endpoint called');
    const products = await Product.find().populate('branch').sort({ createdAt: -1 });
    console.log(`✅ Found ${products.length} products`);
    let totalValue = 0;
    products.forEach(p => {
      const value = p.sellPrice || 0;
      totalValue += value;
      console.log(`  - ${p.name} (IMEI: ${p.imei}): price=${p.sellPrice}, running total=${totalValue}`);
    });
    console.log(`📊 Total Inventory Value: $${totalValue}`);
    res.json({ success: true, data: products });
  } catch (err) {
    console.error('❌ Error fetching products:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get all products
router.get('/', auth, async (req, res) => {
  try {
    const { category, search, branch } = req.query;
    let query = {};

    if (category) query.category = category;
    if (branch) query.branch = branch;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(query).populate('branch').sort({ createdAt: -1 });
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get single product
router.get('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create product
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { name, category, buyPrice, sellPrice, stock, imei, branch } = req.body;

    if (!name || !sellPrice || !branch) {
      return res.status(400).json({ success: false, error: 'Required fields missing' });
    }

    const product = new Product({
      name,
      category: category || 'Boshqa',
      buyPrice: buyPrice || 0,
      sellPrice,
      stock: stock || 0,
      imei: imei || '',
      branch
    });

    await product.save();
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update product
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete product
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
