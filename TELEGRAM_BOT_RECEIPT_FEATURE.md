# Telegram Bot - Automatic Receipt Feature ✅

## Overview
The Telegram bot now automatically sends a receipt (chek) to customers when a sale is made. This feature ensures customers receive immediate notification of their purchases.

## How It Works

### 1. Customer Registration
When a customer uses the bot:
1. Sends `/start` command
2. Shares their phone number
3. Bot verifies them in the system
4. **Bot stores their Telegram ID in the database** (`telegramUserId` field in Customer model)

### 2. Sale Creation
When a cashier creates a sale:
1. Cashier completes the sale in the app
2. Sale is saved to the database
3. Backend automatically sends a webhook to the bot with sale details
4. Bot looks up the customer's Telegram ID
5. **Bot sends a formatted receipt to the customer via Telegram**

### 3. Receipt Format
The receipt includes:
```
📦 YANGI SAVDO
========================================

👤 Mijoz: [Customer Name]
📱 Telefon: [Phone Number]

🛍️ Mahsulotlar: [Product List]

💰 SUMMA
========================================
Jami: [Total Amount]
To'lov Turlari: [Payment Methods]
Qarz: [Debt Amount]

✅ Savdo muvaffaqiyatli yakunlandi!
```

## Files Modified

### 1. **f-mobile-backend/routes/customers.js**
- ✅ Added new public endpoint: `PUT /api/customers/public/:id/telegram`
- Allows bot to update customer's Telegram ID without authentication
- Stores `telegramUserId` in the database

### 2. **f-mobile-backend/telegram_bot.py**
- ✅ Updated `get_customer_info()` function
- Now calls the new endpoint to save Telegram ID to database
- Logs confirmation when Telegram ID is saved

### 3. **f-mobile-backend/routes/sales.js** (Already Implemented)
- Already has webhook functionality
- Sends sale data to bot when sale is created
- Includes customer info and item details

## Database Changes

### Customer Model
The `telegramUserId` field already exists in the Customer model:
```javascript
telegramUserId: {
  type: String,
  sparse: true
}
```

## Flow Diagram

```
Customer Registration:
┌─────────────────────────────────────────────────────────┐
│ 1. Customer sends /start                                │
│ 2. Customer shares phone number                         │
│ 3. Bot verifies customer in database                    │
│ 4. Bot saves Telegram ID to database                   │
│    PUT /api/customers/public/{id}/telegram             │
│ 5. Customer sees menu with options                      │
└─────────────────────────────────────────────────────────┘

Sale Creation:
┌─────────────────────────────────────────────────────────┐
│ 1. Cashier creates sale in app                          │
│ 2. Sale saved to database                              │
│ 3. Backend sends webhook to bot                         │
│    POST /webhook/sale                                   │
│ 4. Bot receives sale data with customer_id             │
│ 5. Bot looks up customer's Telegram ID                 │
│ 6. Bot sends receipt to customer                        │
│    sendMessage(chat_id=telegramUserId, text=receipt)   │
└─────────────────────────────────────────────────────────┘
```

## Testing

To test the feature:

1. **Register a customer in the bot:**
   - Open Telegram
   - Find the bot
   - Send `/start`
   - Share your phone number
   - Verify you're registered

2. **Create a sale:**
   - Go to Cashier → Sale
   - Select the customer
   - Add products
   - Complete the sale

3. **Check Telegram:**
   - You should receive a receipt message immediately
   - Receipt shows all sale details

## API Endpoints

### Update Customer Telegram ID
```
PUT /api/customers/public/:id/telegram
Content-Type: application/json

{
  "telegramUserId": "123456789"
}

Response:
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "Customer Name",
    "phone": "+998...",
    "telegramUserId": "123456789",
    ...
  }
}
```

### Sale Webhook
```
POST /webhook/sale
Content-Type: application/json

{
  "customer_id": "...",
  "customer_name": "Customer Name",
  "items": [
    {
      "product_name": "Product Name",
      "quantity": 1,
      "price": 100,
      "total": 100
    }
  ],
  "total_amount": 100,
  "paid_amount": 100
}
```

## Features

✅ Automatic receipt sending when sale is created
✅ Customer Telegram ID stored in database
✅ Receipt includes all sale details
✅ Formatted message with emojis for better readability
✅ Error handling and logging
✅ Works with multiple payment methods
✅ Shows debt information

## Notes

- Telegram ID is stored when customer first registers with the bot
- Receipt is sent automatically - no manual action needed
- If customer hasn't registered with bot, no receipt is sent (but sale still completes)
- Bot runs 24/7 and sends receipts in real-time
- All communication is logged for debugging

## Future Enhancements

- Add receipt history in bot
- Allow customers to request receipt resend
- Add payment confirmation options
- Send daily summary reports
- Add customer support chat feature
