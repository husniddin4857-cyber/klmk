const express = require('express');
const Branch = require('../models/Branch');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Get all branches (public - for dashboard)
router.get('/public/all', async (req, res) => {
  try {
    const branches = await Branch.find();
    res.json({ success: true, data: branches });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get all branches
router.get('/', auth, async (req, res) => {
  try {
    const branches = await Branch.find();
    res.json({ success: true, data: branches });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get single branch
router.get('/:id', auth, async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) {
      return res.status(404).json({ success: false, error: 'Branch not found' });
    }
    res.json({ success: true, data: branch });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create branch
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { name, address } = req.body;

    if (!name || !address) {
      return res.status(400).json({ success: false, error: 'All fields required' });
    }

    const branch = new Branch({ name, address });
    await branch.save();

    res.status(201).json({ success: true, data: branch });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update branch
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const branch = await Branch.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );

    if (!branch) {
      return res.status(404).json({ success: false, error: 'Branch not found' });
    }

    res.json({ success: true, data: branch });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete branch
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const branch = await Branch.findByIdAndDelete(req.params.id);

    if (!branch) {
      return res.status(404).json({ success: false, error: 'Branch not found' });
    }

    res.json({ success: true, message: 'Branch deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
