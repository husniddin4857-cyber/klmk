const express = require('express');
const Customer = require('../models/Customer');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Helper function to migrate old branch field to branches array
const migrateCustomer = (customer) => {
  const c = customer.toObject ? customer.toObject() : customer;
  
  // If old branch field exists and branches array is empty, migrate it
  if (c.branch && (!c.branches || c.branches.length === 0)) {
    c.branches = [c.branch];
  }
  
  return c;
};

// Get all customers (public - bot uchun) - MUST be before /:id
router.get('/public/all', async (req, res) => {
  try {
    console.log('📋 Public all customers endpoint called');
    let customers = await Customer.find({ active: true }).populate('branches', 'name');
    
    // Migrate old branch field to branches array
    customers = customers.map(migrateCustomer);
    
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
    let customer = await Customer.findById(req.params.id).populate('branches');
    if (!customer) {
      console.log(`❌ Customer not found: ${req.params.id}`);
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }
    
    // Migrate old branch field to branches array
    customer = migrateCustomer(customer);
    
    console.log(`✅ Found customer: ${customer.name}`);
    res.json({ success: true, data: customer });
  } catch (err) {
    console.error('❌ Error fetching customer:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update customer telegram ID (public - bot uchun)
router.put('/public/:id/telegram', async (req, res) => {
  try {
    const { telegramUserId } = req.body;
    
    if (!telegramUserId) {
      return res.status(400).json({ success: false, error: 'Telegram ID required' });
    }
    
    console.log(`📱 Updating telegram ID for customer ${req.params.id}: ${telegramUserId}`);
    
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { telegramUserId, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }
    
    console.log(`✅ Telegram ID updated for ${customer.name}`);
    res.json({ success: true, data: customer });
  } catch (err) {
    console.error('❌ Error updating telegram ID:', err.message);
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
      // Search for branch ID in branches array OR old branch field
      query.$or = [
        { branches: { $in: [branch] } },
        { branch: branch }
      ];
      console.log('[CUSTOMERS] Filtering by branch:', branch);
    }
    
    if (search) {
      query.$or = query.$or ? [
        ...query.$or,
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ] : [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    console.log('[CUSTOMERS] Query:', JSON.stringify(query));
    let customers = await Customer.find(query).populate('branches', 'name');
    
    // Migrate old branch field to branches array
    customers = customers.map(migrateCustomer);
    
    console.log('[CUSTOMERS] Found customers:', customers.length);
    customers.forEach(c => {
      console.log(`  - ${c.name} (branches: ${c.branches?.map(b => typeof b === 'string' ? b : b._id).join(', ') || 'none'}, branches count: ${c.branches?.length || 0})`);
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
    let customer = await Customer.findById(req.params.id).populate('branches');
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }
    
    // Migrate old branch field to branches array
    customer = migrateCustomer(customer);
    
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
      branches: branch ? [branch] : []
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

// Migration endpoint - convert old branch field to branches array
router.post('/migrate/branch-to-branches', auth, async (req, res) => {
  try {
    console.log('[MIGRATION] Starting branch to branches migration...');
    
    // Find all customers with old branch field
    const customers = await Customer.find({ branch: { $exists: true, $ne: null } });
    console.log(`[MIGRATION] Found ${customers.length} customers with old branch field`);
    
    let updated = 0;
    for (const customer of customers) {
      if (!customer.branches || customer.branches.length === 0) {
        customer.branches = [customer.branch];
        await customer.save();
        updated++;
        console.log(`[MIGRATION] Updated ${customer.name}: branch=${customer.branch} -> branches=[${customer.branch}]`);
      }
    }
    
    console.log(`[MIGRATION] Migration complete: ${updated} customers updated`);
    res.json({ success: true, message: `${updated} customers migrated` });
  } catch (err) {
    console.error('[MIGRATION] Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
