# Telegram Bot - Final Troubleshooting Guide ✅

## Current Status
✅ Bot is running and polling for messages
✅ Error handler added for debugging
✅ Enhanced logging for all operations
✅ Webhook endpoint active at `http://localhost:5002/webhook/sale`

## Why Bot Might Not Be Responding

### Issue 1: Bot Token Invalid
**Check:**
```bash
# Verify token in .env file
cat f-mobile-backend/.env | grep telegram_bot_token
```

**Solution:**
1. Go to @BotFather on Telegram
2. Create a new bot or get existing token
3. Update `.env` file with correct token
4. Restart bot

### Issue 2: Bot Not Receiving Messages
**Possible Causes:**
- Bot is not in polling mode properly
- Conversation handler not set up correctly
- Message filters blocking messages

**Solution:**
1. Check bot logs for incoming messages
2. Verify bot is in polling mode
3. Try sending `/start` command
4. Check if bot responds to any command

### Issue 3: Conversation State Not Maintained
**Possible Causes:**
- User data not being stored properly
- Conversation handler fallback triggered
- State not transitioning correctly

**Solution:**
1. Check logs for state transitions
2. Verify `context.user_data` is being set
3. Check if conversation handler is catching messages

## Testing Steps

### Step 1: Verify Bot is Running
```bash
# Check if bot process is running
ps aux | grep telegram_bot.py

# Check bot logs
tail -50 bot.log
```

### Step 2: Send /start Command
1. Open Telegram
2. Find bot "Faxriddin Mobile"
3. Send `/start` command
4. Check logs for: `👤 /start command from user`

### Step 3: Share Phone Number
1. Click "📱 Telefon raqamni ulashing" button
2. Share your contact
3. Check logs for: `📱 Contact ulashildi`

### Step 4: Test Menu Buttons
1. Click "📋 Qarzlar" button
2. Check logs for: `🔘 Qarzlar button clicked`
3. Verify response received

### Step 5: Test Receipt Sending
1. Create a sale for registered customer
2. Check logs for: `📨 Webhook sale qabul qilindi`
3. Verify receipt received in Telegram

## Log Patterns to Look For

### Successful /start
```
👤 /start command from user: 123456789 (FirstName)
✅ Menu shown for new user
✅ Start command completed for user 123456789
```

### Successful Phone Registration
```
📱 Contact ulashildi: +998...
📱 Normalized: 998...
🔍 API qidirish: http://localhost:5002/api/customers/public/all
✅ Topildi: Customer Name
💾 Telegram ID saqlandi: customer_id -> 123456789
✅ Telegram ID bazaga saqlandi: 123456789
```

### Successful Menu Button Click
```
🔘 Message received: 📋 Qarzlar
🔘 Qarzlar button clicked
💳 /qarzlar buyrug'i
```

### Successful Receipt Sending
```
📨 Webhook sale qabul qilindi: {...}
📨 Customer ID: ..., Name: ...
📨 Telegram ID from memory: 123456789
📨 Receipt message ready for 123456789
📨 Sending message to 123456789...
✅ Chek yuborildi: 123456789, Message ID: 12345
```

## Common Error Messages

### "Telegram ID not found"
**Cause:** Customer hasn't registered with bot
**Solution:** Customer must send `/start` and share phone

### "Bot app not initialized"
**Cause:** Bot crashed or didn't start
**Solution:** Restart bot with `python telegram_bot.py`

### "API bilan bog'lanishda xato"
**Cause:** Backend API not responding
**Solution:** Check if backend is running on port 5002

### "Mijoz topilmadi"
**Cause:** Phone number not in database
**Solution:** Verify customer exists in database

## Manual Testing Commands

### Test Bot Token
```bash
curl -X GET "https://api.telegram.org/bot{TOKEN}/getMe"
```

### Test Webhook Manually
```bash
curl -X POST http://localhost:5002/webhook/sale \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "CUSTOMER_ID",
    "customer_name": "Test Customer",
    "items": [{"product_name": "Test", "quantity": 1, "price": 100, "total": 100}],
    "total_amount": 100,
    "paid_amount": 100
  }'
```

### Check Bot Health
```bash
curl -X GET http://localhost:5002/webhook/health
```

## Database Checks

### Verify Customer Has Telegram ID
```bash
# MongoDB
db.customers.findOne({_id: ObjectId("CUSTOMER_ID")})

# Should show:
# {
#   _id: ObjectId(...),
#   name: "Customer Name",
#   phone: "+998...",
#   telegramUserId: "123456789",
#   ...
# }
```

### Check All Customers with Telegram IDs
```bash
db.customers.find({telegramUserId: {$exists: true}})
```

## Restart Bot

### Stop Bot
```bash
# Find process ID
ps aux | grep telegram_bot.py

# Kill process
kill -9 PID
```

### Start Bot
```bash
cd f-mobile-backend
python telegram_bot.py
```

## Files to Check

1. **f-mobile-backend/telegram_bot.py** - Main bot file
2. **f-mobile-backend/.env** - Bot token configuration
3. **f-mobile-backend/routes/customers.js** - Customer API
4. **f-mobile-backend/routes/sales.js** - Sales API with webhook
5. **f-mobile-backend/models/Customer.js** - Customer model

## Next Steps

1. **Verify Bot is Running:**
   - Check process: `ps aux | grep telegram_bot.py`
   - Check logs for startup messages

2. **Test /start Command:**
   - Send `/start` to bot
   - Check logs for command received
   - Verify menu shown

3. **Test Phone Registration:**
   - Share phone number
   - Check logs for phone processing
   - Verify customer found in database

4. **Test Menu Buttons:**
   - Click menu buttons
   - Check logs for button clicks
   - Verify responses received

5. **Test Receipt Sending:**
   - Create a sale
   - Check logs for webhook call
   - Verify receipt received

## Support

If bot is still not responding:
1. Check bot token is correct
2. Verify bot is running: `python telegram_bot.py`
3. Check logs for errors
4. Verify backend is running on port 5002
5. Test webhook manually with curl
6. Check database for customer Telegram IDs
