# Telegram Bot Yangilangan Xususiyatlari

## 🎯 Asosiy O'zgartirishlar

### 1. **Telefon Raqamni Ulashish Tugmasi**
- Bot endi "📱 Telefon raqamni ulashing" tugmasini ko'rsatadi
- Foydalanuvchi tugmani bosib, telefon raqamini ulashishi mumkin
- Yoki qo'lda telefon raqamini yozib yuborishi mumkin

### 2. **Mijoz Ro'yxatga Olish**
Bot quyidagi qadamlarni bajaradi:
1. Foydalanuvchi `/start` buyrug'ini yuboradi
2. Bot "📱 Telefon raqamni ulashing" tugmasini ko'rsatadi
3. Foydalanuvchi tugmani bosadi yoki raqamni yozadi
4. Bot raqamni tekshiradi va mijozlar bazasida qidiradi
5. Agar mijoz topilsa:
   - Mijozning ma'lumotlarini ko'rsatadi: **"Hurmatli [Ismi]!"**
   - Telegram ID-ni saqlaydi
   - Sotuv cheklari yuborish uchun tayyor bo'ladi

### 3. **Qarzlar va Savdolar Ro'yxati** ✨ YANGI
`/qarzlar` buyrug'i bilan:
- Barcha savdolar ro'yxati
- Har bir savdo uchun:
  - 📅 Sana va vaqt
  - 📦 Qanday mahsulotlar olgan (nomi va soni)
  - 💰 Jami summa
  - ✅ To'langan summa
  - 💳 Qarz miqdori

Misol:
```
💳 QARZLAR VA SAVDOLAR
══════════════════════════════════════════════════

👤 Hurmatli Karim!
📱 Telefon: +998902345678

📊 UMUMIY MA'LUMOTLAR
══════════════════════════════════════════════════

💵 Jami Qarz: $150.00
🛍️ Jami Savdolar: $500.00
📜 Savdo Soni: 5 ta

══════════════════════════════════════════════════
📋 BARCHA SAVDOLAR RO'YXATI
══════════════════════════════════════════════════

1. 📅 14.03.2026 10:30
   📦 Mahsulotlar: iPhone 13 x1, Charger x2
   💰 Jami: $100.00
   ✅ To'langan: $50.00
   💳 Qarz: $50.00

2. 📅 13.03.2026 15:45
   📦 Mahsulotlar: Samsung A12 x1
   💰 Jami: $150.00
   ✅ To'langan: $100.00
   💳 Qarz: $50.00
```

### 4. **Sotuv Cheki Yuborish**
Sotuv bo'lganda:
1. Backend `/webhook/sale` endpoint-ga POST request yuboradi
2. Bot Telegram ID-ni qidiradi
3. Agar Telegram ID topilsa, chekni yuboradi:
   ```
   📋 SAVDO CHEKI
   ══════════════════════════════════════════════════
   
   👤 Mijoz: Karim
   
   📦 MAHSULOTLAR:
   iPhone 13 x1 = $500.00
   Charger x2 = $20.00
   
   ══════════════════════════════════════════════════
   
   💰 JAMI: $520.00
   ✅ TO'LANGAN: $300.00
   💵 QARZ: $220.00
   
   Rahmat, yana kelishingizni kutamiz! 🙏
   ```

## 📱 Bot Buyruqlari

| Buyruq | Tavsif |
|--------|--------|
| `/start` | Botni boshlash va Telegram ID ro'yxatga olish |
| `/balans` | Mijozning balansini ko'rish |
| `/qarzlar` | Qarzlar va barcha savdolarni ko'rish |
| `/help` | Yordam |
| `/cancel` | Bekor qilish |

## 🔧 Texnik Tafsilotlar

### Telefon Raqamni Qabul Qilish
```python
# Contact button orqali
MessageHandler(filters.CONTACT, get_customer_info)

# Yoki text orqali
MessageHandler(filters.TEXT & ~filters.COMMAND, get_customer_info)
```

### Telegram ID Saqlash
```python
user_telegram_ids[customer_id] = telegram_id
```

### Webhook Endpoint
```
POST /webhook/sale
Content-Type: application/json

{
  "customer_id": "...",
  "customer_name": "...",
  "items": [
    {
      "product_name": "iPhone 13",
      "quantity": 1,
      "price": 500,
      "total": 500
    }
  ],
  "total_amount": 500,
  "paid_amount": 300
}
```

## 🚀 Ishga Tushirish

```bash
cd f-mobile-backend
python telegram_bot.py
```

## 📊 Bot Xususiyatlari

✅ Telefon raqamni ulashish tugmasi
✅ Mijoz ro'yxatga olish
✅ Telegram ID saqlash
✅ Sotuv cheklari yuborish
✅ Balans ko'rish
✅ Qarzlar va savdolar ro'yxati (YANGI)
✅ Real-time notifikatsiyalar
✅ Webhook orqali integratsiya

## 🔐 Xavfsizlik

- Bot token `.env` faylida saqlangan
- Telegram ID-lar xotiraga saqlangan (production-da database-ga saqlash kerak)
- Webhook-lar faqat POST request-larni qabul qiladi

## 📝 Kelajakdagi Takomillashtirishlar

1. Telegram ID-larni database-ga saqlash
2. Sotuv chekini PDF sifatida yuborish
3. Qarz to'lash notifikatsiyalari
4. Mahsulot katalogi
5. Buyurtma qilish imkoniyati

---

**Bot muvaffaqiyatli ishga tushdi!** 🎉
