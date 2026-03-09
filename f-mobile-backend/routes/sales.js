const express = require('express');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all sales (public - bot uchun) - MUST be before /:id
router.get('/public/all', async (req, res) => {
  try {
    console.log('📋 Public all sales endpoint called');
    const sales = await Sale.find({})
      .populate('cashier', 'username')
      .populate('branch', 'name')
      .populate('customer', 'name phone')
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${sales.length} sales`);
    res.json({ success: true, data: sales });
  } catch (err) {
    console.error('❌ Error fetching sales:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get all sales
router.get('/', auth, async (req, res) => {
  try {
    const { branch, startDate, endDate } = req.query;
    let query = {};

    if (branch) query.branch = branch;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const sales = await Sale.find(query)
      .populate('cashier', 'username')
      .populate('branch', 'name')
      .populate('customer', 'name phone')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: sales });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create sale
router.post('/', auth, async (req, res) => {
  try {
    const { branch, customer, items, totalAmount, paidAmount, currency, paymentType, notes } = req.body;

    if (!branch || !items || items.length === 0 || !totalAmount) {
      return res.status(400).json({ success: false, error: 'Invalid sale data' });
    }

    // Calculate debt based on payment type
    let debt = 0;
    if (paymentType === 'debt') {
      // Full debt - customer pays nothing
      debt = totalAmount;
    } else if (paymentType === 'split') {
      // 50-50 split - customer pays 50%, rest is debt
      debt = totalAmount / 2;
    } else {
      // Cash payment - debt is only if paid less than total
      debt = Math.max(0, totalAmount - paidAmount);
    }

    // Update product stock
    for (const item of items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: -item.quantity } }
      );
    }

    // Get customer info for Telegram notification
    let customerData = null;
    if (customer) {
      customerData = await Customer.findById(customer);
      console.log('[SALES] Customer data:', customerData);
    }

    // Update customer debt if exists
    if (customer && debt > 0) {
      await Customer.findByIdAndUpdate(
        customer,
        { $inc: { debt: debt, totalPurchase: totalAmount } }
      );
    }

    const sale = new Sale({
      cashier: req.user.id,
      branch,
      customer,
      items,
      totalAmount,
      paidAmount: paymentType === 'debt' ? 0 : (paymentType === 'split' ? totalAmount / 2 : paidAmount),
      change: paymentType === 'debt' ? 0 : (paymentType === 'split' ? 0 : (paidAmount - totalAmount)),
      currency,
      paymentType,
      debt,
      notes
    });

    await sale.save();

    // Send Telegram notification if customer has telegramUserId
    if (customerData && customerData.telegramUserId) {
      console.log('[SALES] Sending Telegram notification to:', customerData.telegramUserId);
      try {
        const itemsText = items.map(item => `${item.quantity}x ${item.product}`).join(', ');
        const paymentTypeText = paymentType === 'cash' ? 'Naqd' : paymentType === 'debt' ? 'Qarz' : '50-50';
        
        const message = `
📦 YANGI SAVDO
${'='*40}

👤 Mijoz: ${customerData.name}
📱 Telefon: ${customerData.phone}

🛍️ Mahsulotlar: ${itemsText}

💰 SUMMA
${'='*40}
Jami: $${totalAmount.toFixed(2)}
To'lov Turi: ${paymentTypeText}
To'langan: $${(paymentType === 'debt' ? 0 : (paymentType === 'split' ? totalAmount / 2 : paidAmount)).toFixed(2)}
Qarz: $${debt.toFixed(2)}

✅ Savdo muvaffaqiyatli yakunlandi!
`;

        // Send to Telegram bot API
        const botToken = process.env.telegram_bot_token;
        console.log('[SALES] Bot token exists:', !!botToken);
        
        if (botToken) {
          const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: customerData.telegramUserId,
              text: message,
              parse_mode: 'HTML'
            })
          });
          
          const telegramData = await telegramResponse.json();
          console.log('[SALES] Telegram response:', telegramData);
          
          if (!telegramData.ok) {
            console.error('[SALES] Telegram error:', telegramData.description);
          } else {
            console.log('[SALES] ✅ Telegram notification sent successfully');
          }
        } else {
          console.log('[SALES] ⚠️ Bot token not found in environment');
        }
      } catch (err) {
        console.error('[SALES] Error sending Telegram notification:', err.message);
      }
    } else {
      console.log('[SALES] ⚠️ No customer data or telegramUserId:', {
        hasCustomerData: !!customerData,
        telegramUserId: customerData?.telegramUserId
      });
    }

    res.status(201).json({ success: true, data: sale });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get sale by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('cashier')
      .populate('branch')
      .populate('customer')
      .populate('items.product');

    if (!sale) {
      return res.status(404).json({ success: false, error: 'Sale not found' });
    }

    res.json({ success: true, data: sale });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

// Delete sale
router.delete('/:id', auth, async (req, res) => {
  try {
    const sale = await Sale.findByIdAndDelete(req.params.id);

    if (!sale) {
      return res.status(404).json({ success: false, error: 'Sale not found' });
    }

    res.json({ success: true, message: 'Sale deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
