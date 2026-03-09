import logging
import asyncio
from telegram import Update, ReplyKeyboardRemove
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes, ConversationHandler
import requests
from datetime import datetime
from dotenv import load_dotenv
import os

load_dotenv()

# Logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Bot token from .env
BOT_TOKEN = os.getenv('telegram_bot_token') or '8606346204:AAHXKuTfA6FkRZzxipBTAXA_6lopoygPonQ'

# API URL
API_URL = os.getenv('API_URL', 'http://localhost:5001/api')

# Conversation states
WAITING_FOR_PHONE = 1

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Start command - ask for customer phone"""
    user = update.effective_user
    telegram_id = str(user.id)
    
    welcome_text = f"Salom, hurmatli {user.first_name}! 👋\n\nF-Mobile Do'kon Boshqaruv Tizimi Telegram Bot-iga xush kelibsiz!"
    
    await update.message.reply_text(welcome_text)
    await update.message.reply_text(
        "Iltimos, o'zingizning telefon raqamingizni yuboring:\n\n"
        "Misol: +998918959373"
    )
    
    # Store telegram_id in context for later use
    context.user_data['telegram_id'] = telegram_id
    
    return WAITING_FOR_PHONE

async def get_customer_info(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Get customer info by phone number and register telegram ID"""
    phone_input = update.message.text.strip()
    telegram_id = context.user_data.get('telegram_id')
    
    logger.info(f"🔍 Qidirish: {phone_input}, Telegram ID: {telegram_id}")
    
    try:
        customer = None
        customer_id = None
        
        # Get all customers
        logger.info(f"📍 Barcha mijozlarni qidirish...")
        all_customers_response = requests.get(
            f'{API_URL}/customers/public/all',
            headers={'Content-Type': 'application/json'},
            timeout=5
        )
        
        logger.info(f"📊 Barcha mijozlar javob: {all_customers_response.status_code}")
        
        if all_customers_response.status_code == 200:
            all_customers_data = all_customers_response.json()
            all_customers = all_customers_data.get('data') or all_customers_data or []
            
            logger.info(f"📋 Jami mijozlar: {len(all_customers)}")
            
            # Search for customer by phone
            for cust in all_customers:
                phone = cust.get('phone', '').replace(' ', '').replace('-', '')
                search_phone = phone_input.replace(' ', '').replace('-', '')
                
                logger.info(f"🔎 Tekshirish: {phone} == {search_phone}")
                
                if phone == search_phone or cust.get('phone') == phone_input:
                    customer = cust
                    customer_id = cust.get('_id')
                    logger.info(f"✅ Telefon bilan topildi: {customer}")
                    break
        
        if not customer or not customer_id:
            logger.warning(f"⚠️ Mijoz topilmadi: {phone_input}")
            await update.message.reply_text(
                "❌ Mijoz topilmadi. Iltimos, to'g'ri telefon raqamni kiriting."
            )
            await update.message.reply_text("Boshqa telefon raqamni kiriting:")
            return WAITING_FOR_PHONE
        
        # Register telegram ID for this customer
        logger.info(f"📝 Telegram ID ni ro'yxatga olish: {customer_id} -> {telegram_id}")
        update_response = requests.put(
            f'{API_URL}/customers/{customer_id}',
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {os.getenv("ADMIN_TOKEN", "")}'
            },
            json={'telegramUserId': telegram_id},
            timeout=5
        )
        
        if update_response.status_code in [200, 201]:
            logger.info(f"✅ Telegram ID muvaffaqiyatli ro'yxatga olindi")
        else:
            logger.warning(f"⚠️ Telegram ID ro'yxatga olishda xato: {update_response.status_code}")
        
        # Fetch sales for this customer
        sales_response = requests.get(
            f'{API_URL}/sales/public/all',
            headers={'Content-Type': 'application/json'},
            timeout=5
        )
        
        sales_data = sales_response.json()
        all_sales = sales_data.get('data') or sales_data or []
        
        # Filter sales for this customer
        customer_sales = [
            sale for sale in all_sales 
            if (isinstance(sale.get('customer'), dict) and sale.get('customer', {}).get('_id') == customer_id) or 
               sale.get('customer') == customer_id
        ]
        
        # Build response message
        debt = customer.get('debt', 0)
        total_purchase = customer.get('totalPurchase', 0)
        name = customer.get('name', 'Noma\'lum')
        phone = customer.get('phone', 'Noma\'lum')
        address = customer.get('address', 'Noma\'lum')
        
        logger.info(f"📊 Customer data: name={name}, phone={phone}, debt={debt}, total={total_purchase}")
        
        message = f"""
📋 MIJOZ MA'LUMOTLARI
{'='*40}

👤 Ismi: {name}
📱 Telefon: {phone}
📍 Manzil: {address}

💰 QARZ VA SAVDO
{'='*40}

💵 Jami Qarz: ${debt:.2f}
🛍️ Jami Savdolar: ${total_purchase:.2f}
📊 Savdo Soni: {len(customer_sales)}

✅ Telegram ID muvaffaqiyatli ro'yxatga olindi!
Endi savdo cheklari shu yerga yuboriladi.
        """
        
        await update.message.reply_text(message)
        
        # Show recent sales
        if customer_sales:
            sales_message = "\n📜 SO'NGGI SAVDOLAR:\n" + "="*40 + "\n"
            
            for i, sale in enumerate(customer_sales[-5:], 1):  # Last 5 sales
                try:
                    sale_date = datetime.fromisoformat(
                        sale.get('createdAt', '').replace('Z', '+00:00')
                    ).strftime('%d.%m.%Y %H:%M')
                except:
                    sale_date = 'Noma\'lum'
                
                # Handle items - product can be string or object
                items_text_list = []
                for item in sale.get('items', []):
                    quantity = item.get('quantity', 0)
                    product = item.get('product', {})
                    
                    # If product is a string (ID), just show quantity
                    if isinstance(product, str):
                        items_text_list.append(f"x{quantity}")
                    else:
                        # If product is an object, show name
                        product_name = product.get('name', 'Noma\'lum') if isinstance(product, dict) else 'Noma\'lum'
                        items_text_list.append(f"{product_name} x{quantity}")
                
                items_text = ", ".join(items_text_list) if items_text_list else "Noma\'lum"
                
                debt_amount = sale.get('debt', 0)
                paid_amount = sale.get('paidAmount', 0)
                total_amount = sale.get('totalAmount', 0)
                
                sales_message += f"""
{i}. Sana: {sale_date}
   Mahsulotlar: {items_text}
   Jami: ${total_amount:.2f}
   To'langan: ${paid_amount:.2f}
   Qarz: ${debt_amount:.2f}
"""
            
            await update.message.reply_text(sales_message)
        else:
            await update.message.reply_text("📭 Bu mijozning savdolari yo'q")
        
        return WAITING_FOR_PHONE
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Request error: {e}")
        await update.message.reply_text(
            f"❌ API bilan bog'lanishda xato: {str(e)}\n\nIltimos, qayta urinib ko'ring."
        )
        await update.message.reply_text("Telefon raqamni kiriting:")
        return WAITING_FOR_PHONE
    except Exception as e:
        logger.error(f"Error: {e}")
        await update.message.reply_text(
            f"❌ Xato yuz berdi: {str(e)}\n\nIltimos, qayta urinib ko'ring."
        )
        await update.message.reply_text("Telefon raqamni kiriting:")
        return WAITING_FOR_PHONE

