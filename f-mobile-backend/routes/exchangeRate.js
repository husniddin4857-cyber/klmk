const express = require('express');
const ExchangeRate = require('../models/ExchangeRate');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get current exchange rate (public)
router.get('/current', async (req, res) => {
  try {
    let rate = await ExchangeRate.findOne({ currency: 'USD' });
    
    if (!rate) {
      // Default rate if not set
      rate = new ExchangeRate({ currency: 'USD', rate: 12500 });
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
    const rates = await ExchangeRate.find();
    res.json({ success: true, data: rates });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update exchange rate (admin only)
router.put('/update', auth, async (req, res) => {
  try {
    const { currency, rate } = req.body;

    if (!currency || !rate) {
      return res.status(400).json({ success: false, error: 'Currency and rate required' });
    }

    let exchangeRate = await ExchangeRate.findOneAndUpdate(
      { currency },
      { rate, updatedAt: Date.now() },
      { new: true, upsert: true }
    );

    res.json({ success: true, data: exchangeRate });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
