# 📱 F-MOBILE DO'KON BOSHQARUV TIZIMI - TO'LIQ MA'LUMOT

## 🎯 SAYT HAQIDA UMUMIY MA'LUMOT

**Sayt Nomi**: F-Mobile Do'kon Boshqaruv Tizimi  
**Versiya**: 2.0.0  
**Holati**: Production Ready  
**Tillar**: Uzbek, English  
**Deployment**: Render.com + MongoDB Atlas  

### Asosiy Maqsadi
Kichik va o'rta bizneslar uchun to'liq do'kon boshqaruv tizimi. Ombor, Kassa, Savdo va Hisobotlarni bitta platformada boshqarish.

### Asosiy Xususiyatlar
✅ Multi-filial qo'llab-quvvatlash  
✅ Dual currency (USD va UZS)  
✅ IMEI tracking (elektronika uchun)  
✅ Real-time Excel export  
✅ Telegram bot integratsiyasi  
✅ Activity log (audit trail)  
✅ Mobile responsive  
✅ Role-based access (Admin, Kassir)  

---

## 👨‍💼 ADMIN PANEL - TO'LIQ QOLLANMA

### Admin Login
**URL**: `http://localhost:3000/admin-login.html`  
**Login**: admin  
**Parol**: admin123  

**Funksiyalari**:
- Username/password authentication
- Remember me option
- Session management
- Error handling

---

### 1. ADMIN DASHBOARD
**URL**: `/admin-dashboard.html`  
**Maqsadi**: Admin uchun asosiy markaziy panel

**Ko'rsatadigan Ma'lumotlar**:
- 📊 Jami filiallar soni
- 📊 Faol filiallar soni
- 👥 Jami kassirlar soni
- 👥 Faol kassirlar soni
- 💰 Jami savdolar
- 💰 Bugungi savdolar
- 📦 Jami mahsulotlar
- ⚠️ Kam qolgan mahsulotlar
- 👤 Jami mijozlar
- 💳 Qarzli mijozlar

**Tugmalar**:
- Yangi filial qo'shish
- Yangi kassir qo'shish
- Yangi mahsulot qo'shish
- Savdo qilish
- Hisobotlarni ko'rish
- Bildirishnomalarni ko'rish

---

### 2. FILIALLAR BOSHQARUVI
**URL**: `/admin-branches.html`  
**Maqsadi**: Barcha filiallarni boshqarish

**Funksiyalari**:
- ✅ Yangi filial qo'shish
- ✅ Filial ma'lumotlarini o'zgartirish
- ✅ Filiallarni faollashtirish/deaktivlashtirish
- ✅ Filial statistikasini ko'rish
- ✅ Filial bo'yicha mahsulotlarni ko'rish

**Ko'rsatadigan Ma'lumotlar**:
- Filial nomi
- Manzili
- Telefon raqami
- Menejer ismi
- Faol/Faol emas
- Jami daromad
- Mahsulotlar soni

---

### 3. KASSIRLAR BOSHQARUVI
**URL**: `/admin-cashiers.html`  
**Maqsadi**: Kassirlarni boshqarish va monitoring

**Funksiyalari**:
- ✅ Yangi kassir qo'shish
- ✅ Kassirni filialga tayinlash
- ✅ Kassir ma'lumotlarini o'zgartirish
- ✅ Kassir balansi monitoring
- ✅ Kassirlarni faollashtirish/deaktivlashtirish
- ✅ Filial bo'yicha filtrlash

**Ko'rsatadigan Ma'lumotlar**:
- Kassir ismi
- Login
- Filial
- Telefon
- Hozirgi balans (USD va UZS)
- Jami savdolar
- Faol/Faol emas

---

### 4. SAVDO QILISH (ADMIN)
**URL**: `/admin-sales.html`  
**Maqsadi**: Admin barcha filiallardan savdo qilishi mumkin

**Funksiyalari**:
- ✅ Filial tanlash
- ✅ Mijoz qidirish/tanlash
- ✅ Mahsulot qidirish (IMEI, barcode, nomi)
- ✅ Ko'p mahsulot qo'shish
- ✅ Multi-currency to'lov (USD, UZS, EUR)
- ✅ Real-time valyuta konvertatsiyasi
- ✅ Qarz hisoblash
- ✅ Savdo yakunlash

