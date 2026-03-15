const express = require('express');
const Sale = require('../models/Sale');
const Income = require('../models/Income');
const Expense = require('../models/Expense');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Get general reports (admin only)
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    // Get sales data
    const sales = await Sale.find({ status: 'completed', ...dateFilter })
      .populate('cashier', 'username')
      .populate('branch', 'name')
      .populate('customer', 'name');

    // Get income data
    const incomes = await Income.find(dateFilter);

    // Get expense data
    const expenses = await Expense.find(dateFilter);

    // Calculate totals
    const totalSales = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const totalIncome = incomes.reduce((sum, i) => sum + (i.amount || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const profit = totalIncome - totalExpenses;

    // Get top products
    const topProducts = [];
    const productMap = {};
    sales.forEach(sale => {
      if (sale.items) {
        sale.items.forEach(item => {
          const key = item.product?.toString() || 'unknown';
          if (!productMap[key]) {
            productMap[key] = { name: item.product?.name || 'Unknown', quantity: 0, revenue: 0 };
          }
          productMap[key].quantity += item.quantity || 0;
          productMap[key].revenue += item.total || 0;
        });
      }
    });
    Object.values(productMap).forEach(p => topProducts.push(p));
    topProducts.sort((a, b) => b.revenue - a.revenue);

    // Get top cashiers
    const topCashiers = [];
    const cashierMap = {};
    sales.forEach(sale => {
      const cashierId = sale.cashier?._id?.toString() || 'unknown';
      const cashierName = sale.cashier?.username || 'Unknown';
      if (!cashierMap[cashierId]) {
        cashierMap[cashierId] = { name: cashierName, sales: 0, amount: 0 };
      }
      cashierMap[cashierId].sales += 1;
      cashierMap[cashierId].amount += sale.totalAmount || 0;
    });
    Object.values(cashierMap).forEach(c => topCashiers.push(c));
    topCashiers.sort((a, b) => b.amount - a.amount);

    res.json({
      success: true,
      data: {
        totalSales,
        totalIncome,
        totalExpenses,
        profit,
        totalTransactions: sales.length,
        averageTransaction: sales.length > 0 ? totalSales / sales.length : 0,
        topProducts: topProducts.slice(0, 5),
        topCashiers: topCashiers.slice(0, 5),
        dailySales: []
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

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
