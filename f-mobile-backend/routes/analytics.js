const express = require('express');
const Sale = require('../models/Sale');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get dashboard analytics
router.get('/dashboard', auth, async (req, res) => {
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

    // Total sales by day (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const salesByDay = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          totalSales: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Top products
    const topProducts = await Sale.aggregate([
      { $match: dateFilter },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.total' }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productInfo'
        }
      }
    ]);

    // Sales by branch
    const salesByBranch = await Sale.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$branch',
          totalSales: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'branches',
          localField: '_id',
          foreignField: '_id',
          as: 'branchInfo'
        }
      },
      { $sort: { totalSales: -1 } }
    ]);

    // Sales by cashier
    const salesByCashier = await Sale.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$cashier',
          totalSales: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'cashierInfo'
        }
      },
      { $sort: { totalSales: -1 } },
      { $limit: 5 }
    ]);

    // Total stats
    const totalStats = await Sale.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalTransactions: { $sum: 1 },
          averageTransaction: { $avg: '$totalAmount' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        salesByDay: salesByDay.map(item => ({
          date: item._id,
          sales: item.totalSales,
          transactions: item.count
        })),
        topProducts: topProducts.map(item => ({
          name: item.productInfo?.[0]?.name || 'Unknown',
          quantity: item.totalQuantity,
          revenue: item.totalRevenue
        })),
        salesByBranch: salesByBranch.map(item => ({
          name: item.branchInfo?.[0]?.name || 'Unknown',
          sales: item.totalSales,
          transactions: item.count
        })),
        salesByCashier: salesByCashier.map(item => ({
          name: item.cashierInfo?.[0]?.username || 'Unknown',
          sales: item.totalSales,
          transactions: item.count
        })),
        totalStats: totalStats[0] || {
          totalRevenue: 0,
          totalTransactions: 0,
          averageTransaction: 0
        }
      }
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