**To'lov Variantlari**:
- Faqat USD
- Faqat UZS
- USD + UZS (ikkalasi)

---

### 5. HISOBOTLAR VA ANALITIKA
**URL**: `/admin-reports.html`  
**Maqsadi**: Biznes hisobotlarini ko'rish va tahlil qilish

**Hisobot Turlari**:
- 📅 Kunlik hisobot
- 📅 Haftalik hisobot
- 📅 Oylik hisobot
- 📅 Yillik hisobot

**Ko'rsatadigan Ma'lumotlar**:
- Kunlik daromad
- Kunlik savdolar soni
- Haftalik daromad
- Haftalik o'sish foizi
- Oylik daromad
- Oylik xarajatlar
- Sof foyda
- Foyda foizi
- Yillik daromad
- Eng yaxshi oy

**Grafiklar**:
- Savdo trenadi
- Daromad grafigi
- Mahsulot tahlili
- Filial tahlili

**Export**:
- Excel formatida yuklab olish

---

### 6. BILDIRISHNOMALAR MARKAZI
**URL**: `/admin-notifications.html` yoki `/admin-notifications-new.html`  
**Maqsadi**: Barcha ogohlantirishnomalarni boshqarish

**Bildirishnoma Turlari**:
- 🔴 Kritik (Jiddiy muammolar)
- 🟠 Ogohlantirish (Diqqat talab qiladi)
- 🔵 Ma'lumot (Umumiy ma'lumot)
- 🟢 Muvaffaqiyat (Musbat xabarlar)

**Ogohlantirishnomalar**:
- Kam qolgan mahsulotlar
- Yuqori qarz
- Kassir xatolari
- Tizim xatolari
- Muvaffaqiyatli savdolar
- Kirim berish tasdiqlari

**Funksiyalari**:
- ✅ Bildirishnomalarni o'qilgan deb belgilash
- ✅ Bildirishnomalarni o'chirish
- ✅ Turi bo'yicha filtrlash
- ✅ Sana bo'yicha filtrlash
- ✅ Bildirishnoma statistikasi

---

### 7. KIRIM BERISH BOSHQARUVI
**URL**: `/admin-handovers.html`  
**Maqsadi**: Kassirlardan pul qabul qilishni tracking qilish

**Funksiyalari**:
- ✅ Barcha kirim berishlarni ko'rish
- ✅ Kassir bo'yicha filtrlash
- ✅ Kirim berish ma'lumotlarini ko'rish
- ✅ Balans o'zgarishlarini tracking qilish
- ✅ Kirim berish statistikasi

**Ko'rsatadigan Ma'lumotlar**:
- Kirim berish ID
- Kassir ismi
- Kirim berilgan summa
- Sana va vaqt
- Oldingi balans
- Yangi balans
- Izohlar

---

### 8. XARAJATLAR BOSHQARUVI
**URL**: `/admin-expenses.html`  
**Maqsadi**: Biznes xarajatlarini tracking qilish

**Funksiyalari**:
- ✅ Yangi xarajat qo'shish
- ✅ Xarajatlarni kategoriyalash
- ✅ To'lov usuli belgilash
- ✅ Xarajat tarixini ko'rish
- ✅ Foyda/zarar hisoblash
- ✅ Xarajat statistikasi

**Xarajat Kategoriyalari**:
- Rent (Ijara)
- Utilities (Kommunal xizmatlar)
- Salary (Oylik)
- Transport (Transport)
- Marketing (Reklama)
- Other (Boshqa)

**Ko'rsatadigan Ma'lumotlar**:
- Xarajat kategoriyasi
- Summa
- To'lov usuli (naqd, karta, bank)
- Tavsifi
- Sana va vaqt
- Qo'shgan foydalanuvchi

---

### 9. IMEI BOSHQARUVI
**URL**: `/admin-imei.html`  
**Maqsadi**: Mahsulot IMEI kodlarini tracking qilish

**Funksiyalari**:
- ✅ Yangi IMEI qo'shish
- ✅ IMEI qidirish
- ✅ Mahsulot/filial/status bo'yicha filtrlash
- ✅ IMEI ma'lumotlarini ko'rish
- ✅ IMEI statusini tracking qilish (mavjud/sotilgan)
- ✅ Sotib olish va sotish narxlarini ko'rish

