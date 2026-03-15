# Telegram Bot Receipt Feature - Testing & Troubleshooting Guide ✅

## Current Status
✅ Bot is running and responding to menu buttons
✅ Webhook endpoint is active at `http://localhost:5002/webhook/sale`
✅ Enhanced logging added for debugging

## How the Receipt Feature Works

### Step 1: Customer Registration
1. Open Telegram
2. Find the bot "Faxriddin Mobile"
3. Send `/start` command
4. Share your phone number using the contact button
5. Bot verifies you and saves your **Telegram ID** to the database

### Step 2: Sale Creation
1. Cashier creates a sale for the customer
2. Backend sends webhook to bot with sale details
3. Bot looks up customer's Telegram ID
4. Bot sends receipt to customer

### Step 3: Receipt Delivery
Customer receives a formatted receipt with:
- Customer name
- Product list with quantities and prices
- Total amount
- Payment amount
- Debt amount

## Troubleshooting

### Issue 1: Bot Not Responding to /start
**Solution:**
- Check bot token in `.env` file
- Verify bot is running: `python telegram_bot.py`
- Check logs for errors

### Issue 2: Receipt Not Sent After Sale
**Possible Causes:**

1. **Customer Telegram ID Not Saved**
   - Verify customer registered with bot
   - Check database: `db.customers.findOne({_id: "customer_id"})`
   - Should have `telegramUserId` field

2. **Webhook Not Called**
   - Check backend logs for webhook call
   - Verify sale was created successfully
   - Check if customer ID is correct

3. **Bot App Not Initialized**
   - Restart bot: `python telegram_bot.py`
   - Check for errors in startup

## Testing Checklist

### Test 1: Customer Registration
- [ ] Send `/start` to bot
- [ ] Share phone number
- [ ] Receive customer info message
- [ ] Check database for `telegramUserId`

### Test 2: Menu Buttons
- [ ] Click "📋 Qarzlar" button
- [ ] Click "📦 Oxirgi Savdo" button
- [ ] Verify responses are correct

### Test 3: Receipt Sending
- [ ] Create a sale for registered customer
- [ ] Check bot logs for webhook call
- [ ] Verify receipt received in Telegram
- [ ] Check receipt format and content

## Debugging Commands

### Check Bot Logs
```bash
# View last 50 lines of bot output
tail -50 bot.log

# Search for webhook calls
grep "Webhook sale" bot.log

# Search for errors
grep "❌" bot.log
```

### Check Database
```bash
# Find customer with Telegram ID
db.customers.findOne({telegramUserId: {$exists: true}})

# Check all customers
db.customers.find({}).pretty()
```

### Test Webhook Manually
```bash
curl -X POST http://localhost:5002/webhook/sale \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "CUSTOMER_ID",
    "customer_name": "Test Customer",
    "items": [
      {
        "product_name": "Test Product",
        "quantity": 1,
        "price": 100,
        "total": 100
      }
    ],
    "total_amount": 100,
    "paid_amount": 100
  }'
```

## Enhanced Logging

The bot now logs:
- ✅ Webhook receipt with full data
- ✅ Customer ID and name
- ✅ Telegram ID lookup (memory and database)
- ✅ Receipt message preparation
- ✅ Message sending status
- ✅ Error details with traceback

### Log Examples

**Successful Receipt:**
```
📨 Webhook sale qabul qilindi: {...}
📨 Customer ID: 123..., Name: John
📨 Items: 1, Total: 100, Paid: 100
📨 Telegram ID from memory: 987654321
📨 Receipt message ready for 987654321
📨 Bot app status: True
📨 Sending message to 987654321...
✅ Chek yuborildi: 987654321, Message ID: 12345
```

**Missing Telegram ID:**
```
📨 Webhook sale qabul qilindi: {...}
📨 Telegram ID from memory: None
⚠️ Telegram ID topilmadi memory-da: 123...
📨 Telegram ID from database: 987654321
✅ Chek yuborildi: 987654321
```

## Common Issues & Solutions

### Issue: "Telegram ID not found"
**Cause:** Customer hasn't registered with bot
**Solution:** 
1. Customer must send `/start` to bot
2. Customer must share phone number
3. Wait for confirmation message

### Issue: "Bot app not initialized"
**Cause:** Bot crashed or didn't start properly
**Solution:**
1. Check for errors in bot startup
2. Restart bot: `python telegram_bot.py`
3. Check Python version (3.8+)

### Issue: Webhook returns 404
**Cause:** Customer Telegram ID not found anywhere
**Solution:**
1. Verify customer registered with bot
2. Check database for `telegramUserId`
3. If missing, customer needs to re-register

## Files Involved

- `f-mobile-backend/telegram_bot.py` - Bot with webhook handler
- `f-mobile-backend/routes/customers.js` - Customer API with Telegram ID endpoint
- `f-mobile-backend/routes/sales.js` - Sales API that calls webhook
- `f-mobile-backend/models/Customer.js` - Customer model with `telegramUserId` field

## Next Steps

1. **Test Receipt Feature:**
   - Register customer with bot
   - Create a sale
   - Verify receipt received

2. **Monitor Logs:**
   - Watch for webhook calls
   - Check for errors
   - Verify Telegram ID lookup

3. **Troubleshoot Issues:**
   - Use debugging commands above
   - Check logs for specific errors
   - Verify database entries

## Support

If receipts are not being sent:
1. Check bot is running: `python telegram_bot.py`
2. Verify customer registered with bot
3. Check logs for webhook calls
4. Verify database has `telegramUserId`
5. Test webhook manually with curl command above
