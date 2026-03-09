# F-Mobile Backend API

Node.js + Express + MongoDB bilan yaratilgan professional backend API.

## 🚀 Xususiyatlari

- ✅ JWT Authentication
- ✅ Role-based Access Control (Admin, Cashier)
- ✅ RESTful API
- ✅ MongoDB Integration
- ✅ Error Handling
- ✅ CORS Support

## 📋 Talablar

- Node.js 18+
- MongoDB 5+
- npm yoki yarn

## 🔧 O'rnatish

```bash
# Dependencies o'rnatish
npm install

# .env fayli yaratish
cp .env.example .env

# Development serverini ishga tushirish
npm run dev
```

Server `http://localhost:5000` da ishga tushadi.

## 📁 Loyiha Strukturasi

```
f-mobile-backend/
├── models/
│   ├── User.js
│   ├── Branch.js
│   ├── Product.js
│   ├── Sale.js
│   └── Customer.js
├── routes/
│   ├── auth.js
│   ├── branches.js
│   ├── cashiers.js
│   ├── products.js
│   ├── sales.js
│   ├── customers.js
│   └── reports.js
├── middleware/
│   └── auth.js
├── server.js
├── package.json
└── .env.example
```

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Branches
- `GET /api/branches` - Get all branches
- `GET /api/branches/:id` - Get branch
- `POST /api/branches` - Create branch (Admin)
- `PUT /api/branches/:id` - Update branch (Admin)
- `DELETE /api/branches/:id` - Delete branch (Admin)

### Cashiers
- `GET /api/cashiers` - Get all cashiers (Admin)
- `GET /api/cashiers/:id` - Get cashier (Admin)
- `POST /api/cashiers` - Create cashier (Admin)
- `PUT /api/cashiers/:id` - Update cashier (Admin)
- `DELETE /api/cashiers/:id` - Delete cashier (Admin)

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)

### Sales
- `GET /api/sales` - Get all sales
- `POST /api/sales` - Create sale
- `GET /api/sales/:id` - Get sale

### Customers
- `GET /api/customers` - Get all customers
- `GET /api/customers/:id` - Get customer
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer

### Reports
- `GET /api/reports/daily/:date` - Daily report
- `GET /api/reports/monthly/:year/:month` - Monthly report
- `GET /api/reports/branch/:branchId` - Branch report

## 🔑 Demo Credentials

```
Admin:
- Username: admin
- Password: admin123

Cashier:
- Username: cashier
- Password: cashier123
```

## 📝 Environment Variables

```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/f-mobile
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:3000
```

## 🚀 Production Deploy

### Render.com ga Deploy

1. GitHub repository yaratish
2. Render.com da yangi Web Service yaratish
3. Environment variables qo'shish
4. Deploy qilish

## 📊 Database Schema

### User
- username (unique)
- password (hashed)
- email
- role (admin, cashier)
- branch (reference)
- active

### Branch
- name
- address
- phone
- manager
- active
- revenue

### Product
- name
- category
- buyPrice
- sellPrice
- stock
- imei
- barcode
- active

### Sale
- cashier (reference)
- branch (reference)
- customer (reference)
- items (array)
- totalAmount
- paidAmount
- change
- currency
- debt
- status

### Customer
- name
- phone
- email
- address
- debt
- totalPurchase
- branch (reference)
- active

## 🧪 Testing

```bash
# Health check
curl http://localhost:5000/api/health

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

## 📞 Yordam

Savollar bo'lsa, README.md faylini o'qing.

---

**Versiya**: 2.0.0  
**Status**: Production Ready


## 🤖 Telegram Bot

Mijozlarning qarz va savdo tarixini Telegram orqali ko'rish uchun bot.

### Bot Setup

```bash
# Python dependencies o'rnatish
pip install -r requirements.txt

# Bot ishga tushirish
python telegram_bot.py
```

### Bot Foydalanish

1. Telegram-da `@f_mobile_bot` qidirish
2. `/start` bosish
3. Mijozning raqamini (ID) kiritish
4. Bot mijozning qarz va savdo tarixini yuboradi

### Bot Buyruqlari

- `/start` - Botni boshlash
- `/help` - Yordam
- `/cancel` - Bekor qilish

### Bot Xususiyatlari

✅ Mijozning qarz miqdorini ko'rish
✅ Jami savdolar summasi
✅ So'nggi 5 ta savdo tarixи
✅ Har bir savdoda mahsulot, summa, to'langan pul, qarz
✅ Sana va vaqt ko'rsatiladi

### Misol

```
Mijozning ID: 507f1f77bcf86cd799439011

Bot javob:
📋 MIJOZ MA'LUMOTLARI
👤 Ismi: Alisher
📱 Telefon: +998901234567
💵 Jami Qarz: $500.00
🛍️ Jami Savdolar: $2000.00

📜 SO'NGGI SAVDOLAR:
1. Sana: 08.03.2026 14:30
   Mahsulotlar: iPhone 15 x1
   Jami: $1000.00
   To'langan: $500.00
   Qarz: $500.00
```

