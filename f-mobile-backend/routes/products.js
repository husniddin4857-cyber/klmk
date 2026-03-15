const express = require('express');
const Product = require('../models/Product');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Helper function to convert imei string to imeiList
const convertImeiToList = (product) => {
  const p = product.toObject ? product.toObject() : product;
  
  // Agar imeiList bo'sh bo'lsa va imei string bo'lsa, o'zgartiramiz
  if ((!p.imeiList || p.imeiList.length === 0) && p.imei && p.imei.trim()) {
    p.imeiList = p.imei.split(',').map(i => ({
      imei: i.trim(),
      used: false
    })).filter(item => item.imei !== '');
  }
  
  // Agar imeiList bo'lsa, uni qaytaramiz (sotilgan IMEIlar `used: true` bo'ladi)
  return p;
};

// Get all products (public - for dashboard)
router.get('/public/all', async (req, res) => {
  try {
    console.log('📦 Public all products endpoint called');
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    // Faqat kerakli fieldlarni yuborish
    let products = await Product.find()
      .select('name sellPrice buyPrice stock imeiList branch category')
      .populate('branch', 'name address')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Convert old imei string to imeiList if needed
    products = products.map(convertImeiToList);
    
    const total = await Product.countDocuments();
    
    console.log(`✅ Found ${products.length} products (page ${page})`);
    res.json({ 
      success: true, 
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('❌ Error fetching products:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get all products
router.get('/', auth, async (req, res) => {
  try {
    const { category, search, branch, imei } = req.query;
    let query = {};

    if (category) query.category = category;
    
    // Filter by branch - exclude main warehouse products
    if (branch) {
      query.branch = branch;
      query.isMainWarehouse = { $ne: true }; // Exclude main warehouse products
    }
    
    if (imei) {
      // Search by IMEI in imeiList - only show available IMEIs
      query.imeiList = { $elemMatch: { imei: { $regex: imei, $options: 'i' }, used: false } };
    } else if (search) {
      // Search by name or barcode - also filter to only show available IMEIs
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } }
      ];
      // Only show products that have at least one available IMEI
      query.imeiList = { $elemMatch: { used: false } };
    }
    // For inventory page (no search/imei), don't filter by imeiList in query
    // We'll filter in the response instead

    let products = await Product.find(query).populate('branch').sort({ createdAt: -1 });
    
    // Convert old imei string to imeiList if needed
    products = products.map(convertImeiToList);
    
    // Filter out used IMEIs from the response ONLY for search results
    // For inventory page, we need to keep all IMEIs to show correct stock count
    products = products.map(p => {
      if (p.imeiList && Array.isArray(p.imeiList)) {
        // If searching by specific IMEI, only keep that IMEI
        if (imei) {
          p.imeiList = p.imeiList.filter(item => 
            item.imei.toLowerCase().includes(imei.toLowerCase()) && !item.used
          );
        } else if (search) {
          // For name search, keep all available IMEIs
          p.imeiList = p.imeiList.filter(item => !item.used);
        }
        // If no search/imei filter, keep all IMEIs (for inventory page)
      }
      return p;
    });
    
    // For inventory page, filter out products with no available IMEIs
    if (!imei && !search) {
      products = products.filter(p => {
        if (p.imeiList && p.imeiList.length > 0) {
          const availableCount = p.imeiList.filter(item => !item.used).length;
          return availableCount > 0;
        }
        return p.stock > 0;
      });
    }
    
    console.log('[PRODUCTS] Final products:', products.length);
    products.forEach(p => {
      console.log(`  - ${p.name}: stock=${p.stock}, imeiList.length=${p.imeiList ? p.imeiList.length : 0}, available=${p.imeiList ? p.imeiList.filter(item => !item.used).length : 0}`);
    });
    
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get single product
router.get('/:id', auth, async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    product = convertImeiToList(product);
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create product
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { name, category, buyPrice, sellPrice, stock, imei, branch } = req.body;

    console.log('[CREATE PRODUCT] Received data:', { name, stock, imei, stockType: typeof stock });

    if (!name || !sellPrice || !branch) {
      return res.status(400).json({ success: false, error: 'Required fields missing' });
    }

    // Convert stock to number
    const stockNum = parseInt(stock) || 0;
    console.log('[CREATE PRODUCT] Converted stock:', { stock, stockNum });

    // Convert comma-separated IMEI string to imeiList array
    let imeiList = [];
    console.log('[CREATE PRODUCT] IMEI input:', { imei, imeiTrimmed: imei ? imei.trim() : 'null', stockNum });
    
    if (imei && imei.trim()) {
      const imeiArray = imei.split(',').map(i => i.trim()).filter(item => item !== '');
      
      console.log('[CREATE PRODUCT] IMEI processing:', { imei, imeiArray, imeiArrayLength: imeiArray.length, stockNum });
      
      // Agar bir xil IMEI bo'lsa (1 ta IMEI, lekin stok > 1), stok soniga qarab imeiList yaratish
      if (imeiArray.length === 1 && stockNum > 1) {
        // Bir xil IMEI - stok soniga qarab takrorlash
        console.log('[CREATE PRODUCT] Creating same IMEI list with stock:', stockNum);
        for (let i = 0; i < stockNum; i++) {
          imeiList.push({
            imei: imeiArray[0],
            used: false
          });
        }
        console.log('[CREATE PRODUCT] Created imeiList with', imeiList.length, 'entries');
      } else {
        // Har xil IMEI yoki stok = 1
        console.log('[CREATE PRODUCT] Creating different IMEI list');
        imeiList = imeiArray.map(i => ({
          imei: i,
          used: false
        }));
        console.log('[CREATE PRODUCT] Created imeiList with', imeiList.length, 'entries');
      }
    } else if (stockNum > 0) {
      // Agar IMEI bo'sh bo'lsa, stok soniga qarab bo'sh imeiList yaratish
      console.log('[CREATE PRODUCT] No IMEI provided, creating empty imeiList with stock:', stockNum);
      for (let i = 0; i < stockNum; i++) {
        imeiList.push({
          imei: '',
          used: false
        });
      }
      console.log('[CREATE PRODUCT] Created empty imeiList with', imeiList.length, 'entries');
    }

    console.log('[CREATE PRODUCT] Final imeiList length:', imeiList.length, 'imeiList:', imeiList);

    const product = new Product({
      name,
      category: category || 'Boshqa',
      buyPrice: buyPrice || 0,
      sellPrice,
      stock: stockNum,
      imei: imei || '',
      imeiList: imeiList,
      branch
    });

    await product.save();
    console.log('[CREATE PRODUCT] Product saved:', { 
      name, 
      stock: product.stock, 
      imeiListLength: product.imeiList.length,
      imeiList: product.imeiList
    });
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    console.error('[CREATE PRODUCT] Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update product
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const updateData = { ...req.body, updatedAt: Date.now() };
    
    // Get the existing product first
    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    // Convert stock to number if provided
    if (updateData.stock !== undefined && updateData.stock !== null) {
      updateData.stock = parseInt(updateData.stock) || 0;
    }
    
    // Convert comma-separated IMEI string to imeiList array if imei is provided
    if (updateData.imei !== undefined && updateData.imei !== null) {
      let imeiList = [];
      const newStock = updateData.stock || existingProduct.stock;
      
      if (updateData.imei && updateData.imei.trim()) {
        const imeiArray = updateData.imei.split(',').map(i => i.trim()).filter(item => item !== '');
        
        // Agar bir xil IMEI bo'lsa (1 ta IMEI, lekin stok > 1), stok soniga qarab imeiList yaratish
        if (imeiArray.length === 1 && newStock > 1) {
          // Bir xil IMEI - stok soniga qarab takrorlash
          // Preserve existing used IMEIs if they match
          const existingUsedCount = existingProduct.imeiList 
            ? existingProduct.imeiList.filter(item => item.used && item.imei === imeiArray[0]).length 
            : 0;
          
          console.log(`[UPDATE PRODUCT] Updating IMEI: existing used count = ${existingUsedCount}, new stock = ${newStock}`);
          
          for (let i = 0; i < newStock; i++) {
            imeiList.push({
              imei: imeiArray[0],
              used: i < existingUsedCount // Mark first N as used if they were used before
            });
          }
        } else {
          // Har xil IMEI yoki stok = 1
          imeiList = imeiArray.map(i => ({
            imei: i,
            used: false
          }));
        }
      }
      updateData.imeiList = imeiList;
    }
    // If imei is not being updated, don't modify imeiList - keep existing data

    let product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    product = convertImeiToList(product);
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete product
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
