const express = require('express');
const Income = require('../models/Income');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all income records (admin only)
router.get('/', auth, async (req, res) => {
  try {
    const incomes = await Income.find().sort({ date: -1 });
    res.json({ success: true, data: incomes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get single income record
router.get('/:id', auth, async (req, res) => {
  try {
    const income = await Income.findById(req.params.id);
    if (!income) {
      return res.status(404).json({ success: false, error: 'Kirim topilmadi' });
    }
    res.json({ success: true, data: income });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new income record
router.post('/', auth, async (req, res) => {
  try {
    const { source, amount, currency, date, description, category } = req.body;

    if (!source || !amount) {
      return res.status(400).json({ success: false, error: 'Manba va miqdor talab qilinadi' });
    }

    const income = new Income({
      source,
      amount,
      currency: currency || 'USD',
      date: date || new Date(),
      description: description || '',
      category: category || 'sales',
    });

    await income.save();
    res.json({ success: true, data: income });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update income record
router.put('/:id', auth, async (req, res) => {
  try {
    const income = await Income.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!income) {
      return res.status(404).json({ success: false, error: 'Kirim topilmadi' });
    }

    res.json({ success: true, data: income });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete income record
router.delete('/:id', auth, async (req, res) => {
  try {
    const income = await Income.findByIdAndDelete(req.params.id);

    if (!income) {
      return res.status(404).json({ success: false, error: 'Kirim topilmadi' });
    }

    res.json({ success: true, message: 'Kirim o\'chirildi' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
