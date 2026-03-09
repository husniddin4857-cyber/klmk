const express = require('express');
const Customer = require('../models/Customer');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all customers (public - bot uchun) - MUST be before /:id
router.get('/public/all', async (req, res) => {
  try {
    console.log('📋 Public all customers endpoint called');
    const customers = await Customer.find({ active: true }).populate('branch', 'name');
    console.log(`✅ Found ${customers.length} customers`);
    res.json({ success: true, data: customers });
  } catch (err) {
    console.error('❌ Error fetching customers:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get single customer by ID (public - bot uchun)
router.get('/public/:id', async (req, res) => {
  try {
    console.log(`🔍 Public customer by ID: ${req.params.id}`);
    const customer = await Customer.findById(req.params.id).populate('branch');
    if (!customer) {
      console.log(`❌ Customer not found: ${req.params.id}`);
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }
    console.log(`✅ Found customer: ${customer.name}`);
    res.json({ success: true, data: customer });
  } catch (err) {
    console.error('❌ Error fetching customer:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get all customers
router.get('/', auth, async (req, res) => {
  try {
    const { branch, search } = req.query;
    console.log('[CUSTOMERS] GET request - branch:', branch, 'search:', search);
    
    let query = { active: true };

    if (branch) {
      query.branch = branch;
      console.log('[CUSTOMERS] Filtering by branch:', branch);
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    console.log('[CUSTOMERS] Query:', JSON.stringify(query));
    const customers = await Customer.find(query).populate('branch', 'name');
    console.log('[CUSTOMERS] Found customers:', customers.length);
    customers.forEach(c => {
      console.log(`  - ${c.name} (branch: ${c.branch?._id || 'none'})`);
    });
    
    res.json({ success: true, data: customers });
  } catch (err) {
    console.error('[CUSTOMERS] Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get single customer
router.get('/:id', auth, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).populate('branch');
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }
    res.json({ success: true, data: customer });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create customer
router.post('/', auth, async (req, res) => {
  try {
    const { name, phone, email, address, branch } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, error: 'Name and phone required' });
    }

    const customer = new Customer({
      name,
      phone,
      email,
      address,
      branch
    });

    await customer.save();
    res.status(201).json({ success: true, data: customer });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update customer
router.put('/:id', auth, async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    res.json({ success: true, data: customer });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete customer
router.delete('/:id', auth, async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);

    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    res.json({ success: true, message: 'Customer deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
