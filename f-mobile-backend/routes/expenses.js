const express = require('express');
const Expense = require('../models/Expense');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all expense records (admin only)
router.get('/', auth, async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1 });
    res.json({ success: true, data: expenses });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get single expense record
router.get('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, error: 'Xarajat topilmadi' });
    }
    res.json({ success: true, data: expense });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new expense record
router.post('/', auth, async (req, res) => {
  try {
    const { category, amount, currency, date, description, vendor } = req.body;

    if (!category || !amount) {
      return res.status(400).json({ success: false, error: 'Kategoriya va miqdor talab qilinadi' });
    }

    const expense = new Expense({
      category,
      amount,
      currency: currency || 'USD',
      date: date || new Date(),
      description: description || '',
      vendor: vendor || '',
    });

    await expense.save();
    res.json({ success: true, data: expense });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update expense record
router.put('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!expense) {
      return res.status(404).json({ success: false, error: 'Xarajat topilmadi' });
    }

    res.json({ success: true, data: expense });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete expense record
router.delete('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);

    if (!expense) {
      return res.status(404).json({ success: false, error: 'Xarajat topilmadi' });
    }

    res.json({ success: true, message: 'Xarajat o\'chirildi' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
