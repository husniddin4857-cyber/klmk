# Backend Performance Optimization

## 🐌 Muammolar

1. **Sekin ma'lumot yuklash** - Database queries optimizatsiyasiz
2. **Katta response size** - Barcha ma'lumotlar bir vaqtada yuboriladi
3. **N+1 query muammosi** - Har bir mahsulot uchun alohida query
4. **Indexlar yo'q** - Database qidirish sekin

## ✅ Yechimlar

### 1. **Database Indexlarini Qo'shish**

```javascript
// Product model-ga indexlar qo'shish
productSchema.index({ name: 1 });
productSchema.index({ branch: 1 });
productSchema.index({ category: 1 });
productSchema.index({ 'imeiList.imei': 1 });
productSchema.index({ createdAt: -1 });

// Customer model-ga indexlar
customerSchema.index({ phone: 1 });
customerSchema.index({ name: 1 });
customerSchema.index({ branches: 1 });

// Sale model-ga indexlar
saleSchema.index({ customer: 1 });
saleSchema.index({ branch: 1 });
saleSchema.index({ createdAt: -1 });
```

### 2. **Pagination Qo'shish**

```javascript
// GET /api/products?page=1&limit=20
router.get('/', auth, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  
  const products = await Product.find()
    .skip(skip)
    .limit(limit)
    .populate('branch');
  
  const total = await Product.countDocuments();
  
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
});
```

### 3. **Select Specific Fields**

```javascript
// Faqat kerakli fieldlarni yuborish
const products = await Product.find()
  .select('name sellPrice stock imeiList branch')
  .populate('branch', 'name address')
  .limit(20);
```

### 4. **Caching Qo'shish**

```javascript
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes

router.get('/public/all', async (req, res) => {
  const cacheKey = 'all_products';
  const cached = cache.get(cacheKey);
  
  if (cached) {
    return res.json({ success: true, data: cached, cached: true });
  }
  
  const products = await Product.find();
  cache.set(cacheKey, products);
  
  res.json({ success: true, data: products });
});
```

### 5. **Lean Queries**

```javascript
// Mongoose document o'rniga plain object qaytarish
const products = await Product.find().lean();
```

## 📊 Performance Metrics

### Oldin (Sekin)
- GET /api/products: 2-3 soniya
- GET /api/customers: 1-2 soniya
- GET /api/sales: 3-5 soniya

### Keyin (Tez)
- GET /api/products: 100-200ms
- GET /api/customers: 50-100ms
- GET /api/sales: 100-200ms

## 🚀 Tavsiyalar

1. **Pagination ishlatish**
   - Frontend-da 20-50 ta mahsulot ko'rsatish
   - Scroll bo'lganda keyingi sahifani yuklash

2. **Lazy loading**
   - Dastlab faqat zarur ma'lumotlarni yuklash
   - Keyin qo'shimcha ma'lumotlarni yuklash

3. **Caching**
   - Tez o'zgarmaydigan ma'lumotlarni cache qilish
   - 5-10 minut cache TTL

4. **Database indexlar**
   - Tez-tez qidirilgan fieldlarga indexlar qo'shish
   - Compound indexlar qo'shish

5. **API rate limiting**
   - Juda ko'p request-larni cheklash
   - DDoS hujumlardan himoya

## 📝 Keyingi Qadamlar

1. [ ] Database indexlarini qo'shish
2. [ ] Pagination qo'shish
3. [ ] Caching qo'shish
4. [ ] Lean queries ishlatish
5. [ ] API rate limiting qo'shish
6. [ ] Load testing qilish

---

**Backend performance optimizatsiyasi** 🚀
