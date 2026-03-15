const express = require('express');
const ExchangeRate = require('../models/ExchangeRate');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get current exchange rate (public)
router.get('/current', async (req, res) => {
  try {
    let rate = await ExchangeRate.findOne({ currency: 'USD' }).sort({ date: -1 });
    
    if (!rate) {
      // Default rate if not set
      rate = new ExchangeRate({ 
        currency: 'USD', 
        rate: 12500,
        date: new Date(),
        notes: 'Default rate'
      });
      await rate.save();
    }
    
    res.json({ success: true, data: rate });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get all rates (public)
router.get('/all', async (req, res) => {
  try {
    const rates = await ExchangeRate.find({ currency: 'USD' }).sort({ date: -1 }).limit(30);
    res.json({ success: true, data: rates });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update exchange rate (admin only)
router.put('/update', auth, async (req, res) => {
  try {
    const { rate, notes } = req.body;

    if (!rate) {
      return res.status(400).json({ success: false, error: 'Kurs miqdori talab qilinadi' });
    }

    if (isNaN(rate) || rate <= 0) {
      return res.status(400).json({ success: false, error: 'Kurs miqdori noto\'g\'ri' });
    }

    // Create new rate record
    const newRate = new ExchangeRate({
      currency: 'USD',
      rate: parseFloat(rate),
      date: new Date(),
      notes: notes || ''
    });

    await newRate.save();
    res.json({ success: true, data: newRate });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get rate history
router.get('/history/:days', auth, async (req, res) => {
  try {
    const days = parseInt(req.params.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const rates = await ExchangeRate.find({
      currency: 'USD',
      date: { $gte: startDate }
    }).sort({ date: -1 });

    res.json({ success: true, data: rates });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
