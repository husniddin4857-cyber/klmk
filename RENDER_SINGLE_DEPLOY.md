# Bitta Servarda Deploy Qilish (Render.com)

## Sozlamalar

1. **Render Dashboard** → **New** → **Web Service**
2. Repository: `https://github.com/husniddin4857-cyber/klmk`
3. Quyidagi sozlamalarni kiriting:

### Basic Settings:
- **Name:** `f-mobile-app`
- **Region:** Frankfurt (EU Central) yoki Singapore
- **Branch:** `main`
- **Root Directory:** (bo'sh qoldiring - root)
- **Runtime:** Node
- **Build Command:** `npm run build`
- **Start Command:** `npm start`
- **Instance Type:** Free

### Environment Variables:
```
# Backend
NODE_ENV=production
BACKEND_PORT=5002
MONGODB_URI=mongodb+srv://aziz:U4yGi7ej0ePGGyXW@cluster0.k2fswkg.mongodb.net/f-mobile?retryWrites=true&w=majority&authSource=admin&appName=Cluster0
JWT_SECRET=f-mobile-super-secret-key-2026-production
JWT_EXPIRE=7d
ADMIN_USERNAME=admin
ADMIN_PASSWORD=101110
telegram_bot_token=8021647365:AAEuiiKcK63kIWJcJXSlmj4lTtmyai5Hfog
CORS_ORIGIN=*

# Frontend
PORT=10000
NEXT_PUBLIC_API_URL=http://localhost:5002/api
```

### Advanced Settings:
- **Health Check Path:** `/`
- **Auto-Deploy:** Yes

4. **Create Web Service**

---

## Qanday Ishlaydi?

1. **Build vaqtida:**
   - Backend dependencies install qilinadi
   - Frontend dependencies install qilinadi
   - Frontend build qilinadi (production)

2. **Runtime'da:**
   - Backend 5002 portda ishga tushadi
   - Frontend 10000 portda ishga tushadi (Render default)
   - Ikkala server parallel ishlaydi

3. **URL:**
   - Frontend: `https://f-mobile-app.onrender.com` (asosiy)
   - Backend API: `https://f-mobile-app.onrender.com:5002/api` (ichki)

---

## Afzalliklari

✅ Bitta service - oson boshqarish
✅ Bitta URL
✅ CORS muammosi yo'q (localhost)
✅ Arzon (bitta free tier)

## Kamchiliklari

⚠️ Backend va frontend bir-biriga bog'liq
⚠️ Biri ishlamasa, ikkinchisi ham to'xtaydi
⚠️ Scaling qiyin

---

## Tekshirish

Deploy tugagandan keyin:
```bash
# Frontend
curl https://f-mobile-app.onrender.com

# Backend
curl https://f-mobile-app.onrender.com:5002/api/health
```

Brauzerda: `https://f-mobile-app.onrender.com`

---

## Muammolarni Hal Qilish

### Build failed:
- Logs'ni tekshiring
- `npm run build` local'da test qiling

### Frontend ishlamayapti:
- `NEXT_PUBLIC_API_URL` to'g'riligini tekshiring
- Browser console'da xatolarni ko'ring

### Backend ishlamayapti:
- MongoDB URI to'g'riligini tekshiring
- Environment variables to'liqligini tekshiring
