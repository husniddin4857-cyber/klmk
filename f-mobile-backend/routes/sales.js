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
      .populate('items.product', 'name')
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
      .populate('items.product', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: sales });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create sale
router.post('/', auth, async (req, res) => {
  try {
    const { branch, customer, items, totalAmount, paidAmount, change, currency, paymentMethods, notes } = req.body;

    if (!branch || !items || items.length === 0 || !totalAmount) {
      return res.status(400).json({ success: false, error: 'Invalid sale data' });
    }

    if (!paymentMethods || paymentMethods.length === 0) {
      return res.status(400).json({ success: false, error: 'Payment methods required' });
    }

    // Calculate total paid and debt
    const totalPaid = paymentMethods.reduce((sum, method) => sum + method.amount, 0);
    const debt = Math.max(0, totalAmount - totalPaid);

    // Update product stock and mark IMEIs as used
    for (const item of items) {
      // If IMEI is provided, mark it as used (don't decrement stock separately)
      if (item.imei) {
        try {
          // Get the FRESH product data each time to avoid stale data
          const product = await Product.findById(item.product);
          if (product && product.imeiList && Array.isArray(product.imeiList)) {
            console.log(`[SALES] Product: ${product.name}, Total IMEIs: ${product.imeiList.length}, Looking for IMEI: "${item.imei}", Quantity to mark: ${item.quantity}`);
            
            // Find exactly 'quantity' number of unused IMEIs with this value
            const imeiIndicesToUpdate = [];
            for (let i = 0; i < product.imeiList.length && imeiIndicesToUpdate.length < item.quantity; i++) {
              if (product.imeiList[i] && product.imeiList[i].imei === item.imei && !product.imeiList[i].used) {
                imeiIndicesToUpdate.push(i);
              }
            }
            
            console.log(`[SALES] Found ${imeiIndicesToUpdate.length} unused IMEIs matching "${item.imei}", need to mark ${item.quantity}`);
            
            if (imeiIndicesToUpdate.length > 0) {
              // Update each IMEI individually to ensure proper updates
              for (const index of imeiIndicesToUpdate) {
                const updateResult = await Product.updateOne(
                  { _id: item.product },
                  { $set: { [`imeiList.${index}.used`]: true } }
                );
                console.log(`[SALES] Updated IMEI at index ${index}: ${updateResult.modifiedCount} document(s) modified`);
              }
              console.log(`[SALES] ✅ Successfully marked ${imeiIndicesToUpdate.length} IMEIs as used (out of ${item.quantity} requested)`);
              
              if (imeiIndicesToUpdate.length < item.quantity) {
                console.warn(`[SALES] ⚠️ Warning: Only marked ${imeiIndicesToUpdate.length} IMEIs but ${item.quantity} were requested`);
              }
            } else {
              console.warn(`[SALES] ⚠️ No unused IMEIs found matching "${item.imei}" for product ${item.product}`);
            }
          } else {
            console.log(`[SALES] No imeiList found for product ${item.product}`);
          }
        } catch (err) {
          console.error(`[SALES] Error updating IMEI for product ${item.product}:`, err.message);
          throw err;
        }
      } else {
        // If no IMEI, just decrement stock
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: -item.quantity } }
        );
      }
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
    } else if (customer) {
      // Even if no debt, update totalPurchase
      await Customer.findByIdAndUpdate(
        customer,
        { $inc: { totalPurchase: totalAmount } }
      );
    }

    const sale = new Sale({
      cashier: req.user.id,
      branch,
      customer,
      items,
      totalAmount,
      paidAmount: totalPaid,
      change: Math.max(0, change || 0),
      currency,
      paymentMethods,
      notes
    });

    await sale.save();

    // Send Telegram notification via webhook
    if (customer) {
      try {
        const itemsForWebhook = items.map(item => ({
          product_name: item.product?.name || 'Mahsulot',
          quantity: item.quantity,
          price: item.price,
          total: item.total
        }));

        const webhookData = {
          customer_id: customer,
          customer_name: customerData?.name || 'Noma\'lum',
          items: itemsForWebhook,
          total_amount: totalAmount,
          paid_amount: totalPaid
        };

        console.log('[WEBHOOK] Sending to bot:', webhookData);
        
        // Send to bot webhook
        await fetch('http://localhost:5002/webhook/sale', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookData)
        }).catch(err => console.log('[WEBHOOK] Error:', err.message));
      } catch (err) {
        console.log('[WEBHOOK] Error sending:', err.message);
      }
    }

    // Send Telegram notification if customer has telegramUserId
    if (customerData && customerData.telegramUserId) {
      console.log('[SALES] Sending Telegram notification to:', customerData.telegramUserId);
      try {
        const itemsText = items.map(item => `${item.quantity}x ${item.product}`).join(', ');
        const paymentMethodsText = paymentMethods.map(m => {
          const typeText = m.type === 'cash' ? 'Naqd' : m.type === 'debt' ? 'Qarz' : m.type === 'click' ? 'Click' : 'Terminal';
          return `${typeText}: ${m.amount.toFixed(2)}`;
        }).join(', ');
        
        const message = `
📦 YANGI SAVDO
${'='*40}

👤 Mijoz: ${customerData.name}
📱 Telefon: ${customerData.phone}

🛍️ Mahsulotlar: ${itemsText}

💰 SUMMA
${'='*40}
Jami: ${totalAmount.toFixed(2)}
To'lov Turlari: ${paymentMethodsText}
Qarz: ${debt.toFixed(2)}

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
