import logging
import re
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes, ConversationHandler
import requests
from datetime import datetime
from dotenv import load_dotenv
import os
from flask import Flask, request, jsonify
import threading

load_dotenv()

# Logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Bot token from .env
BOT_TOKEN = os.getenv('telegram_bot_token') or '8606346204:AAHXKuTfA6FkRZzxipBTAXA_6lopoygPonQ'
API_URL = os.getenv('API_URL', 'http://localhost:5002/api')

# Conversation states
WAITING_FOR_PHONE = 1

# Global variable to store bot application
bot_app = None

# Flask app for webhook
flask_app = Flask(__name__)

# Store user telegram IDs by customer ID
user_telegram_ids = {}

def normalize_phone(phone: str) -> str:
    """Normalize phone number for comparison"""
    normalized = re.sub(r'\D', '', phone)
    if len(normalized) > 12:
        normalized = normalized[-12:]
    return normalized

async def show_main_menu(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Show main menu"""
    from telegram import ReplyKeyboardMarkup, KeyboardButton
    
    try:
        customer_id = context.user_data.get('customer_id')
        customer_name = context.user_data.get('customer_name')
        
        if customer_id:
            # Menu for registered customers
            menu_buttons = [
                [KeyboardButton(text="📋 Qarzlar")],
                [KeyboardButton(text="📦 Oxirgi Savdo")]
            ]
            reply_markup = ReplyKeyboardMarkup(menu_buttons, resize_keyboard=True)
            
            await update.message.reply_text(
                f"👋 Salom, {customer_name}!\n\n"
                "Quyidagi variantlardan birini tanlang:",
                reply_markup=reply_markup
            )
            logger.info(f"✅ Menu shown for registered customer: {customer_name}")
        else:
            # Menu for new users
            contact_button = KeyboardButton(text="📱 Telefon raqamni ulashing", request_contact=True)
            reply_markup = ReplyKeyboardMarkup([[contact_button]], one_time_keyboard=True, resize_keyboard=True)
            
            await update.message.reply_text(
                "Salom! 👋\n\n"
                "F-Mobile Do'kon Boshqaruv Tizimi Telegram Bot-iga xush kelibsiz!\n\n"
                "Iltimos, telefon raqamingizni ulashing:",
                reply_markup=reply_markup
            )
            logger.info(f"✅ Menu shown for new user")
    except Exception as e:
        logger.error(f"❌ Error showing menu: {e}")
        import traceback
        logger.error(f"❌ Traceback: {traceback.format_exc()}")

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Start command"""
    user = update.effective_user
    logger.info(f"👤 /start command from user: {user.id} ({user.first_name})")
    
    context.user_data['customer_id'] = None
    context.user_data['customer_name'] = None
    context.user_data['telegram_id'] = str(user.id)
    
    await show_main_menu(update, context)
    
    logger.info(f"✅ Start command completed for user {user.id}")
    return WAITING_FOR_PHONE

async def get_customer_info(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Get customer info by phone"""
    telegram_id = str(update.effective_user.id)
    
    # Agar contact ulashilsa
    if update.message.contact:
        phone_input = update.message.contact.phone_number
        logger.info(f"📱 Contact ulashildi: {phone_input}")
    else:
        # Agar text yuborilinsa
        phone_input = update.message.text.strip()
        logger.info(f"📱 Telefon qidirish: {phone_input}")
    
    try:
        normalized_input = normalize_phone(phone_input)
        logger.info(f"📱 Normalized: {normalized_input}")
        
        if not normalized_input or len(normalized_input) < 9:
            await update.message.reply_text("❌ Telefon raqami noto'g'ri. Qayta kiriting.")
            return WAITING_FOR_PHONE
        
        # Get all customers
        logger.info(f"🔍 API qidirish: {API_URL}/customers/public/all")
        response = requests.get(f'{API_URL}/customers/public/all', timeout=15)
        logger.info(f"📊 Status: {response.status_code}")
        
        if response.status_code != 200:
            await update.message.reply_text("❌ API bilan bog'lanishda xato.")
            return WAITING_FOR_PHONE
        
        data = response.json()
        customers = data.get('data', []) if isinstance(data, dict) else data
        
        if not isinstance(customers, list):
            customers = []
        
        logger.info(f"📋 Jami mijozlar: {len(customers)}")
        
        # Search customer
        customer = None
        for cust in customers:
            cust_phone = cust.get('phone', '')
            normalized_cust = normalize_phone(cust_phone)
            logger.info(f"🔎 Tekshirish: {normalized_cust} == {normalized_input}")
            
            if normalized_cust == normalized_input:
                customer = cust
                logger.info(f"✅ Topildi: {cust.get('name')}")
                break
        
        if not customer:
            await update.message.reply_text("❌ Mijoz topilmadi. Qayta kiriting:")
            return WAITING_FOR_PHONE
        
        # Store customer info
        customer_id = customer.get('_id')
        customer_name = customer.get('name', 'Noma\'lum')
        context.user_data['customer_id'] = customer_id
        context.user_data['customer_name'] = customer_name
        
        # Store telegram ID for this customer
        user_telegram_ids[customer_id] = telegram_id
        logger.info(f"💾 Telegram ID saqlandi: {customer_id} -> {telegram_id}")
        
        # Update customer in database with telegram ID
        try:
            update_response = requests.put(
                f'{API_URL}/customers/public/{customer_id}/telegram',
                json={'telegramUserId': telegram_id},
                timeout=10
            )
            if update_response.status_code == 200:
                logger.info(f"✅ Telegram ID bazaga saqlandi: {telegram_id}")
            else:
                logger.warning(f"⚠️ Telegram ID bazaga saqlanmadi: {update_response.status_code}")
        except Exception as e:
            logger.error(f"❌ Telegram ID saqlanishda xato: {e}")
        
        # Show customer info
        name = customer.get('name', 'Noma\'lum')
        phone = customer.get('phone', 'Noma\'lum')
        address = customer.get('address', 'Kiritilmagan')
        debt = customer.get('debt', 0)
        total_purchase = customer.get('totalPurchase', 0)
        
        # Remove keyboard
        from telegram import ReplyKeyboardRemove
        
        message = f"""
📋 MIJOZ MA'LUMOTLARI
{'='*50}

👤 Hurmatli {name}!
📱 Telefon: {phone}
📍 Manzil: {address}

💰 QARZ VA SAVDO
{'='*50}

💵 Jami Qarz: ${debt:.2f}
🛍️ Jami Savdolar: ${total_purchase:.2f}

✅ Muvaffaqiyatli ro'yxatga oldingiz!
        """
        
        await update.message.reply_text(message, reply_markup=ReplyKeyboardRemove())
        
        # Show menu
        await show_main_menu(update, context)
        
        return WAITING_FOR_PHONE
        
    except Exception as e:
        logger.error(f"❌ Xato: {e}")
        await update.message.reply_text(f"❌ Xato: {str(e)}")
        return WAITING_FOR_PHONE

async def last_sale_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Show last sale"""
    logger.info("📦 Oxirgi Savdo buyrug'i")
    
    customer_id = context.user_data.get('customer_id')
    customer_name = context.user_data.get('customer_name')
    logger.info(f"📦 Customer ID: {customer_id}, Name: {customer_name}")
    
    if not customer_id:
        await update.message.reply_text("❌ Avval /start bosing va telefon raqamingizni kiriting.")
        return
    
    try:
        # Get sales
        logger.info(f"🔍 Savdolar qidirish")
        sales_response = requests.get(f'{API_URL}/sales/public/all', timeout=15)
        logger.info(f"📊 Sales status: {sales_response.status_code}")
        
        customer_sales = []
        if sales_response.status_code == 200:
            sales_data = sales_response.json()
            all_sales = sales_data.get('data', []) if isinstance(sales_data, dict) else sales_data
            
            if isinstance(all_sales, list):
                for sale in all_sales:
                    sale_customer = sale.get('customer')
                    if isinstance(sale_customer, dict):
                        if sale_customer.get('_id') == customer_id:
                            customer_sales.append(sale)
                    elif isinstance(sale_customer, str):
                        if sale_customer == customer_id:
                            customer_sales.append(sale)
        
        if not customer_sales:
            await update.message.reply_text("❌ Savdolar topilmadi")
            return
        
        # Get last sale
        last_sale = customer_sales[-1]
        
        try:
            sale_date = datetime.fromisoformat(
                last_sale.get('createdAt', '').replace('Z', '+00:00')
            ).strftime('%d.%m.%Y %H:%M')
        except:
            sale_date = 'Noma\'lum'
        
        # Build message
        message = f"""
📦 OXIRGI SAVDO
{'='*50}

👤 Mijoz: {customer_name}
📅 Sana: {sale_date}

📋 MAHSULOTLAR:
"""
        
        for item in last_sale.get('items', []):
            qty = item.get('quantity', 0)
            product = item.get('product', {})
            if isinstance(product, dict):
                name_prod = product.get('name', 'Mahsulot')
            else:
                name_prod = 'Mahsulot'
            price = item.get('price', 0)
            total = item.get('total', 0)
            message += f"\n• {name_prod} x{qty} = ${total:.2f}"
        
        total_amount = float(last_sale.get('totalAmount', 0))
        paid_amount = float(last_sale.get('paidAmount', 0))
        sale_debt = max(0, total_amount - paid_amount)
        
        message += f"""

{'='*50}

💰 Jami: ${total_amount:.2f}
✅ To'langan: ${paid_amount:.2f}
💳 Qarz: ${sale_debt:.2f}

Rahmat! 🙏
        """
        
        logger.info(f"✅ Oxirgi savdo yuborildi")
        await update.message.reply_text(message)
        
    except requests.exceptions.Timeout:
        logger.error(f"❌ Timeout xatosi")
        await update.message.reply_text("❌ API javob bermayapti. Qayta urinib ko'ring.")
    except requests.exceptions.ConnectionError:
        logger.error(f"❌ Connection xatosi")
        await update.message.reply_text("❌ Backend bilan bog'lanishda xato.")
    except Exception as e:
        logger.error(f"❌ Oxirgi savdo xatosi: {e}")
        await update.message.reply_text(f"❌ Xato: {str(e)[:100]}")

async def handle_menu_buttons(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle menu button clicks"""
    text = update.message.text
    logger.info(f"🔘 Message received: {text}")
    
    # Check if it's a menu button
    if text == "📋 Qarzlar":
        logger.info(f"� Qarzlar button clicked")
        await debts_command(update, context)
    elif text == "📦 Oxirgi Savdo":
        logger.info(f"🔘 Oxirgi Savdo button clicked")
        await last_sale_command(update, context)
    else:
        # Treat as phone number input
        logger.info(f"🔘 Treating as phone number: {text}")
        await get_customer_info(update, context)
    
    return WAITING_FOR_PHONE

async def balance_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Show balance"""
    logger.info("📊 /balans buyrug'i")
    
    customer_id = context.user_data.get('customer_id')
    logger.info(f"📊 Customer ID: {customer_id}")
    
    if not customer_id:
        await update.message.reply_text("❌ Avval /start bosing va telefon raqamingizni kiriting.")
        return
    
    try:
        # Get customer
        logger.info(f"🔍 Mijoz qidirish: {customer_id}")
        cust_response = requests.get(f'{API_URL}/customers/public/{customer_id}', timeout=15)
        logger.info(f"📊 Customer status: {cust_response.status_code}")
        
        if cust_response.status_code != 200:
            await update.message.reply_text("❌ Mijoz ma'lumotlarini yuklashda xato.")
            return
        
        cust_data = cust_response.json()
        customer = cust_data.get('data', {}) if isinstance(cust_data, dict) else cust_data
        
        name = customer.get('name', 'Noma\'lum')
        phone = customer.get('phone', 'Noma\'lum')
        debt = float(customer.get('debt', 0))
        total_purchase = float(customer.get('totalPurchase', 0))
        
        logger.info(f"📊 Customer data: debt={debt}, totalPurchase={total_purchase}")
        
        # Get sales
        logger.info(f"🔍 Savdolar qidirish")
        sales_response = requests.get(f'{API_URL}/sales/public/all', timeout=15)
        logger.info(f"📊 Sales status: {sales_response.status_code}")
        
        customer_sales = []
        if sales_response.status_code == 200:
            sales_data = sales_response.json()
            all_sales = sales_data.get('data', []) if isinstance(sales_data, dict) else sales_data
            
            if isinstance(all_sales, list):
                for sale in all_sales:
                    sale_customer = sale.get('customer')
                    if isinstance(sale_customer, dict):
                        if sale_customer.get('_id') == customer_id:
                            customer_sales.append(sale)
                    elif isinstance(sale_customer, str):
                        if sale_customer == customer_id:
                            customer_sales.append(sale)
        
        # Calculate total items
        total_items = 0
        for sale in customer_sales:
            for item in sale.get('items', []):
                total_items += item.get('quantity', 0)
        
        # Build message
        message = f"""
💰 BALANS MA'LUMOTLARI
{'='*50}

👤 Hurmatli {name}!
📱 Telefon: {phone}

📊 QARZ VA SAVDO
{'='*50}

💵 Jami Qarz: ${debt:.2f}
🛍️ Jami Savdolar: ${total_purchase:.2f}
📦 Jami Mahsulot: {total_items} ta
📜 Savdo Soni: {len(customer_sales)} ta
        """
        
        # Add recent sales
        if customer_sales:
            message += "\n\n📜 SO'NGGI SAVDOLAR:\n"
            for i, sale in enumerate(customer_sales[-3:], 1):
                try:
                    sale_date = datetime.fromisoformat(
                        sale.get('createdAt', '').replace('Z', '+00:00')
                    ).strftime('%d.%m.%Y %H:%M')
                except:
                    sale_date = 'Noma\'lum'
                
                items_list = []
                for item in sale.get('items', []):
                    qty = item.get('quantity', 0)
                    product = item.get('product', {})
                    if isinstance(product, dict):
                        name_prod = product.get('name', 'Mahsulot')
                    else:
                        name_prod = 'Mahsulot'
                    items_list.append(f"{name_prod} x{qty}")
                
                items_text = ", ".join(items_list) if items_list else "Noma\'lum"
                total_amount = sale.get('totalAmount', 0)
                paid_amount = sale.get('paidAmount', 0)
                
                message += f"\n{i}. 📅 {sale_date}\n"
                message += f"   📦 {items_text}\n"
                message += f"   💰 Jami: ${total_amount:.2f}\n"
                message += f"   ✅ To'langan: ${paid_amount:.2f}\n"
        
        logger.info(f"✅ Balans yuborildi")
        await update.message.reply_text(message)
        
    except requests.exceptions.Timeout:
        logger.error(f"❌ Timeout xatosi")
        await update.message.reply_text("❌ API javob bermayapti. Qayta urinib ko'ring.")
    except requests.exceptions.ConnectionError:
        logger.error(f"❌ Connection xatosi")
        await update.message.reply_text("❌ Backend bilan bog'lanishda xato. Backend ishga tushganligini tekshiring.")
    except Exception as e:
        logger.error(f"❌ Balans xatosi: {e}")
        await update.message.reply_text(f"❌ Xato: {str(e)[:100]}")

async def debts_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Show debts and purchases"""
    logger.info("💳 /qarzlar buyrug'i")
    
    customer_id = context.user_data.get('customer_id')
    customer_name = context.user_data.get('customer_name')
    logger.info(f"💳 Customer ID: {customer_id}, Name: {customer_name}")
    
    if not customer_id:
        await update.message.reply_text("❌ Avval /start bosing va telefon raqamingizni kiriting.")
        return
    
    try:
        # Get customer
        logger.info(f"🔍 Mijoz qidirish: {customer_id}")
        cust_response = requests.get(f'{API_URL}/customers/public/{customer_id}', timeout=15)
        logger.info(f"📊 Customer status: {cust_response.status_code}")
        
        if cust_response.status_code != 200:
            await update.message.reply_text("❌ Mijoz ma'lumotlarini yuklashda xato.")
            return
        
        cust_data = cust_response.json()
        customer = cust_data.get('data', {}) if isinstance(cust_data, dict) else cust_data
        
        name = customer.get('name', 'Noma\'lum')
        phone = customer.get('phone', 'Noma\'lum')
        debt = float(customer.get('debt', 0))
        total_purchase = float(customer.get('totalPurchase', 0))
        
        logger.info(f"💳 Customer data: debt={debt}, totalPurchase={total_purchase}")
        
        # Get sales
        logger.info(f"🔍 Savdolar qidirish")
        sales_response = requests.get(f'{API_URL}/sales/public/all', timeout=15)
        logger.info(f"📊 Sales status: {sales_response.status_code}")
        
        customer_sales = []
        if sales_response.status_code == 200:
            sales_data = sales_response.json()
            all_sales = sales_data.get('data', []) if isinstance(sales_data, dict) else sales_data
            
            if isinstance(all_sales, list):
                for sale in all_sales:
                    sale_customer = sale.get('customer')
                    if isinstance(sale_customer, dict):
                        if sale_customer.get('_id') == customer_id:
                            customer_sales.append(sale)
                    elif isinstance(sale_customer, str):
                        if sale_customer == customer_id:
                            customer_sales.append(sale)
        
        # Build message
        message = f"""
💳 QARZLAR VA SAVDOLAR
{'='*50}

👤 Hurmatli {name}!
📱 Telefon: {phone}

📊 UMUMIY MA'LUMOTLAR
{'='*50}

💵 Jami Qarz: ${debt:.2f}
🛍️ Jami Savdolar: ${total_purchase:.2f}
📜 Savdo Soni: {len(customer_sales)} ta

{'='*50}
📋 BARCHA SAVDOLAR RO'YXATI
{'='*50}
"""
        
        if customer_sales:
            for i, sale in enumerate(customer_sales, 1):
                try:
                    sale_date = datetime.fromisoformat(
                        sale.get('createdAt', '').replace('Z', '+00:00')
                    ).strftime('%d.%m.%Y %H:%M')
                except:
                    sale_date = 'Noma\'lum'
                
                items_list = []
                for item in sale.get('items', []):
                    qty = item.get('quantity', 0)
                    product = item.get('product', {})
                    if isinstance(product, dict):
                        name_prod = product.get('name', 'Mahsulot')
                    else:
                        name_prod = 'Mahsulot'
                    items_list.append(f"{name_prod} x{qty}")
                
                items_text = ", ".join(items_list) if items_list else "Noma\'lum"
                total_amount = float(sale.get('totalAmount', 0))
                paid_amount = float(sale.get('paidAmount', 0))
                sale_debt = max(0, total_amount - paid_amount)
                
                message += f"\n{i}. 📅 {sale_date}\n"
                message += f"   📦 Mahsulotlar: {items_text}\n"
                message += f"   💰 Jami: ${total_amount:.2f}\n"
                message += f"   ✅ To'langan: ${paid_amount:.2f}\n"
                message += f"   💳 Qarz: ${sale_debt:.2f}\n"
        else:
            message += "\n❌ Savdolar topilmadi"
        
        logger.info(f"✅ Qarzlar yuborildi")
        await update.message.reply_text(message)
        
    except requests.exceptions.Timeout:
        logger.error(f"❌ Timeout xatosi")
        await update.message.reply_text("❌ API javob bermayapti. Qayta urinib ko'ring.")
    except requests.exceptions.ConnectionError:
        logger.error(f"❌ Connection xatosi")
        await update.message.reply_text("❌ Backend bilan bog'lanishda xato. Backend ishga tushganligini tekshiring.")
    except Exception as e:
        logger.error(f"❌ Qarzlar xatosi: {e}")
        await update.message.reply_text(f"❌ Xato: {str(e)[:100]}")

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Help"""
    await update.message.reply_text("""
🤖 BOT BUYRUQLARI:

/start - Botni boshlash
/balans - Balansni ko'rish
/qarzlar - Qarzlar va savdolarni ko'rish
/help - Yordam
/cancel - Bekor qilish

📝 FOYDALANISH:
1. /start bosing
2. Telefon raqamingizni kiriting
3. /qarzlar bosing qarzlarni ko'rish uchun
    """)

async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Cancel"""
    await update.message.reply_text("Bekor qilindi. /start bosing qayta boshlash uchun.")
    return ConversationHandler.END

# Flask webhook endpoints
@flask_app.route('/webhook/sale', methods=['POST'])
def webhook_sale():
    """Webhook for new sales"""
    try:
        data = request.json
        logger.info(f"📨 Webhook sale qabul qilindi: {data}")
        
        customer_id = data.get('customer_id')
        customer_name = data.get('customer_name')
        items = data.get('items', [])
        total_amount = data.get('total_amount', 0)
        paid_amount = data.get('paid_amount', 0)
        
        logger.info(f"📨 Customer ID: {customer_id}, Name: {customer_name}")
        logger.info(f"📨 Items: {len(items)}, Total: {total_amount}, Paid: {paid_amount}")
        
        # Get telegram ID for this customer
        telegram_id = user_telegram_ids.get(customer_id)
        logger.info(f"📨 Telegram ID from memory: {telegram_id}")
        
        if not telegram_id:
            logger.warning(f"⚠️ Telegram ID topilmadi memory-da: {customer_id}")
            # Try to get from database
            try:
                response = requests.get(f'{API_URL}/customers/public/{customer_id}', timeout=10)
                if response.status_code == 200:
                    customer_data = response.json()
                    customer = customer_data.get('data', {}) if isinstance(customer_data, dict) else customer_data
                    telegram_id = customer.get('telegramUserId')
                    logger.info(f"📨 Telegram ID from database: {telegram_id}")
                    
                    if telegram_id:
                        user_telegram_ids[customer_id] = telegram_id
            except Exception as e:
                logger.error(f"❌ Database qidirish xatosi: {e}")
            
            if not telegram_id:
                logger.warning(f"⚠️ Telegram ID topilmadi: {customer_id}")
                return jsonify({'success': False, 'error': 'Telegram ID not found'}), 404
        
        # Build receipt message
        receipt = f"""
📋 SAVDO CHEKI
{'='*50}

� Mijoz: {customer_name}

📦 MAHSULOTLAR:
"""
        
        for item in items:
            product_name = item.get('product_name', 'Mahsulot')
            quantity = item.get('quantity', 0)
            price = item.get('price', 0)
            total = item.get('total', 0)
            receipt += f"\n{product_name} x{quantity} = ${total:.2f}"
        
        receipt += f"""

{'='*50}

💰 JAMI: ${total_amount:.2f}
✅ TO'LANGAN: ${paid_amount:.2f}
💵 QARZ: ${max(0, total_amount - paid_amount):.2f}

Rahmat, yana kelishingizni kutamiz! 🙏
        """
        
        # Send message to customer via bot
        if bot_app:
            try:
                # Use asyncio to run async function
                import asyncio
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                loop.run_until_complete(bot_app.bot.send_message(chat_id=telegram_id, text=receipt))
                loop.close()
                logger.info(f"✅ Chek yuborildi: {telegram_id}")
                return jsonify({'success': True, 'message': 'Receipt sent'}), 200
            except Exception as e:
                logger.error(f"❌ Chek yuborishda xato: {e}")
                return jsonify({'success': False, 'error': str(e)}), 500
        else:
            logger.error("❌ Bot app ishga tushmagan")
            return jsonify({'success': False, 'error': 'Bot not initialized'}), 500
            
    except Exception as e:
        logger.error(f"❌ Webhook xatosi: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@flask_app.route('/webhook/health', methods=['GET'])
def webhook_health():
    """Health check"""
    return jsonify({'status': 'OK', 'bot_running': bot_app is not None}), 200

def run_flask():
    """Run Flask app in separate thread"""
    logger.info("🌐 Flask webhook server ishga tushmoqda...")
    flask_app.run(host='0.0.0.0', port=5002, debug=False)

def main() -> None:
    """Start bot"""
    global bot_app
    
    if not BOT_TOKEN:
        print("❌ Bot token topilmadi!")
        return
    
    print("🤖 Bot ishga tushmoqda...")
    print(f"🔗 API URL: {API_URL}")
    print(f"🔑 Token: {BOT_TOKEN[:20]}...")
    
    try:
        application = Application.builder().token(BOT_TOKEN).build()
        bot_app = application
    except Exception as e:
        print(f"❌ Bot initialization xatosi: {e}")
        print("💡 Telegram bot library bilan muammo. Qayta o'rnatib ko'ring:")
        print("pip install --upgrade python-telegram-bot")
        return
    
    # Conversation handler
    conv_handler = ConversationHandler(
        entry_points=[CommandHandler('start', start)],
        states={
            WAITING_FOR_PHONE: [
                CommandHandler('start', start),
                CommandHandler('balans', balance_command),
                CommandHandler('qarzlar', debts_command),
                CommandHandler('help', help_command),
                CommandHandler('cancel', cancel),
                MessageHandler(filters.CONTACT, get_customer_info),  # Contact button
                MessageHandler(filters.TEXT & ~filters.COMMAND, handle_menu_buttons)  # Menu buttons or text input
            ]
        },
        fallbacks=[CommandHandler('cancel', cancel)]
    )
    
    application.add_handler(conv_handler)
    application.add_handler(CommandHandler('help', help_command))
    application.add_handler(CommandHandler('balans', balance_command))
    application.add_handler(CommandHandler('qarzlar', debts_command))
    
    # Add error handler
    async def error_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Log the error and send a telegram message to notify the developer."""
        logger.error(msg="Exception while handling an update:", exc_info=context.error)
        logger.error(f"❌ Update: {update}")
        logger.error(f"❌ Error: {context.error}")
    
    application.add_error_handler(error_handler)
    
    # Start Flask webhook server in separate thread
    flask_thread = threading.Thread(target=run_flask, daemon=True)
    flask_thread.start()
    
    print("✅ Bot muvaffaqiyatli ishga tushdi!")
    print("🌐 Webhook server: http://localhost:5002/webhook/sale")
    print("⏳ Bot polling rejimida ishga tushmoqda...")
    
    try:
        application.run_polling(allowed_updates=Update.ALL_TYPES)
    except Exception as e:
        print(f"❌ Bot xatosi: {e}")
        print("💡 Token to'g'ri ekanligini tekshiring!")
        print("💡 @BotFather dan yangi token oling va .env fayliga qo'ying")

if __name__ == '__main__':
    main()
