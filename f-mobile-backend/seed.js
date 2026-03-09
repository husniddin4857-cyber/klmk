const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dns = require('dns');
require('dotenv').config();

// Fix DNS resolution
dns.setServers(['8.8.8.8', '8.8.4.4']);

const User = require('./models/User');
const Branch = require('./models/Branch');
const Product = require('./models/Product');
const Customer = require('./models/Customer');
const Sale = require('./models/Sale');

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Branch.deleteMany({});
    await Product.deleteMany({});
    await Customer.deleteMany({});
    await Sale.deleteMany({});
    console.log('✓ Cleared existing data');

    // Create only users (admin and cashier)
    const adminUser = await User.create({
      username: 'admin',
      password: '101110',
      role: 'admin',
      email: 'admin@fmobile.com'
    });

    const cashierUser = await User.create({
      username: 'cashier',
      password: 'cashier123',
      role: 'cashier',
      email: 'cashier@fmobile.com'
    });

    console.log('✓ Created users');

    console.log('\n✓ Database cleared and ready!');
    console.log(`  - Users: 2 (admin, cashier)`);
    console.log(`  - Branches: 0 (empty)`);
    console.log(`  - Products: 0 (empty)`);
    console.log(`  - Customers: 0 (empty)`);
    console.log(`  - Sales: 0 (empty)`);
    console.log('\nSiz o\'zingiz ma\'lumotlarni qo\'shishingiz mumkin!');

    process.exit(0);
  } catch (err) {
    console.error('✗ Error seeding database:', err.message);
    process.exit(1);
  }
};

seedDB();
