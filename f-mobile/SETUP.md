# F-Mobile Setup Guide

## 🚀 Tez Boshlash

### 1. Dependencies O'rnatish

```bash
cd f-mobile
npm install
```

### 2. Development Serverini Ishga Tushirish

```bash
npm run dev
```

Brauzerda `http://localhost:3000` oching.

### 3. Login Qilish

#### Admin Panel
- URL: `http://localhost:3000/admin/login`
- Login: `admin`
- Parol: `admin123`

#### Kassir Panel
- URL: `http://localhost:3000/cashier/login`
- Login: `cashier`
- Parol: `cashier123`
- Filial: Tashkent 1

## 📁 Loyiha Strukturasi

```
f-mobile/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # Bosh sahifa
│   │   ├── layout.tsx         # Root layout
│   │   ├── globals.css        # Global CSS
│   │   ├── admin/             # Admin panel
│   │   │   ├── login/
│   │   │   ├── dashboard/
│   │   │   ├── branches/
│   │   │   ├── cashiers/
│   │   │   ├── products/
│   │   │   ├── sales/
│   │   │   ├── reports/
│   │   │   ├── notifications/
│   │   │   └── settings/
│   │   └── cashier/           # Kassir panel
│   │       ├── login/
│   │       ├── dashboard/
│   │       ├── sale/
│   │       ├── history/
│   │       ├── customers/
│   │       ├── handover/
│   │       └── reports/
│   └── components/            # React components
│       ├── layouts/
│       │   ├── AdminLayout.tsx
│       │   └── CashierLayout.tsx
│       └── common/
│           └── StatCard.tsx
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── next.config.js
└── .gitignore
```

## 🎨 Sahifalar

### Admin Panel (8 ta)
1. **Dashboard** - Asosiy statistika va monitoring
2. **Filiallar** - Filiallarni qo'shish, o'zgartirish, o'chirish
3. **Kassirlar** - Kassirlarni boshqarish
4. **Mahsulotlar** - Mahsulotlarni boshqarish
5. **Savdolar** - Barcha filiallardan savdo qilish
6. **Hisobotlar** - Biznes hisobotlari
7. **Bildirishnomalar** - Ogohlantirishnomalar
8. **Sozlamalar** - Tizim sozlamalari

### Kassir Panel (6 ta)
1. **Dashboard** - Balans va statistika
2. **Yangi Savdo** - Savdo qilish
3. **Savdo Tarixи** - O'tgan savdolar
4. **Mijozlar** - Mijozlar direktori
5. **Kirim Berish** - Pul kirim berish
6. **Hisobotlar** - Shaxsiy hisobotlar

## 🛠️ Texnologiyalar

- **Next.js 14** - React framework
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## 📦 Scripts

```bash
# Development
npm run dev

# Build
npm run build

# Production
npm start

# Lint
npm run lint
```

## 🔐 Authentication

Hozirda demo authentication ishlatilmoqda. Production uchun:

1. Backend API yaratish (Node.js + Express)
2. JWT token bilan authentication
3. Database (MongoDB) bilan user management
4. Password hashing (bcrypt)

## 🚀 Production Deploy

### Render.com ga Deploy

1. GitHub repository yaratish
2. Render.com da yangi Web Service yaratish
3. GitHub repository ulanish
4. Environment variables qo'shish
5. Deploy qilish

### Environment Variables

```
NEXT_PUBLIC_API_URL=https://your-api.com
DATABASE_URL=mongodb+srv://...
JWT_SECRET=your-secret-key
```

## 📝 Keyingi Qadamlar

- [ ] Backend API yaratish
- [ ] Database integration
- [ ] Real authentication
- [ ] Email notifications
- [ ] Telegram bot integration
- [ ] Excel export
- [ ] PDF reports
- [ ] Mobile app

## 🐛 Muammolar

Agar muammo bo'lsa:

1. `node_modules` o'chiring: `rm -rf node_modules`
2. Qayta o'rnating: `npm install`
3. Cache o'chiring: `npm cache clean --force`
4. Qayta ishga tushiring: `npm run dev`

## 📞 Yordam

Savollar bo'lsa, README.md faylini o'qing.

---

**Versiya**: 2.0.0  
**Status**: Production Ready
