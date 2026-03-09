# F-Mobile Do'kon Boshqaruv Tizimi - Toliq Funksiyalar

## 📱 Loyihaning Umumiy Tavsifi
F-Mobile - bu mobil do'konlar uchun professional boshqaruv tizimi. Admin va Kassir (sotuvchi) uchun alohida panellar bilan ishlaydi.

---

## 🔐 AUTENTIFIKATSIYA VA KIRISH

### Admin Login
- **URL**: `/admin/login`
- **Login**: `admin`
- **Parol**: Kerak emas (faqat login)
- **Dizayn**: Pro dark theme, glassmorphism
- **Xususiyatlari**:
  - Animated background (blue, purple, cyan gradients)
  - Grid pattern background
  - Error messages
  - Loading state

### Kassir Login
- **URL**: `/cashier/login`
- **Login**: `cashier`
- **Parol**: `cashier123`
- **Filial tanlash**: Dropdown dan filial tanlash kerak
- **Dizayn**: Pro dark theme, teal gradient
- **Xususiyatlari**:
  - Filial selection
  - Password field
  - Error handling

### Main Page (Role Selection)
- **URL**: `/`
- **Xususiyatlari**:
  - Admin Panel tugmasi
  - Kassir Panel tugmasi
  - Demo credentials ko'rsatiladi
  - Professional design

---

## 👨‍💼 ADMIN PANEL

### 1. Admin Dashboard
- **URL**: `/admin/dashboard`
- **Xususiyatlari**:
  - 5 ta stat card (Filiallar, Kassirlar, Savdolar, Mahsulotlar, Mijozlar)
  - So'nggi savdolar ro'yxati
  - Ogohlantirishnomalar
  - Quick action buttons
  - Professional gradient design

### 2. Filiallar (Branches)
- **URL**: `/admin/branches`
- **Xususiyatlari**:
  - Filiallar ro'yxati (grid view)
  - Filial qo'shish (modal)
  - Filial o'chirish
  - Filial tahrirlash (edit button)
  - Har bir filialda:
    - Nomi
    - Manzili
    - Telefon raqami
    - Menejer ismi
    - Faol/Faol emas status
    - Daromad
    - Mahsulotlar soni

### 3. Kassirlar (Cashiers)
- **URL**: `/admin/cashiers`
- **Xususiyatlari**:
  - Kassirlar jadval (list view)
  - Kassir qo'shish (modal)
  - Kassir o'chirish
  - Kassir tahrirlash
  - Har bir kassirda:
    - Ismi
    - Login
    - Filial
    - Telefon
    - Balans (USD)
    - Balans (UZS)
    - Jami savdolar
    - Status (Faol/Faol emas)

