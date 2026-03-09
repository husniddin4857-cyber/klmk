# F-Mobile Do'kon Boshqaruv Tizimi

Professional do'kon boshqaruv tizimi Next.js + React + Tailwind CSS bilan yaratilgan.

## 🚀 Xususiyatlari

- ✅ Admin Panel (Filiallar, Kassirlar, Savdolar, Hisobotlar)
- ✅ Kassir Panel (Savdo, Tarix, Mijozlar)
- ✅ Multi-currency qo'llab-quvvatlash (USD, UZS)
- ✅ Real-time Dashboard
- ✅ Mobile Responsive
- ✅ Professional Dizayn

## 📋 Talablar

- Node.js 18+
- npm yoki yarn

## 🔧 O'rnatish

```bash
# Loyihani klonlash
cd f-mobile

# Dependencies o'rnatish
npm install

# Development serverini ishga tushirish
npm run dev
```

Brauzerda `http://localhost:3000` oching.

## 👤 Demo Login

### Admin
- Login: `admin`
- Parol: `admin123`

### Kassir
- Login: `cashier`
- Parol: `cashier123`
- Filial: Tashkent 1

## 📁 Loyiha Strukturasi

```
f-mobile/
├── src/
│   ├── app/
│   │   ├── page.tsx (Bosh sahifa)
│   │   ├── admin/
│   │   │   ├── login/
│   │   │   ├── dashboard/
│   │   │   ├── branches/
│   │   │   ├── cashiers/
│   │   │   ├── sales/
│   │   │   ├── reports/
│   │   │   ├── notifications/
│   │   │   └── settings/
│   │   └── cashier/
│   │       ├── login/
│   │       ├── dashboard/
│   │       ├── sale/
│   │       ├── history/
│   │       ├── customers/
│   │       ├── handover/
│   │       └── reports/
│   ├── components/
│   │   ├── layouts/
│   │   │   ├── AdminLayout.tsx
│   │   │   └── CashierLayout.tsx
│   │   └── common/
│   │       └── StatCard.tsx
│   └── app/
│       ├── globals.css
│       └── layout.tsx
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## 🎨 Texnologiyalar

- **Framework**: Next.js 14
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Language**: TypeScript

## 📱 Sahifalar

### Admin Panel
1. **Dashboard** - Asosiy statistika
2. **Filiallar** - Filiallarni boshqarish
3. **Kassirlar** - Kassirlarni boshqarish
4. **Savdolar** - Savdo qilish
5. **Hisobotlar** - Analitika
6. **Bildirishnomalar** - Ogohlantirishnomalar
7. **Sozlamalar** - Tizim sozlamalari

### Kassir Panel
1. **Dashboard** - Balans va statistika
2. **Yangi Savdo** - Savdo qilish
3. **Savdo Tarixи** - O'tgan savdolar
4. **Mijozlar** - Mijozlar direktori
5. **Kirim Berish** - Pul kirim berish
6. **Hisobotlar** - Shaxsiy hisobotlar

## 🚀 Build va Deploy

```bash
# Production build
npm run build

# Production serverini ishga tushirish
npm start
```

## 📝 Litsenziya

MIT License

## 👨‍💻 Muallif

Tursunov Alibek - Do'kon Pro Team

---

**Versiya**: 2.0.0  
**Status**: Production Ready