**Ko'rsatadigan Ma'lumotlar**:
- IMEI kodi
- Mahsulot ID
- Filial ID
- Sotib olish narxi
- Sotish narxi
- Status (mavjud/sotilgan)
- Kimga sotilgan
- Yaratilgan sana

---

### 10. SOZLAMALAR
**URL**: `/admin-settings.html`  
**Maqsadi**: Tizim sozlamalarini konfiguratsiya qilish

**Sozlamalar**:
- 💱 Valyuta sozlamalari (USD/UZS kursi)
- 💱 Asosiy valyuta tanlash
- 💱 Dual currency qo'llab-quvvatlash
- 📅 Backup sozlamalari (avtomatik backup, vaqti)
- ⏱️ Session timeout
- 🔔 Bildirishnoma sozlamalari
- 🌐 Til tanlash
- 📊 Sana formati
- 📄 Sahifada qatorlar soni

---

### 11. XAVFSIZLIK BOSHQARUVI
**URL**: `/admin-security.html`  
**Maqsadi**: Tizim xavfsizligini monitoring qilish

**Funksiyalari**:
- ✅ Faol sessiyalarni ko'rish
- ✅ Sessiyalarni tugatish
- ✅ Login urinishlarini monitoring qilish
- ✅ Muvaffaqiyatsiz login urinishlarini tracking qilish
- ✅ Foydalanuvchilarni bloklash/debloklashtirish
- ✅ Activity log ko'rish
- ✅ 2FA boshqaruvi

**Ko'rsatadigan Ma'lumotlar**:
- Faol sessiyalar soni
- Bugungi loginlar
- Muvaffaqiyatsiz urinishlar
- Bloklangan foydalanuvchilar
- Session ma'lumotlari (foydalanuvchi, IP, vaqt)
- Faoliyat tarixi

---

## 👨‍💻 KASSIR PANEL - TO'LIQ QOLLANMA

