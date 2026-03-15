const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dns = require('dns');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Fix DNS resolution
dns.setServers(['8.8.8.8', '8.8.4.4']);

const User = require('./models/User');
const Branch = require('./models/Branch');
const Product = require('./models/Product');
const Customer = require('./models/Customer');
const Sale = require('./models/Sale');

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    console.log('📊 MongoDB URI:', mongoUri ? mongoUri.substring(0, 50) + '...' : 'undefined');
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB');

    // Check if data already exists
    const existingBranches = await Branch.countDocuments();
    const existingUsers = await User.countDocuments();
    
    if (existingBranches > 0 || existingUsers > 0) {
      console.log('✓ Database already has data. Skipping seed to prevent data loss.');
      console.log(`   Existing branches: ${existingBranches}`);
      console.log(`   Existing users: ${existingUsers}`);
      console.log('   To add more data, use admin panel or API');
      process.exit(0);
    }

    console.log('📝 Seeding database with initial data...');

    // Create users (admin and cashier)
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

    // Create branches
    const branch1 = await Branch.create({
      name: 'Toshkent',
      address: 'Toshkent shahar, Mirzo Ulugbek tumani',
      phone: '+998901234567'
    });

    const branch2 = await Branch.create({
      name: 'Gijduvon',
      address: 'Gijduvon tumani, Bukhara viloyati',
      phone: '+998902345678'
    });

    console.log('✓ Created branches');

    // Create customers
    const customer1 = await Customer.create({
      name: 'Azizbek',
      phone: '+998901234567',
      address: 'Toshkent shahar',
      branches: [branch1._id],
      debt: 0,
      totalPurchase: 0
    });

    const customer2 = await Customer.create({
      name: 'Karim',
      phone: '+998902345678',
      address: 'Gijduvon tumani',
      branches: [branch2._id],
      debt: 0,
      totalPurchase: 0
    });

    const customer3 = await Customer.create({
      name: 'Fatima',
      phone: '+998903456789',
      address: 'Toshkent shahar',
      branches: [branch1._id],
      debt: 0,
      totalPurchase: 0
    });

    console.log('✓ Created customers');

    // Create products
    const product1 = await Product.create({
      name: 'A07',
      category: 'Telefon',
      buyPrice: 130,
      sellPrice: 1045,
      stock: 3,
      imei: '123,321,233',
      imeiList: [
        { imei: '123', used: false },
        { imei: '321', used: false },
        { imei: '233', used: false }
      ],
      branch: branch1._id
    });

    const product2 = await Product.create({
      name: 'iPhone 13',
      category: 'Telefon',
      buyPrice: 500,
      sellPrice: 899,
      stock: 2,
      imei: '456,789',
      imeiList: [
        { imei: '456', used: false },
        { imei: '789', used: false }
      ],
      branch: branch1._id
    });

    const product3 = await Product.create({
      name: 'Samsung S21',
      category: 'Telefon',
      buyPrice: 400,
      sellPrice: 799,
      stock: 5,
      imei: '111,222,333,444,555',
      imeiList: [
        { imei: '111', used: false },
        { imei: '222', used: false },
        { imei: '333', used: false },
        { imei: '444', used: false },
        { imei: '555', used: false }
      ],
      branch: branch2._id
    });

    const product4 = await Product.create({
      name: 'Xiaomi 12',
      category: 'Telefon',
      buyPrice: 250,
      sellPrice: 599,
      stock: 4,
      imei: '666,777,888,999',
      imeiList: [
        { imei: '666', used: false },
        { imei: '777', used: false },
        { imei: '888', used: false },
        { imei: '999', used: false }
      ],
      branch: branch2._id
    });

    console.log('✓ Created products');

    console.log('\n✓ Database seeded successfully!');
    console.log(`  - Users: 2 (admin, cashier)`);
    console.log(`  - Branches: 2 (Toshkent, Gijduvon)`);
    console.log(`  - Customers: 3 (Azizbek, Karim, Fatima)`);
    console.log(`  - Products: 4 (A07, iPhone 13, Samsung S21, Xiaomi 12)`);
    console.log(`  - Sales: 0 (empty)`);

    process.exit(0);
  } catch (err) {
    console.error('✗ Error seeding database:', err.message);
    process.exit(1);
  }
};

seedDB();
