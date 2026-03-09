const express = require('express');
const User = require('../models/User');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Get all cashiers (public - for dashboard)
router.get('/public/all', async (req, res) => {
  try {
    const cashiers = await User.find({ role: 'cashier' }).populate('branch', 'name address');
    res.json({ success: true, data: cashiers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get all cashiers
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const cashiers = await User.find({ role: 'cashier' }).populate('branch', 'name address');
    res.json({ success: true, data: cashiers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get cashier by ID
router.get('/:id', auth, adminOnly, async (req, res) => {
  try {
    const cashier = await User.findById(req.params.id).populate('branch');
    if (!cashier) {
      return res.status(404).json({ success: false, error: 'Cashier not found' });
    }
    res.json({ success: true, data: cashier });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create cashier
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { username, password, email, branch } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password required' });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Username already exists' });
    }

    let branchId = null;
    if (branch) {
      const Branch = require('../models/Branch');
      const branchDoc = await Branch.findOne({ name: branch });
      if (branchDoc) {
        branchId = branchDoc._id;
      }
    }

    const cashier = new User({
      username,
      password,
      email,
      role: 'cashier',
      branch: branchId
    });

    await cashier.save();
    res.status(201).json({ success: true, data: cashier });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update cashier
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { branch, password, ...otherData } = req.body;
    
    const cashier = await User.findById(req.params.id);
    if (!cashier) {
      return res.status(404).json({ success: false, error: 'Cashier not found' });
    }
    
    // Update fields
    Object.assign(cashier, otherData);
    
    // If password is provided, it will be hashed by pre-save hook
    if (password) {
      cashier.password = password;
    }
    
    if (branch) {
      const Branch = require('../models/Branch');
      const branchDoc = await Branch.findOne({ name: branch });
      if (branchDoc) {
        cashier.branch = branchDoc._id;
      }
    }

    await cashier.save();
    await cashier.populate('branch', 'name address');

    res.json({ success: true, data: cashier });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete cashier
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const cashier = await User.findByIdAndDelete(req.params.id);

    if (!cashier) {
      return res.status(404).json({ success: false, error: 'Cashier not found' });
    }

    res.json({ success: true, message: 'Cashier deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