### Kassir Login
**URL**: `http://localhost:3000/cashier-login.html`  
**Login**: (test ma'lumotlar)  
**Parol**: (test ma'lumotlar)  

**Funksiyalari**:
- Filial tanlash
- Username/password authentication
- Remember me option
- Session management

---

### 1. KASSIR DASHBOARD
**URL**: `/cashier-dashboard.html`  
**Maqsadi**: Kassir uchun asosiy ish paneli

**Ko'rsatadigan Ma'lumotlar**:
- 💵 Hozirgi balans (USD)
- 💵 Hozirgi balans (UZS - USD ga konvertatsiya)
- 💵 Jami balans
- 📊 Bugungi savdolar summasi
- 📊 Jami savdolar summasi
- 📊 Bugungi savdolar soni
- 💸 Kirim berilgan summa

**Tugmalar**:
- Yangi savdo
- Savdo tarixini ko'rish
- Mijozlarni ko'rish
- Hisobotlarni ko'rish
- Kirim berish
- Chiqish

---

### 2. YANGI SAVDO
**URL**: `/cashier-sale.html`  
**Maqsadi**: Yangi savdo tranzaksiyasini qayd qilish

**Savdo Jarayoni**:
1. Mijoz tanlash yoki yangi mijoz qo'shish
2. Mahsulot qidirish (IMEI, barcode, nomi)
3. Mahsulot miqdorini kiritish
4. To'lov valyutasini tanlash (USD, UZS, ikkalasi)
5. To'lov summasi kiritish
6. Qarz hisoblash (agar kerak bo'lsa)
7. Savdo yakunlash

**Funksiyalari**:
- ✅ Mijoz qidirish/tanlash
- ✅ Mahsulot qidirish (IMEI, barcode, nomi)
- ✅ Ko'p mahsulot qo'shish
- ✅ Multi-currency to'lov (USD, UZS, EUR)
- ✅ Real-time valyuta konvertatsiyasi
- ✅ Qarz hisoblash
- ✅ Savdo yakunlash
- ✅ Telegram chek yuborish

**To'lov Variantlari**:
- Faqat USD
- Faqat UZS
- USD + UZS (ikkalasi)

**Qarz Tizimi**:
- Qarz miqdorini hisoblash
- Qarz statusini ko'rish
- Qarz to'lovini qayd qilish

---

### 3. SAVDO TARIXИ
**URL**: `/cashier-history.html`  
**Maqsadi**: O'tgan savdo tranzaksiyalarini ko'rish

**Filtrlash Variantlari**:
- 📅 Sana oralig'i bo'yicha
- 🔍 Mijoz nomi bo'yicha
- 🔍 Mahsulot nomi bo'yicha
- 📊 Tranzaksiya turi (savdo/to'lov)

**Ko'rsatadigan Ma'lumotlar**:
- Tranzaksiya turi
- Mijoz ismi
- Mahsulot ma'lumotlari
- Sotish narxi
- To'lov summasi
- Sana va vaqt
- Jami soni
- Jami summa
- O'rtacha chek qiymati

**Pagination**:
- Sahifalar bo'yicha ko'rish
- Qatorlar soni tanlash

---

### 4. MIJOZLAR DIREKTORI
**URL**: `/cashier-customers.html`  
**Maqsadi**: Mijozlar ma'lumotlarini boshqarish va qarz tracking

**Funksiyalari**:
- ✅ Yangi mijoz qo'shish
- ✅ Mijoz qidirish
- ✅ Qarz statusiga ko'ra filtrlash (barchasi, qarzlilar, to'liq to'lovchilar)
- ✅ Mijoz ma'lumotlarini ko'rish
- ✅ Mijoz qarzini tracking qilish
- ✅ Mijoz statistikasi

**Ko'rsatadigan Ma'lumotlar**:
- Mijoz ID
- Mijoz ismi
- Telefon raqami
- Jami qarz
- Qarz statusi
- Oxirgi sotib olish sanasi
- Jami sotib olish summasi

**Qarz Statusi**:
- 🟢 To'liq to'lovchi (qarz yo'q)
- 🟠 Qisman qarzli
- 🔴 Jiddiy qarzli

---

### 5. KASSIR HISOBOTLARI
**URL**: `/cashier-reports.html`  
**Maqsadi**: Shaxsiy savdo hisobotlari va statistikasi

**Davr Tanlash**:
- 📅 Bugun
- 📅 Bu hafta
- 📅 Bu oy
- 📅 Barchasi

**Ko'rsatadigan Ma'lumotlar**:
- 💵 USD to'lovlar
- 💵 UZS to'lovlar
- 💵 Jami savdolar (USD)
- 📊 Savdolar soni
- 📊 O'rtacha chek
- 📊 Eng katta savdo
- 👥 Xizmat ko'rsatilgan mijozlar
- 💸 Kirim berilgan summa

**Grafiklar**:
- Savdo trenadi
- Valyuta bo'yicha tahlil
- Kunlik savdolar

---

## 🔐 AUTHENTICATION VA XAVFSIZLIK

### Login Jarayoni
1. **Admin Login** → Admin Dashboard
2. **Kassir Login** → Kassir Dashboard

### Session Boshqaruvi
- Admin sessiyasi: 24 soat
- Kassir sessiyasi: 12 soat
- Remember me optsiyasi mavjud
- Avtomatik logout session tugaganda

### Xavfsizlik Xususiyatlari
- 🔒 Parol himoyasi
- 🔒 Session tracking
- 🔒 Muvaffaqiyatsiz login monitoring
- 🔒 IP address logging
- 🔒 Activity logging
- 🔒 2FA qo'llab-quvvatlash (konfiguratsiya qilingan)

---

## 💱 VALYUTA QOLLAB-QUVVATLASH

### Qo'llab-quvvatlanadigan Valyutalar
- 💵 USD (Dollar) - Asosiy
- 💵 UZS (So'm) - Ikkinchi
- 💵 EUR (Euro) - Ixtiyoriy

### Valyuta Boshqaruvi
- Konfiguratsiya qilingan kurs
- Real-time konvertatsiya
- Dual currency qo'llab-quvvatlash
- Avtomatik konvertatsiya ko'rsatish

---

## 📱 MOBILE RESPONSIVE

Barcha sahifalar quyidagilarni o'z ichiga oladi:
- 📱 Mobile-optimized CSS
- 📱 Responsive grid layouts
- 📱 Touch-friendly buttons
- 📱 Mobile navigation
- 📱 Telefon va planshetlar uchun optimizatsiya

---

## 📊 TRACKING QILINADIGAN STATISTIKALAR

### Admin Darajasi
- Filial faoliyati
- Kassir produktivligi
- Savdo trendlari
- Xarajat tracking
- Inventar darajalari
- Mijoz qarzlari
- Tizim sog'lig'i

### Kassir Darajasi
- Shaxsiy savdolar
- Mijoz o'zaro munosabatlari
- To'lov tracking
- Qarz boshqaruvi
- Faoliyat metrikalari

---

## 🔗 API ENDPOINTS

### Mahsulotlar
- `GET /api/products` - Barcha mahsulotlar
- `POST /api/products` - Yangi mahsulot
- `DELETE /api/products/:id` - Mahsulot o'chirish

### Kassirlar
- `GET /api/cashiers` - Barcha kassirlar
- `POST /api/cashier-sales` - Yangi savdo
- `POST /api/cashier-handover` - Kirim berish

### Hisobotlar
- `GET /api/notifications` - Bildirishnomalar
- `GET /api/activity-log` - Faoliyat tarixi
- `GET /api/stock-in` - Ombor kelishi
- `GET /api/stock-out` - Ombor ketishi

---

## 📤 EXPORT VA REPORTING

### Export Formatlari
- 📊 Excel (.xlsx)
- 📄 PDF (ixtiyoriy)
- 📋 CSV (ixtiyoriy)

### Hisobot Turlari
- 📅 Kunlik hisobotlar
- 📅 Haftalik hisobotlar
- 📅 Oylik hisobotlar
- 📅 Yillik hisobotlar
- 📅 Maxsus sana oralig'i hisobotlari

---

## ✅ COMPLIANCE VA AUDIT

### Audit Trail
- Barcha tranzaksiyalar qayd qilinadi
- Foydalanuvchi faoliyati tracked
- Muvaffaqiyatsiz login urinishlari qayd qilinadi
- Session tarixi saqlanadi
- Ma'lumot o'zgarish tarixi

### Ma'lumot Integraliteti
- Tranzaksiya validatsiyasi
- Balans tekshiruvi
- Qarz tracking
- Inventar reconciliation

---

## 🚀 DEPLOYMENT

### Local
```bash
npm install
npm start
```

### Cloud (Render.com)
1. GitHub ga push qiling
2. Render.com da yangi Web Service yarating
3. Environment variables qo'shing
4. Deploy qiling

---

## 📞 YORDAM VA QOLLANMA

### Tez Boshlash
1. Admin login qiling
2. Filial qo'shish
3. Kassir qo'shish
4. Mahsulot qo'shish
5. Savdo qilish

### Muammolar
- MongoDB ulanmasa: MongoDB Service ni tekshiring
- Port band bo'lsa: .env'da PORT o'zgartiring
- Dependencies xatosi: `npm install` qayta ishga tushiring

---

## 📋 XULOSA

**F-Mobile** - Professional do'kon boshqaruv tizimi bo'lib, quyidagilarni o'z ichiga oladi:

✅ **Admin Panel**: 11 ta asosiy sahifa  
✅ **Kassir Panel**: 6 ta asosiy sahifa  
✅ **Multi-currency**: USD, UZS, EUR  
✅ **Mobile Responsive**: Barcha qurilmalarda ishlaydi  
✅ **Real-time**: Excel export, notifications  
✅ **Secure**: Activity log, role-based access  
✅ **Scalable**: Multi-filial qo'llab-quvvatlash  

**Versiya**: 2.0.0  
**Status**: Production Ready  
**Yaratilgan**: 2026  

---

**Sayt haqida to'liq ma'lumot shu faylda mavjud!**


---

## 🎨 FRONTEND SAHIFALARI - BATAFSIL RO'YXAT

### Admin Sahifalari (12 ta)
1. **admin-dashboard.html** - Asosiy dashboard
2. **admin-branches.html** - Filiallar boshqaruvi
3. **admin-cashiers.html** - Kassirlar boshqaruvi
4. **admin-sales.html** - Savdo qilish
5. **admin-reports.html** - Hisobotlar
6. **admin-notifications.html** - Bildirishnomalar
7. **admin-handovers.html** - Kirim berishlar
8. **admin-expenses.html** - Xarajatlar
9. **admin-imei.html** - IMEI boshqaruvi
10. **admin-settings.html** - Sozlamalar
11. **admin-security.html** - Xavfsizlik
12. **admin-login.html** - Login

### Kassir Sahifalari (6 ta)
1. **cashier-dashboard.html** - Asosiy dashboard
2. **cashier-sale.html** - Yangi savdo
3. **cashier-history.html** - Savdo tarixи
4. **cashier-customers.html** - Mijozlar
5. **cashier-reports.html** - Hisobotlar
6. **cashier-login.html** - Login

### Qo'shimcha Sahifalar
- **warehouse-pro.html** - Ombor boshqaruvi
- **warehouse-professional.html** - Professional ombor
- **activity-log.html** - Faoliyat tarixi
- **index.html** - Bosh sahifa

---

## 🗄️ DATABASE SCHEMA

### Asosiy Kolleksiyalar

**Customers (Mijozlar)**
- ID
- Nomi
- Telefon
- Qarz miqdori
- Qarz statusi
- Oxirgi sotib olish sanasi

**Products (Mahsulotlar)**
- ID
- Nomi
- Kategoriya
- Sotib olish narxi
- Sotish narxi
- Stock miqdori
- IMEI (agar elektronika bo'lsa)

**CashierSales (Kassir Savdolari)**
- ID
- Kassir ID
- Mijoz ID
- Mahsulot ID
- Miqdor
- Narx
- Valyuta (USD/UZS)
- Sana va vaqt

**Cashiers (Kassirlar)**
- ID
- Nomi
- Login
- Parol (hashed)
- Filial ID
- Balans (USD)
- Balans (UZS)
- Faol/Faol emas

**Branches (Filiallar)**
- ID
- Nomi
- Manzili
- Telefon
- Menejer
- Faol/Faol emas

**StockIn/StockOut (Ombor Tarixi)**
- ID
- Mahsulot ID
- Miqdor
- Filial ID
- Sana va vaqt
- Qo'shgan foydalanuvchi

**ActivityLog (Faoliyat Tarixi)**
- ID
- Foydalanuvchi ID
- Harakat turi
- Ma'lumotlar
- IP address
- Sana va vaqt

**Notifications (Bildirishnomalar)**
- ID
- Turi (kritik, ogohlantirish, ma'lumot, muvaffaqiyat)
- Sarlavha
- Tavsifi
- O'qilgan/O'qilmagan
- Sana va vaqt

**Expenses (Xarajatlar)**
- ID
- Kategoriya
- Summa
- To'lov usuli
- Tavsifi
- Sana va vaqt

---

## 🔄 DATA FLOW

### Savdo Jarayoni
```
Kassir Login
    ↓
Dashboard (Balans ko'rish)
    ↓
Yangi Savdo
    ↓
Mijoz Tanlash
    ↓
Mahsulot Qo'shish
    ↓
To'lov Kiritish
    ↓
Savdo Yakunlash
    ↓
Activity Log + Notification
    ↓
Telegram Chek (ixtiyoriy)
```

### Kirim Berish Jarayoni
```
Kassir Dashboard
    ↓
Kirim Berish Tugmasi
    ↓
Kirim Berilgan Summa
    ↓
Admin Qabul Qilish
    ↓
Balans O'zgarishi
    ↓
Activity Log
```

### Admin Hisobot Jarayoni
```
Admin Dashboard
    ↓
Hisobotlar Sahifasi
    ↓
Davr Tanlash
    ↓
Hisobot Yaratish
    ↓
Grafiklar Ko'rish
    ↓
Excel Export
```

---

## 🔔 NOTIFICATION SYSTEM

### Notification Turlari

**Kritik (🔴)**
- Tizim xatosi
- Database ulanmadi
- Xavfsizlik muammosi

**Ogohlantirish (🟠)**
- Kam qolgan mahsulotlar
- Yuqori qarz
- Muvaffaqiyatsiz login

**Ma'lumot (🔵)**
- Yangi savdo
- Yangi mijoz
- Yangi filial

**Muvaffaqiyat (🟢)**
- Savdo yakunlandi
- Kirim berildi
- Backup yakunlandi

### Notification Kanalları
- 📱 In-app notifications
- 🤖 Telegram bot
- 📧 Email (ixtiyoriy)

---

## 🛡️ SECURITY FEATURES

### Authentication
- ✅ Username/Password
- ✅ Session management
- ✅ JWT tokens
- ✅ 2FA (ixtiyoriy)

### Authorization
- ✅ Role-based access (Admin, Kassir)
- ✅ Page-level protection
- ✅ API-level protection

### Data Protection
- ✅ Password hashing (bcrypt)
- ✅ Encryption
- ✅ SSL/TLS
- ✅ CORS protection

### Audit & Logging
- ✅ Activity log
- ✅ Login history
- ✅ Failed login tracking
- ✅ IP logging
- ✅ User agent logging

---

## 📊 PERFORMANCE METRICS

### Tracked Metrics
- 📈 Sales volume
- 📈 Revenue
- 📈 Average transaction value
- 📈 Customer count
- 📈 Debt levels
- 📈 Inventory turnover
- 📈 Cashier performance
- 📈 Branch performance

### KPI (Key Performance Indicators)
- Kunlik savdolar soni
- Kunlik daromad
- O'rtacha chek qiymati
- Qarz miqdori
- Inventory turnover
- Kassir produktivligi

---

## 🔧 TECHNICAL STACK

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: MongoDB Atlas
- **ORM**: Mongoose
- **Authentication**: JWT, bcrypt
- **Validation**: Custom validators

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Responsive design
- **JavaScript**: Vanilla JS (ES6+)
- **Charts**: Chart.js
- **Excel**: XLSX library
- **HTTP**: Fetch API

### DevOps
- **Version Control**: Git
- **Deployment**: Render.com
- **Database**: MongoDB Atlas
- **Process Manager**: PM2
- **Backup**: Automated backups

### External Services
- **Telegram**: Bot API
- **Google Sheets**: API (ixtiyoriy)
- **Email**: SMTP (ixtiyoriy)

---

## 📦 DEPENDENCIES

### Production Dependencies
```json
{
  "bcrypt": "^5.1.1",
  "cors": "^2.8.5",
  "dotenv": "^16.3.1",
  "express": "^4.18.2",
  "express-rate-limit": "^7.1.5",
  "helmet": "^7.1.0",
  "jsonwebtoken": "^9.0.2",
  "mongoose": "^8.0.3",
  "node-cron": "^3.0.3",
  "xlsx": "^0.18.5"
}
```

### Development Dependencies
```json
{
  "nodemon": "^3.0.2"
}
```

---

## 🚀 DEPLOYMENT CHECKLIST

### Local Deployment
- [ ] Node.js o'rnatilgan (v18+)
- [ ] MongoDB o'rnatilgan va ishga tushirilgan
- [ ] .env fayli yaratilgan
- [ ] `npm install` ishga tushirilgan
- [ ] `npm start` bilan server ishga tushirilgan
- [ ] Brauzerda `http://localhost:3000` ochildi

### Cloud Deployment (Render.com)
- [ ] GitHub repository yaratilgan
- [ ] Render.com akkaunt yaratilgan
- [ ] MongoDB Atlas cluster yaratilgan
- [ ] Environment variables qo'shilgan
- [ ] Deploy qilindi
- [ ] HTTPS ishlaydi
- [ ] Database ulanish tekshirildi

---

## 🧪 TESTING

### Test Faylları
- `test-ombor-kassa-sotuv-toliq.js` - Ombor-Kassa-Sotuv testi
- `test-kassa-pul-tizimi.js` - Kassa pul tizimi testi
- `test-hisobotlar-bildirishnomalar.js` - Hisobotlar testi

### Test Jarayoni
```bash
# Ombor-Kassa-Sotuv testi
node test-ombor-kassa-sotuv-toliq.js

# Kassa pul tizimi testi
node test-kassa-pul-tizimi.js

# Hisobotlar va bildirishnomalar testi
node test-hisobotlar-bildirishnomalar.js
```

---

## 📚 API DOCUMENTATION

### Base URL
```
http://localhost:3000/api
```

### Authentication
```
Header: Authorization: Bearer <token>
```

### Response Format
```json
{
  "success": true,
  "data": {},
  "message": "Success message"
}
```

### Error Format
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

---

## 🎓 QUICK START GUIDE

### 1. Admin uchun
```
1. http://localhost:3000/admin-login.html ga oching
2. admin / admin123 bilan login qiling
3. Admin Dashboard ga kirasiz
4. Filial qo'shish uchun "Branches" ga oching
5. Kassir qo'shish uchun "Cashiers" ga oching
6. Mahsulot qo'shish uchun "Products" ga oching
```

### 2. Kassir uchun
```
1. http://localhost:3000/cashier-login.html ga oching
2. Filial tanlang
3. Kassir login bilan kirish
4. Cashier Dashboard ga kirasiz
5. "New Sale" bilan savdo qilish
6. "History" bilan savdo tarixini ko'rish
```

### 3. Hisobotlar uchun
```
1. Admin Dashboard ga oching
2. "Reports" tugmasini bosing
3. Davr tanlang (kunlik, haftalik, oylik, yillik)
4. Grafiklar va statistikalarni ko'ring
5. Excel formatida yuklab oling
```

---

## 🔍 TROUBLESHOOTING

### Muammo: MongoDB ulanmadi
**Yechim**:
```bash
# MongoDB Service ni tekshiring
Get-Service MongoDB

# Agar ishga tushirilmagan bo'lsa
Start-Service MongoDB
```

### Muammo: Port 3000 band
**Yechim**:
```bash
# .env'da PORT o'zgartiring
PORT=3001
```

### Muammo: Dependencies xatosi
**Yechim**:
```bash
# node_modules o'chiring
rmdir /s /q node_modules

# Qayta o'rnating
npm install
```

### Muammo: Login qila olmaydi
**Yechim**:
- .env'da ADMIN_USERNAME va ADMIN_PASSWORD tekshiring
- Browser cache o'chiring
- Yangi tab oching

---

## 📞 SUPPORT

### Dokumentatsiya
- README.md - Asosiy qollanma
- DEPLOYMENT_GUIDE.md - Deploy qollanmasi
- SECURITY_AND_BACKUP_GUIDE.md - Xavfsizlik qollanmasi

### Muammolar
- GitHub Issues da savol bering
- Dokumentatsiyani o'qing
- Test fayllarini ishga tushiring

---

## 📝 CHANGELOG

### Version 2.0.0 (2026)
- ✅ Production Ready
- ✅ Multi-currency support
- ✅ IMEI tracking
- ✅ Real-time Excel export
- ✅ Telegram bot integration
- ✅ Mobile responsive
- ✅ Activity logging
- ✅ Advanced security

### Version 1.0.0 (2025)
- ✅ Initial release
- ✅ Basic features
- ✅ Admin panel
- ✅ Cashier panel

---

## 📄 LICENSE

MIT License - Bepul foydalanish uchun

---

## 👨‍💻 AUTHOR

**Tursunov Alibek**  
Do'kon Pro Team

---

## 🎉 CONCLUSION

**F-Mobile** - Professional do'kon boshqaruv tizimi bo'lib, kichik va o'rta bizneslar uchun mo'ljallangan. Tizim to'liq funktsional, xavfsiz va production-ready.

**Asosiy Afzalliklari**:
- ✅ Oson foydalanish
- ✅ Real-time monitoring
- ✅ Multi-currency support
- ✅ Mobile responsive
- ✅ Secure va reliable
- ✅ Scalable architecture

**Qo'llab-quvvatlanadigan Operatsiyalar**:
- ✅ Filial boshqaruvi
- ✅ Kassir boshqaruvi
- ✅ Savdo qilish
- ✅ Hisobotlar
- ✅ Xarajat tracking
- ✅ Qarz boshqaruvi
- ✅ IMEI tracking
- ✅ Activity logging

**Deployment Variantlari**:
- ✅ Local (Node.js + MongoDB)
- ✅ Cloud (Render.com + MongoDB Atlas)
- ✅ Docker (PM2 ecosystem)

---

**Sayt haqida to'liq ma'lumot shu faylda mavjud!**  
**Yaratilgan**: 2026  
**Versiya**: 2.0.0  
**Status**: ✅ Production Ready