### 4. Mahsulotlar (Products)
- **URL**: `/admin/products`
- **Xususiyatlari**:
  - Grid va List view o'rtasida o'tish
  - Mahsulot qidirish (search)
  - Kategoriya bo'yicha filtrlash
  - Mahsulot qo'shish (modal)
  - Mahsulot o'chirish
  - Mahsulot tahrirlash
  - Har bir mahsulotda:
    - Nomi
    - Kategoriya
    - Sotib olish narxi
    - Sotish narxi
    - Foyda (avtomatik hisoblash)
    - Stock miqdori
    - IMEI tracking (ha/yo'q)
    - Kam qolgan mahsulotlar qizil rang
  - Stats:
    - Jami mahsulotlar
    - Inventar qiymati
    - Kam qolgan mahsulotlar soni

### 5. Savdolar (Sales)
- **URL**: `/admin/sales`
- **Xususiyatlari**:
  - Savdolar jadval
  - Yangi savdo qo'shish (modal)
  - Savdo o'chirish
  - Har bir savdoda:
    - Mijoz nomi
    - Filial
    - Savdo summasi
    - Mahsulotlar soni
    - Sana
    - Status (Yakunlangan/Kutilmoqda)
  - Stats:
    - Jami savdolar
    - Yakunlangan savdolar
    - Jami mijozlar

### 6. Hisobotlar (Reports)
- **URL**: `/admin/reports`
- **Xususiyatlari**:
  - Oylik savdolar grafigi
  - Filiallar samaradorligi
  - Eng yaxshi filial
  - Eng mashhur mahsulot
  - Stats:
    - Jami savdolar
    - Jami mijozlar
    - Tranzaksiyalar soni
    - O'rtacha tranzaksiya
  - Yuklab olish tugmasi

### 7. Bildirishnomalar (Notifications)
- **URL**: `/admin/notifications`
- **Xususiyatlari**:
  - Bildirishnomalar ro'yxati
  - Yangi bildirish qo'shish (modal)
  - Bildirish o'chirish
  - Bildirish turlari:
    - Info (mavi)
    - Success (yashil)
    - Warning (sariq)
    - Error (qizil)
  - O'qilgan/O'qilmagan status

### 8. Sozlamalar (Settings)
- **URL**: `/admin/settings`
- **Xususiyatlari**:
  - Umumiy sozlamalar:
    - Kompaniya nomi
    - Email
    - Telefon
    - Valyuta (USD/UZS/EUR)
    - Til (O'zbek/Rus/English)
  - Bildirishnomalar:
    - Tizim bildirishnomalarini yoqish/o'chirish
    - Email bildirishnomalarini yoqish/o'chirish
  - Xavfsizlik:
    - Dark mode
    - Avtomatik zaxira nusxasi
    - Parolni o'zgartirish
  - Saqlash tugmasi

---

## 💰 KASSIR PANEL

### 1. Kassir Dashboard
- **URL**: `/cashier/dashboard`
- **Xususiyatlari**:
  - Balance cards (USD/UZS)
  - Bugungi savdolar statistikasi
  - Quick action buttons:
    - Yangi Savdo Qilish
    - Savdo Tarixini Ko'rish
  - Professional teal gradient design

### 2. Mijozlar (Customers)
- **URL**: `/cashier/customers`
- **Xususiyatlari**:
  - Mijozlar ro'yxati
  - Mijoz qo'shish (modal)
  - Mijoz o'chirish
  - Mijoz qidirish (nom/telefon)
  - Har bir mijozda:
    - Ismi
    - Telefon raqami
    - Jami savdolar soni
    - Jami summa
    - Qarz miqdori
    - Oxirgi savdo vaqti

### 3. Mijoz Daftari (Customer Detail)
- **URL**: `/cashier/customers/[id]`
- **Xususiyatlari**:
  - Mijozning to'liq ma'lumotlari
  - Stats:
    - Jami savdolar
    - Jami summa
    - Qarz miqdori
    - Manzil
  - Savdo tarixи:
    - Sana
    - Mahsulot nomi
    - Miqdor
    - Summa
  - Yangi savdo qo'shish (modal)
  - Savdoni o'chirish
  - Savdo tarixini ko'rish

### 4. Savdo Tarixи (History)
- **URL**: `/cashier/history`
- **Xususiyatlari**:
  - Barcha savdolar ro'yxati
  - Savdo qidirish
  - Sana bo'yicha filtrlash
  - Har bir savdoda:
    - Mijoz nomi
    - Mahsulot nomi
    - Miqdor
    - Summa
    - Sana va vaqt

---

## 🎨 DIZAYN VA UX

### Color Scheme
- **Admin Panel**: Dark blue/slate gradient (from-slate-950 via-blue-950 to-slate-950)
- **Kassir Panel**: Teal gradient (from-teal-700 to-teal-900)
- **Accent Colors**: Blue, Green, Orange, Purple, Red, Cyan

### Design Features
- **Glassmorphism**: Backdrop blur, white/10 to white/5 backgrounds
- **Gradients**: Color-coded sections
- **Shadows**: Hover effects with color-matched shadows
- **Responsive**: Mobile, tablet, desktop
- **Dark Theme**: Professional dark mode throughout
- **Animations**: Smooth transitions, hover effects

### Components
- **Stat Cards**: Color-coded with icons
- **Tables**: Dark theme with hover effects
- **Modals**: Glassmorphism with backdrop blur
- **Buttons**: Gradient with hover effects
- **Forms**: Dark inputs with focus rings
- **Navigation**: Sidebar with icons

---

## 🔧 BACKEND API

### Authentication Routes
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/verify` - Token verification

### Branches Routes
- `GET /api/branches` - Barcha filiallar
- `POST /api/branches` - Yangi filial qo'shish
- `PUT /api/branches/:id` - Filial tahrirlash
- `DELETE /api/branches/:id` - Filial o'chirish

### Cashiers Routes
- `GET /api/cashiers` - Barcha kassirlar
- `POST /api/cashiers` - Yangi kassir qo'shish
- `PUT /api/cashiers/:id` - Kassir tahrirlash
- `DELETE /api/cashiers/:id` - Kassir o'chirish

### Products Routes
- `GET /api/products` - Barcha mahsulotlar
- `POST /api/products` - Yangi mahsulot qo'shish
- `PUT /api/products/:id` - Mahsulot tahrirlash
- `DELETE /api/products/:id` - Mahsulot o'chirish

### Sales Routes
- `GET /api/sales` - Barcha savdolar
- `POST /api/sales` - Yangi savdo qo'shish
- `PUT /api/sales/:id` - Savdo tahrirlash
- `DELETE /api/sales/:id` - Savdo o'chirish

### Customers Routes
- `GET /api/customers` - Barcha mijozlar
- `POST /api/customers` - Yangi mijoz qo'shish
- `PUT /api/customers/:id` - Mijoz tahrirlash
- `DELETE /api/customers/:id` - Mijoz o'chirish

### Reports Routes
- `GET /api/reports/monthly` - Oylik hisobotlar
- `GET /api/reports/branches` - Filiallar samaradorligi
- `GET /api/reports/products` - Mahsulotlar hisoboti

---

## 📊 DATABASE MODELS

### User Model
- id
- name
- login
- password (hashed)
- role (admin/cashier)
- branch_id
- active
- created_at

### Branch Model
- id
- name
- address
- phone
- manager
- active
- revenue
- created_at

### Product Model
- id
- name
- category
- buy_price
- sell_price
- stock
- imei
- created_at

### Sale Model
- id
- customer_id
- branch_id
- cashier_id
- amount
- items_count
- status
- date
- created_at

### Customer Model
- id
- name
- phone
- address
- total_purchases
- total_amount
- debt
- created_at

---

## 🚀 DEPLOYMENT

### Frontend (Next.js)
```bash
npm run build
npm start
```

### Backend (Node.js)
```bash
npm install
npm start
```

### Environment Variables
Frontend (.env):
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Backend (.env):
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/f-mobile
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:3000
```

---

## 📱 RESPONSIVE DESIGN

- **Mobile**: 320px - 640px
- **Tablet**: 641px - 1024px
- **Desktop**: 1025px+

All pages are fully responsive with:
- Mobile hamburger menu
- Responsive tables (horizontal scroll)
- Responsive grids
- Touch-friendly buttons

---

## 🔒 SECURITY FEATURES

- JWT authentication
- Password hashing (bcrypt)
- Role-based access control
- CORS protection
- Input validation
- SQL injection prevention
- XSS protection

---

## 📝 NOTES

- Demo mode: Runs without MongoDB
- All data stored in localStorage (frontend)
- Backend ready for MongoDB integration
- Professional UI/UX design
- Fully functional prototype
- Ready for production deployment

---

## 👨‍💻 DEVELOPER INFO

**Created**: 2026
**Version**: 2.0.0
**Tech Stack**: Next.js, React, Tailwind CSS, Node.js, Express, MongoDB
**Language**: Uzbek (O'zbek)

---

## 📞 SUPPORT

For issues or questions, contact the development team.
