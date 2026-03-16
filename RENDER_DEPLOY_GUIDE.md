# Render.com'ga Deploy Qilish Yo'riqnomasi

## 1. Backend Deploy (f-mobile-backend)

### Render.com'da yangi Web Service yarating:

1. **Render Dashboard** → **New** → **Web Service**
2. GitHub repository'ni ulang: `https://github.com/husniddin4857-cyber/klmk`
3. Quyidagi sozlamalarni kiriting:

**Basic Settings:**
- **Name:** `f-mobile-backend`
- **Region:** Frankfurt (EU Central) yoki Singapore
- **Branch:** `main`
- **Root Directory:** `f-mobile-backend`
- **Runtime:** Node
- **Build Command:** `npm install`
- **Start Command:** `npm start`

**Environment Variables:**
```
NODE_ENV=production
PORT=5002
MONGODB_URI=mongodb+srv://aziz:U4yGi7ej0ePGGyXW@cluster0.k2fswkg.mongodb.net/f-mobile?retryWrites=true&w=majority&authSource=admin&appName=Cluster0
JWT_SECRET=f-mobile-super-secret-key-2026-production
JWT_EXPIRE=7d
ADMIN_USERNAME=admin
ADMIN_PASSWORD=101110
telegram_bot_token=8021647365:AAEuiiKcK63kIWJcJXSlmj4lTtmyai5Hfog
CORS_ORIGIN=*
```

**Advanced Settings:**
- **Health Check Path:** `/api/health`
- **Auto-Deploy:** Yes

4. **Create Web Service** tugmasini bosing

---

## 2. Frontend Deploy (f-mobile)

### Render.com'da yangi Web Service yarating:

1. **Render Dashboard** → **New** → **Web Service**
2. Xuddi shu repository'ni tanlang
3. Quyidagi sozlamalarni kiriting:

**Basic Settings:**
- **Name:** `f-mobile-frontend`
- **Region:** Frankfurt (EU Central) yoki Singapore (backend bilan bir xil)
- **Branch:** `main`
- **Root Directory:** `f-mobile`
- **Runtime:** Node
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`

**Environment Variables:**
```
NEXT_PUBLIC_API_URL=https://f-mobile-backend.onrender.com/api
```

> **Muhim:** Backend deploy bo'lgandan keyin uning URL'ini oling va `NEXT_PUBLIC_API_URL`ga qo'ying

**Advanced Settings:**
- **Health Check Path:** `/`
- **Auto-Deploy:** Yes

4. **Create Web Service** tugmasini bosing

---

## 3. Backend CORS Sozlamalari

Backend deploy bo'lgandan so'ng, frontend URL'ini CORS'ga qo'shish kerak:

1. Backend service'ga o'ting
2. **Environment** → `CORS_ORIGIN` o'zgartiring:
```
CORS_ORIGIN=https://f-mobile-frontend.onrender.com
```
3. **Save Changes** → Service avtomatik qayta ishga tushadi

---

## 4. Deploy Tartibi

1. **Birinchi Backend'ni deploy qiling** (5-10 daqiqa)
2. Backend URL'ini oling: `https://f-mobile-backend.onrender.com`
3. **Keyin Frontend'ni deploy qiling** (5-10 daqiqa)
4. Frontend URL'ini oling: `https://f-mobile-frontend.onrender.com`
5. Backend'dagi CORS_ORIGIN'ni yangilang

---

## 5. Tekshirish

### Backend:
```bash
curl https://f-mobile-backend.onrender.com/api/health
```

### Frontend:
Brauzerda oching: `https://f-mobile-frontend.onrender.com`

---

## 6. Muammolarni Hal Qilish

### Backend ishlamayapti:
- Render Dashboard → Logs'ni tekshiring
- MongoDB URI to'g'riligini tekshiring
- Environment variables to'liqligini tekshiring

### Frontend backend'ga ulanmayapti:
- `NEXT_PUBLIC_API_URL` to'g'riligini tekshiring
- Backend CORS sozlamalarini tekshiring
- Browser Console'da xatolarni ko'ring

### Free Plan Cheklovi:
- 15 daqiqa faoliyatsizlikdan keyin service uxlaydi
- Birinchi so'rovda 30-60 soniya kutish kerak bo'lishi mumkin

---

## 7. Avtomatik Deploy

Har safar `main` branch'ga push qilganingizda:
- Backend avtomatik yangilanadi
- Frontend avtomatik yangilanadi

```bash
git add .
git commit -m "Update"
git push origin main
```

---

## 8. Custom Domain (Ixtiyoriy)

Render'da custom domain qo'shish:
1. Service → Settings → Custom Domain
2. Domain'ingizni kiriting
3. DNS sozlamalarini yangilang

---

## Foydali Linklar

- Backend URL: `https://f-mobile-backend.onrender.com`
- Frontend URL: `https://f-mobile-frontend.onrender.com`
- Render Dashboard: https://dashboard.render.com
- Logs: Har bir service'da "Logs" tab

---

## Xavfsizlik Maslahatlari

1. Production'da `ADMIN_PASSWORD` va `JWT_SECRET`ni o'zgartiring
2. `telegram_bot_token`ni maxfiy saqlang
3. MongoDB IP whitelist'ni sozlang (ixtiyoriy)
4. HTTPS faqat ishlatiladi (Render avtomatik)
