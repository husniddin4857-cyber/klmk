# Telegram Bot Setup Guide

## 📱 Telegram Bot Ishga Tushirish

### 1. Python O'rnatish

**Windows:**
```bash
# Python 3.8+ o'rnatilganligini tekshiring
python --version
```

**macOS/Linux:**
```bash
python3 --version
```

### 2. Kerakli Paketlarni O'rnatish

```bash
cd f-mobile-backend
pip install -r requirements.txt
```

Yoki alohida:
```bash
pip install python-telegram-bot==20.7 requests==2.31.0 python-dotenv==1.0.0
```

### 3. Bot Tokenini Tekshirish

`.env` faylida `telegram_bot_token` mavjud:
```
telegram_bot_token=8606346204:AAHXKuTfA6FkRZzxipBTAXA_6lopoygPonQ
```

### 4. Botni Ishga Tushirish

**Windows:**
```bash
python telegram_bot.py
```

**macOS/Linux:**
```bash
python3 telegram_bot.py
```

### 5. Telegram Bot Foydalanish

1. Telegram-da bot qidiring: `@f_mobile_store_bot`
2. `/start` buyrug'ini yuboring
3. Telefon raqamingizni kiriting
4. Bot sizga ma'lumotlaringizni ko'rsatadi

### 📋 Bot Buyruqlari

- `/start` - Botni boshlash va Telegram ID ni ro'yxatga olish
- `/help` - Yordam
- `/cancel` - Bekor qilish

### 🔧 Troubleshooting

**Agar bot ishga tushmasa:**

1. Python o'rnatilganligini tekshiring:
   ```bash
   python --version
   ```

2. Paketlarni qayta o'rnatib ko'ring:
   ```bash
   pip install --upgrade python-telegram-bot requests python-dotenv
   ```

3. `.env` faylida `telegram_bot_token` mavjudligini tekshiring

4. Backend API ishga tushganligini tekshiring:
   ```bash
   curl http://localhost:5001/api/health
   ```

### 📊 Bot Xususiyatlari

- ✅ Mijoz ma'lumotlarini qidirish
- ✅ Qarz va savdo statistikasi
- ✅ So'nggi savdolar ro'yxati
- ✅ Telegram ID ro'yxatga olish
- ✅ Savdo cheklari yuborish (kelajakda)

### 🚀 Production Deployment

Bot-ni production-da ishga tushirish uchun:

1. **Systemd Service (Linux):**
   ```bash
   sudo nano /etc/systemd/system/f-mobile-bot.service
   ```

   ```ini
   [Unit]
   Description=F-Mobile Telegram Bot
   After=network.target

   [Service]
   Type=simple
   User=ubuntu
   WorkingDirectory=/home/ubuntu/f-mobile-backend
   ExecStart=/usr/bin/python3 /home/ubuntu/f-mobile-backend/telegram_bot.py
   Restart=always
   RestartSec=10

   [Install]
   WantedBy=multi-user.target
   ```

   ```bash
   sudo systemctl enable f-mobile-bot
   sudo systemctl start f-mobile-bot
   ```

2. **PM2 (Node.js):**
   ```bash
   npm install -g pm2
   pm2 start telegram_bot.py --name "f-mobile-bot" --interpreter python3
   pm2 save
   pm2 startup
   ```

3. **Docker:**
   ```dockerfile
   FROM python:3.11-slim
   WORKDIR /app
   COPY requirements.txt .
   RUN pip install -r requirements.txt
   COPY telegram_bot.py .
   COPY .env .
   CMD ["python", "telegram_bot.py"]
   ```

### 📞 Bot Sozlamalari

Bot sozlamalarini o'zgartirish uchun `.env` faylini tahrirlang:

```env
# Telegram Bot Token
telegram_bot_token=YOUR_BOT_TOKEN

# API URL
API_URL=http://localhost:5001/api

# Admin Token (opsional)
ADMIN_TOKEN=your_admin_token
```

### 🔐 Xavfsizlik

- Bot token-ni hech kimga bermang
- `.env` faylini `.gitignore`-ga qo'shing
- Production-da environment variables-ni xavfsiz saqlang
- Bot-ni regular yangilang

---

**Savollar bo'lsa, xabar bering!** 🚀
