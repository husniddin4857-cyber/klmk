const express = require('express');
const IMEI = require('../models/IMEI');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all IMEI records
router.get('/', auth, async (req, res) => {
  try {
    const imeiRecords = await IMEI.find().sort({ createdAt: -1 });
    res.json({ success: true, data: imeiRecords });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get single IMEI record
router.get('/:id', auth, async (req, res) => {
  try {
    const imei = await IMEI.findById(req.params.id);
    if (!imei) {
      return res.status(404).json({ success: false, error: 'IMEI topilmadi' });
    }
    res.json({ success: true, data: imei });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Search IMEI
router.get('/search/:imei', auth, async (req, res) => {
  try {
    const imei = await IMEI.findOne({ imei: req.params.imei });
    if (!imei) {
      return res.status(404).json({ success: false, error: 'IMEI topilmadi' });
    }
    res.json({ success: true, data: imei });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new IMEI record
router.post('/', auth, async (req, res) => {
  try {
    const { imei, product, status, purchaseDate, saleDate, customer, notes } = req.body;

    if (!imei || !product) {
      return res.status(400).json({ success: false, error: 'IMEI va mahsulot talab qilinadi' });
    }

    // Check if IMEI already exists
    const existingIMEI = await IMEI.findOne({ imei });
    if (existingIMEI) {
      return res.status(400).json({ success: false, error: 'Bu IMEI allaqachon mavjud' });
    }

    const newIMEI = new IMEI({
      imei,
      product,
      status: status || 'available',
      purchaseDate: purchaseDate || new Date(),
      saleDate: saleDate || null,
      customer: customer || '',
      notes: notes || '',
    });

    await newIMEI.save();
    res.json({ success: true, data: newIMEI });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update IMEI record
router.put('/:id', auth, async (req, res) => {
  try {
    const imei = await IMEI.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!imei) {
      return res.status(404).json({ success: false, error: 'IMEI topilmadi' });
    }

    res.json({ success: true, data: imei });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete IMEI record
router.delete('/:id', auth, async (req, res) => {
  try {
    const imei = await IMEI.findByIdAndDelete(req.params.id);

    if (!imei) {
      return res.status(404).json({ success: false, error: 'IMEI topilmadi' });
    }

    res.json({ success: true, message: 'IMEI o\'chirildi' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get IMEI statistics
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const total = await IMEI.countDocuments();
    const available = await IMEI.countDocuments({ status: 'available' });
    const sold = await IMEI.countDocuments({ status: 'sold' });
    const damaged = await IMEI.countDocuments({ status: 'damaged' });
    const lost = await IMEI.countDocuments({ status: 'lost' });

    res.json({
      success: true,
      data: { total, available, sold, damaged, lost }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
