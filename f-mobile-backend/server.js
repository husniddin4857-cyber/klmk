const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const dns = require('dns');
require('dotenv').config();

// Fix DNS resolution for MongoDB Atlas
dns.setServers(['8.8.8.8', '8.8.4.4']);

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 1000) {
      console.warn(`⚠️  Slow request: ${req.method} ${req.path} took ${duration}ms`);
    }
  });
  next();
});

// Database Connection
const connectDB = async () => {
  const maxRetries = 3;
  let retries = 0;
  
  const attemptConnection = async () => {
    try {
      console.log(`Connecting to MongoDB (attempt ${retries + 1}/${maxRetries})...`);
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 20000,
        connectTimeoutMS: 20000,
        socketTimeoutMS: 45000,
        family: 4, // Use IPv4
      });
      console.log('✓ MongoDB connected successfully');
      
      // Run migration after successful connection
      runMigrations();
    } catch (err) {
      retries++;
      if (retries < maxRetries) {
        console.warn(`⚠ Connection attempt ${retries} failed, retrying in 3 seconds...`);
        console.warn('  Error:', err.message);
        setTimeout(attemptConnection, 3000);
      } else {
        console.warn('⚠ MongoDB connection failed after retries - running in demo mode');
        console.warn('  Error:', err.message);
      }
    }
  };
  
  attemptConnection();
};

// Migration function
const runMigrations = async () => {
  try {
    const Customer = require('./models/Customer');
    
    // Migrate old branch field to branches array
    const customersWithOldBranch = await Customer.find({ branch: { $exists: true, $ne: null } });
    
    if (customersWithOldBranch.length > 0) {
      console.log(`[MIGRATION] Found ${customersWithOldBranch.length} customers with old branch field`);
      
      for (const customer of customersWithOldBranch) {
        if (!customer.branches || customer.branches.length === 0) {
          customer.branches = [customer.branch];
          await customer.save();
          console.log(`[MIGRATION] Updated ${customer.name}: branch=${customer.branch} -> branches=[${customer.branch}]`);
        }
      }
      
      console.log(`[MIGRATION] Migration complete`);
    }
  } catch (err) {
    console.error('[MIGRATION] Error:', err.message);
  }
};

connectDB();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/branches', require('./routes/branches'));
app.use('/api/cashiers', require('./routes/cashiers'));
app.use('/api/products', require('./routes/products'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/exchange-rate', require('./routes/exchangeRate'));
app.use('/api/income', require('./routes/income'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/imei', require('./routes/imei'));
app.use('/api/analytics', require('./routes/analytics'));

// Health Check
app.get('/api/health', (req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  res.json({ 
    status: 'OK', 
    timestamp: new Date(),
    database: dbConnected ? 'Connected' : 'Disconnected'
  });
});

// Database Info
app.get('/api/db-info', async (req, res) => {
  try {
    const dbConnected = mongoose.connection.readyState === 1;
    if (!dbConnected) {
      return res.json({ 
        status: 'Disconnected',
        message: 'MongoDB not connected'
      });
    }
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    const stats = {};
    for (const collName of collectionNames) {
      const coll = db.collection(collName);
      const count = await coll.countDocuments();
      stats[collName] = count;
    }
    
    res.json({ 
      status: 'Connected',
      database: mongoose.connection.name,
      collections: collectionNames,
      documentCounts: stats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Server Error'
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
});
