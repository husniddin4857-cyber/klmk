const express = require('express');
const Sale = require('../models/Sale');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Daily report
router.get('/daily/:date', auth, adminOnly, async (req, res) => {
  try {
    const date = new Date(req.params.date);
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const sales = await Sale.find({
      createdAt: { $gte: date, $lt: nextDate },
      status: 'completed'
    }).populate('branch', 'name');

    const totalSales = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalTransactions = sales.length;

    res.json({
      success: true,
      data: {
        date: req.params.date,
        totalSales,
        totalTransactions,
        averageTransaction: totalTransactions > 0 ? totalSales / totalTransactions : 0,
        sales
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Monthly report
router.get('/monthly/:year/:month', auth, adminOnly, async (req, res) => {
  try {
    const { year, month } = req.params;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const sales = await Sale.find({
      createdAt: { $gte: startDate, $lt: endDate },
      status: 'completed'
    }).populate('branch', 'name');

    const totalSales = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalTransactions = sales.length;

    res.json({
      success: true,
      data: {
        period: `${year}-${month}`,
        totalSales,
        totalTransactions,
        averageTransaction: totalTransactions > 0 ? totalSales / totalTransactions : 0,
        sales
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Branch report
router.get('/branch/:branchId', auth, adminOnly, async (req, res) => {
  try {
    const sales = await Sale.find({
      branch: req.params.branchId,
      status: 'completed'
    }).populate('cashier', 'username');

    const totalSales = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalTransactions = sales.length;

    res.json({
      success: true,
      data: {
        branchId: req.params.branchId,
        totalSales,
        totalTransactions,
        averageTransaction: totalTransactions > 0 ? totalSales / totalTransactions : 0,
        sales
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