async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Cancel operation"""
    await update.message.reply_text(
        "Bekor qilindi. /start bosing qayta boshlash uchun.",
        reply_markup=ReplyKeyboardRemove()
    )
    return ConversationHandler.END

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Help command"""
    help_text = """
🤖 BOT BUYRUQLARI:

/start - Botni boshlash va Telegram ID ni ro'yxatga olish
/help - Yordam
/cancel - Bekor qilish

📝 FOYDALANISH:
1. /start bosing
2. O'zingizning telefon raqamingizni kiriting
3. Bot sizga ma'lumotlaringizni ko'rsatadi
4. Savdo cheklari shu yerga yuboriladi

💡 MISOL:
Telefon: +998918959373
"""
    await update.message.reply_text(help_text)

def main() -> None:
    """Start the bot"""
    if not BOT_TOKEN:
        print("❌ Bot token topilmadi! .env faylida telegram_bot_token qo'shing")
        return
    
    print("🤖 Bot ishga tushmoqda...")
    
    # Create application
    application = Application.builder().token(BOT_TOKEN).build()
    
    # Conversation handler
    conv_handler = ConversationHandler(
        entry_points=[CommandHandler('start', start)],
        states={
            WAITING_FOR_PHONE: [
                CommandHandler('start', start),
                MessageHandler(filters.TEXT & ~filters.COMMAND, get_customer_info)
            ]
        },
        fallbacks=[CommandHandler('cancel', cancel), CommandHandler('start', start)]
    )
    
    # Add handlers
    application.add_handler(conv_handler)
    application.add_handler(CommandHandler('help', help_command))
    
    # Start bot
    print("✅ Bot muvaffaqiyatli ishga tushdi!")
    print("🔗 API URL:", API_URL)
    print("📱 Bot token:", BOT_TOKEN[:20] + "..." if BOT_TOKEN else "NOT SET")
    
    application.run_polling()

if __name__ == '__main__':
    main()
