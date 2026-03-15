'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import CashierLayout from '@/components/layouts/CashierLayout'
import { getProducts, getCustomer, createSale } from '@/lib/api'
import { ShoppingCart, Plus, Trash2, Search, X, Check, ArrowLeft } from 'lucide-react'

interface Product {
  _id: string
  name: string
  category: string
  sellPrice: number
  buyPrice: number
  discountPrice?: number
  stock: number
  barcode?: string
  imei?: string
  imeiList?: Array<{ imei: string; used: boolean }>
}

interface Customer {
  _id: string
  name: string
  phone: string
  debt?: number
}

interface SaleItem {
  id: string
  productId: string
  productName: string
  imei: string
  buyPrice: number
  originalPrice: number
  salePrice: number
  quantity: number
  imeiCount: number
}

interface PaymentMethod {
  type: 'cash' | 'click' | 'terminal'
  amount: number
}

interface PaymentState {
  [key: string]: number
}

function SalePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const customerId = searchParams.get('customerId')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [products, setProducts] = useState<Product[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const [cart, setCart] = useState<SaleItem[]>([])
  const [showPayment, setShowPayment] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [notes, setNotes] = useState('')
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editingPrice, setEditingPrice] = useState(0)
  const [currency, setCurrency] = useState<'USD' | 'UZS'>('USD')
  const [exchangeRate, setExchangeRate] = useState(12500)
  const [paymentState, setPaymentState] = useState<PaymentState>({})

  const fetchExchangeRate = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'
      const response = await fetch(`${apiUrl}/exchange-rate/current`)
      const data = await response.json()
      
      if (data.success && data.data) {
        setExchangeRate(data.data.rate)
        console.log('✅ Exchange rate updated:', data.data.rate)
      }
    } catch (err) {
      console.error('Exchange rate fetch error:', err)
    }
  }

  const convertPrice = (priceInUsd: number): number => {
    if (currency === 'USD') return priceInUsd
    return priceInUsd * exchangeRate
  }

  const formatPrice = (price: number): string => {
    if (currency === 'USD') return `${price.toFixed(2)}`
    return `${Math.floor(price).toLocaleString('uz-UZ')} so'm`
  }

  const filteredProducts = products.filter(p => {
    if (!searchTerm.trim()) return false
    const searchLower = searchTerm.toLowerCase()
    
    // Search by name OR IMEI
    const nameMatch = p.name.toLowerCase().includes(searchLower)
    
    // Search by IMEI in imeiList (only available ones)
    const imeiMatch = p.imeiList && p.imeiList.some(item => item.imei.toLowerCase().includes(searchLower) && !item.used)
    
    return nameMatch || imeiMatch
  })

  const totalAmount = cart.reduce((sum, item) => sum + (item.salePrice * item.quantity), 0)
  const totalPaid = paymentMethods.reduce((sum, method) => sum + method.amount, 0)
  const finalDebt = Math.max(0, totalAmount - totalPaid)

  const handleAddToCart = (product: Product, imei?: string, quantity: number = 1) => {
    if (!imei && (!product.imeiList || product.imeiList.length === 0)) {
      setError('Bu mahsulotning IMEKasi yo\'q')
      return
    }

    const availableImei = imei || (product.imeiList?.find(item => !item.used)?.imei)
    if (!availableImei) {
      setError('Bu mahsulotning bo\'sh IMEKasi yo\'q')
      return
    }

    // Check if same product with same IMEI already exists in cart
    const existingItem = cart.find(item => item.productId === product._id && item.imei === availableImei)
    
    if (existingItem) {
      // Update quantity instead of adding new item
      setCart(cart.map(item =>
        item.id === existingItem.id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ))
    } else {
      // Add new item
      setCart([...cart, {
        id: Math.random().toString(),
        productId: product._id,
        productName: product.name,
        imei: availableImei,
        buyPrice: product.buyPrice,
        originalPrice: product.sellPrice,
        salePrice: product.sellPrice,
        quantity: quantity,
        imeiCount: quantity
      }])
    }
    setSearchTerm('')
    setError(null)
  }

  const handleRemoveFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId))
  }

  const handleUpdatePrice = (itemId: string, newPrice: number) => {
    const item = cart.find(i => i.id === itemId)
    if (!item) return

    // Validation: tushib berish narxi olish narxidan kam bo'lmasligi kerak
    if (newPrice < item.buyPrice) {
      setError(`Tushib berish narxi olish narxidan (${item.buyPrice}$) kam bo'lmasligi kerak`)
      return
    }

    setCart(cart.map(i =>
      i.id === itemId
        ? { ...i, salePrice: newPrice }
        : i
    ))
    setEditingItemId(null)
    setError(null)
  }

  const handleAddPaymentMethod = (type: 'cash' | 'click' | 'terminal') => {
    if (paymentMethods.length >= 2) {
      setError('Maksimum 2 ta tolov turi tanlash mumkin')
      return
    }

    if (paymentMethods.some(m => m.type === type)) {
      setError('Bu tolov turi allaqachon tanlangan')
      return
    }

    setPaymentMethods([...paymentMethods, { type, amount: 0 }])
  }

  const handleRemovePaymentMethod = (index: number) => {
    setPaymentMethods(paymentMethods.filter((_, i) => i !== index))
  }

  const handleUpdatePaymentAmount = (index: number, amount: number) => {
    const updated = [...paymentMethods]
    updated[index].amount = amount
    setPaymentMethods(updated)
  }

  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      setError('Savatcha bo\'sh')
      return
    }

    if (paymentMethods.length === 0) {
      setError('Tolov turini tanlang')
      return
    }

    if (totalPaid < totalAmount) {
      setError('To\'lov miqdori yetarli emas')
      return
    }

    setIsSubmitting(true)
    setError(null)

    const saleData = {
      branch: localStorage.getItem('branchId') || '507f1f77bcf86cd799439011',
      customer: selectedCustomer?._id || null,
      items: cart.map(item => ({
        product: item.productId,
        quantity: item.quantity,
        price: item.salePrice,
        originalPrice: item.originalPrice,
        salePrice: item.salePrice,
        imei: item.imei,
        total: item.salePrice * item.quantity
      })),
      totalAmount,
      paidAmount: totalPaid,
      change: Math.max(0, totalPaid - totalAmount),
      currency: 'USD',
      paymentMethods,
      notes
    }

    const response = await createSale(saleData)

    if (response.success) {
      setSuccess('Savdo muvaffaqiyatli yakunlandi!')
      setCart([])
      setPaymentMethods([])
      setNotes('')
      setShowPayment(false)
      setTimeout(() => {
        setSuccess(null)
        router.push('/cashier/history')
      }, 2000)
    } else {
      setError(response.error || 'Savdo yakunlanishda xato')
    }

    setIsSubmitting(false)
  }

  useEffect(() => {
    const fetchData = async () => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('cashierToken')
        if (!token) {
          router.push('/cashier/login')
          return
        }

        const branchId = localStorage.getItem('branchId')
        const productsRes = await getProducts()

        if (productsRes.success && productsRes.data) {
          const filteredByBranch = branchId 
            ? (productsRes.data as Product[]).filter(p => (p as any).branch === branchId)
            : productsRes.data as Product[]
          
          setProducts(filteredByBranch)
        }

        if (customerId) {
          const customerRes = await getCustomer(customerId)
          if (customerRes.success && customerRes.data) {
            setSelectedCustomer(customerRes.data as Customer)
          }
        }

        // Fetch exchange rate
        fetchExchangeRate()
      }
    }

    fetchData()
  }, [router, customerId])

  return (
    <CashierLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white/10 rounded-lg transition"
            >
              <ArrowLeft size={24} className="text-teal-400" />
            </button>
            <div>
              <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-cyan-400">Savdo</h1>
              {selectedCustomer && (
                <p className="text-gray-400 mt-1">{selectedCustomer.name} uchun savdo</p>
              )}
            </div>
          </div>

          {/* Error & Success Messages */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 backdrop-blur-sm flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="p-1 hover:bg-red-500/20 rounded">
                <X size={20} />
              </button>
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-green-400 backdrop-blur-sm flex items-center gap-2">
              <Check size={20} />
              <span>{success}</span>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-4 w-5 h-5 text-teal-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Mahsulot nomi, IMEKA yoki barkodini kiriting..."
              className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent backdrop-blur-sm text-white placeholder-gray-400 transition-all"
            />
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-2">
            {filteredProducts.length === 0 ? (
              <div className="col-span-2 text-center py-8 text-gray-400">
                {searchTerm ? 'Mahsulot topilmadi' : 'Qidirish uchun IMEKA kiriting'}
              </div>
            ) : (
              filteredProducts.map(product => {
                if (!product.imeiList || product.imeiList.length === 0) {
                  return null
                }
                
                const searchLower = searchTerm.toLowerCase()
                
                // Count available IMEIs (regardless of value)
                const availableCount = product.imeiList.filter(item => !item.used).length
                
                // Get first available IMEI to display
                const firstAvailableImei = product.imeiList.find(item => !item.used)?.imei || ''
                
                // Check if search matches this product
                const nameMatch = product.name.toLowerCase().includes(searchLower)
                const imeiMatch = firstAvailableImei.toLowerCase().includes(searchLower)
                
                if (!nameMatch && !imeiMatch) {
                  return null
                }
                
                return (
                  <div
                    key={product._id}
                    className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-xl p-4 hover:border-teal-500/50 hover:shadow-lg hover:shadow-teal-500/20 transition-all duration-300 group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-white group-hover:text-teal-300 transition-colors line-clamp-2">
                          {product.name}
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">{product.category}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {/* Prices */}
                      <div className="bg-white/5 rounded p-2 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Olish:</span>
                          <span className="text-yellow-400 font-semibold">${product.buyPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Sotish:</span>
                          <span className="text-green-400 font-semibold">${product.sellPrice.toFixed(2)}</span>
                        </div>
                      </div>
                      
                      <div className="bg-white/5 rounded p-2">
                        <p className="text-xs text-gray-400 mb-1">IMEKA:</p>
                        <p className="text-sm font-mono text-teal-300 break-all">{firstAvailableImei}</p>
                      </div>

                      {/* Available Count */}
                      <div className="bg-cyan-500/20 border border-cyan-500/30 rounded p-2 text-center">
                        <p className="text-xs text-cyan-300">Mavjud: <span className="font-bold">{availableCount} ta</span></p>
                      </div>

                      {/* Quantity Input */}
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="1"
                          max={availableCount}
                          defaultValue="1"
                          id={`qty-${product._id}`}
                          className="flex-1 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                          placeholder="Miqdor"
                          onChange={(e) => {
                            const inputValue = e.target.value
                            let value = parseInt(inputValue)
                            if (!isNaN(value) && value > availableCount) {
                              e.target.value = availableCount.toString()
                            }
                          }}
                          onBlur={(e) => {
                            let value = parseInt(e.target.value)
                            if (isNaN(value) || value < 1) {
                              value = 1
                            } else if (value > availableCount) {
                              value = availableCount
                            }
                            e.target.value = value.toString()
                          }}
                        />
                        <button
                          onClick={() => {
                            const qtyInput = document.getElementById(`qty-${product._id}`) as HTMLInputElement
                            const qty = parseInt(qtyInput?.value || '1') || 1
                            if (qty > availableCount) {
                              setError(`Maksimum ${availableCount} ta mavjud`)
                              return
                            }
                            handleAddToCart(product, firstAvailableImei, qty)
                          }}
                          className="px-3 py-1 bg-teal-600 hover:bg-teal-700 rounded text-white text-sm font-semibold transition"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Cart Section */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl p-6 backdrop-blur-sm sticky top-24 space-y-6 max-h-[calc(100vh-120px)] overflow-y-auto">
            {/* Cart Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-cyan-400 rounded-lg flex items-center justify-center">
                <ShoppingCart size={20} className="text-slate-900" />
              </div>
              <div>
                <h2 className="font-bold text-white">Savatcha</h2>
                <p className="text-sm text-gray-400">{cart.length} mahsulot</p>
              </div>
            </div>

            {/* Cart Items */}
            <div className="space-y-3">
              {cart.length === 0 ? (
                <p className="text-center text-gray-400 py-8">Savatcha bo\'sh</p>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold text-white text-sm line-clamp-2">{item.productName}</p>
                        <p className="text-xs text-gray-400 mt-1">IMEKA: {item.imei}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveFromCart(item.id)}
                        className="p-1 hover:bg-red-500/20 rounded transition"
                      >
                        <Trash2 size={16} className="text-red-400" />
                      </button>
                    </div>

                    {/* Price Info */}
                    <div className="bg-white/5 rounded p-2 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Olish:</span>
                        <span className="text-yellow-400 font-semibold">
                          {currency === 'UZS' ? `${Math.floor(item.buyPrice * exchangeRate).toLocaleString('uz-UZ')} so'm` : `$${item.buyPrice.toFixed(2)}`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Sotish:</span>
                        <span className="text-green-400 font-semibold">
                          {currency === 'UZS' ? `${Math.floor(item.originalPrice * exchangeRate).toLocaleString('uz-UZ')} so'm` : `$${item.originalPrice.toFixed(2)}`}
                        </span>
                      </div>
                    </div>

                    {/* Quantity */}
                    <div className="flex items-center gap-2 bg-white/5 rounded p-2">
                      <span className="text-xs text-gray-400">Miqdor:</span>
                      <input
                        type="number"
                        min="1"
                        max={item.imeiCount}
                        defaultValue={item.quantity}
                        id={`qty-cart-${item.id}`}
                        onChange={(e) => {
                          let value = parseInt(e.target.value)
                          if (isNaN(value) || value < 1) {
                            value = 1
                            e.target.value = '1'
                          } else if (value > item.imeiCount) {
                            value = item.imeiCount
                            e.target.value = item.imeiCount.toString()
                          }
                          setCart(cart.map(i =>
                            i.id === item.id
                              ? { ...i, quantity: value }
                              : i
                          ))
                        }}
                        className="flex-1 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder="Miqdor"
                      />
                      <span className="text-xs text-gray-400">/ {item.imeiCount}</span>
                    </div>

                    {/* Sale Price */}
                    {editingItemId === item.id ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={editingPrice}
                          onChange={(e) => {
                            const value = e.target.value
                            if (value === '' || /^\d*\.?\d*$/.test(value)) {
                              setEditingPrice(value === '' ? 0 : parseFloat(value))
                            }
                          }}
                          className="flex-1 bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                          placeholder="0.00"
                        />
                        <button
                          onClick={() => handleUpdatePrice(item.id, editingPrice)}
                          className="px-2 py-1 bg-green-500/20 hover:bg-green-500/40 rounded text-green-400 text-sm transition"
                        >
                          OK
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingItemId(item.id)
                          setEditingPrice(item.salePrice)
                        }}
                        className="w-full text-left px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-teal-300 text-sm transition"
                      >
                        Tushib berish: {currency === 'UZS' ? `${Math.floor(item.salePrice * exchangeRate).toLocaleString('uz-UZ')} so'm` : `$${item.salePrice.toFixed(2)}`}
                      </button>
                    )}

                    <div className="text-right">
                      <p className="font-bold text-teal-300">{currency === 'UZS' ? `${Math.floor(item.salePrice * item.quantity * exchangeRate).toLocaleString('uz-UZ')} so'm` : `$${(item.salePrice * item.quantity).toFixed(2)}`}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Divider */}
            {cart.length > 0 && <div className="border-t border-white/10"></div>}

            {/* Totals */}
            {cart.length > 0 && (
              <div className="space-y-3">
                <div className="flex justify-between text-gray-300">
                  <span>Jami:</span>
                  <span className="font-bold text-teal-300">${totalAmount.toFixed(2)}</span>
                </div>

                {!showPayment ? (
                  <button
                    onClick={() => setShowPayment(true)}
                    className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white py-3 rounded-lg hover:shadow-lg hover:shadow-teal-500/50 transition-all font-semibold"
                  >
                    To'lovga o'tish
                  </button>
                ) : (
                  <div className="space-y-3 bg-white/5 border border-white/10 rounded-lg p-4">
                    {/* Payment Methods */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-300">
                          Tolov Turlari (maksimum 2 ta)
                        </label>
                        {/* Currency Selector */}
                        <div className="flex gap-2 bg-white/10 border border-white/20 rounded-lg p-1">
                          <button
                            onClick={() => setCurrency('USD')}
                            className={`px-3 py-1 rounded-lg font-semibold transition-all text-sm ${
                              currency === 'USD'
                                ? 'bg-teal-600 text-white shadow-lg shadow-teal-500/50'
                                : 'text-gray-300 hover:text-white'
                            }`}
                          >
                            $
                          </button>
                          <button
                            onClick={() => setCurrency('UZS')}
                            className={`px-3 py-1 rounded-lg font-semibold transition-all text-sm ${
                              currency === 'UZS'
                                ? 'bg-teal-600 text-white shadow-lg shadow-teal-500/50'
                                : 'text-gray-300 hover:text-white'
                            }`}
                          >
                            So'm
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {['cash', 'click', 'terminal'].map(type => {
                          const isSelected = paymentMethods.some(m => m.type === type as any)
                          const typeText = type === 'cash' ? 'Naqd' : type === 'click' ? 'Click' : 'Terminal'
                          return (
                            <button
                              key={type}
                              onClick={() => {
                                if (isSelected) {
                                  handleRemovePaymentMethod(paymentMethods.findIndex(m => m.type === type as any))
                                } else {
                                  handleAddPaymentMethod(type as any)
                                }
                              }}
                              className={`py-2 px-3 rounded-lg font-semibold transition-all ${
                                isSelected
                                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-500/50 border border-teal-400'
                                  : 'bg-white/10 text-gray-300 border border-white/10 hover:bg-white/20'
                              }`}
                            >
                              {typeText}
                            </button>
                          )
                        })}
                      </div>

                      {/* Payment Amounts */}
                      <div className="space-y-2">
                        {paymentMethods.map((method, index) => {
                          const typeText = method.type === 'cash' ? 'Naqd' : method.type === 'click' ? 'Click' : 'Terminal'
                          const displayAmount = currency === 'UZS' ? (paymentState[`${method.type}_${index}`] || 0) : method.amount
                          return (
                            <div key={index} className="flex gap-2">
                              <label className="flex-1 text-sm text-gray-400 flex items-center">
                                {typeText}:
                              </label>
                              <input
                                type="text"
                                inputMode="decimal"
                                value={displayAmount}
                                onChange={(e) => {
                                  const value = e.target.value
                                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                    const numValue = value === '' ? 0 : parseFloat(value)
                                    setPaymentState({
                                      ...paymentState,
                                      [`${method.type}_${index}`]: numValue
                                    })
                                    const amountInUsd = currency === 'UZS' ? numValue / exchangeRate : numValue
                                    handleUpdatePaymentAmount(index, amountInUsd)
                                  }
                                }}
                                className="w-32 bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                                placeholder={currency === 'UZS' ? '0' : '0.00'}
                              />
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Debt Only */}
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-center">
                      <p className="text-gray-400 text-xs mb-1">❌ Qarz</p>
                      <p className="font-bold text-red-400 text-lg">{currency === 'UZS' ? `${Math.floor(Math.max(0, finalDebt) * exchangeRate).toLocaleString('uz-UZ')} so'm` : `${Math.max(0, finalDebt).toFixed(2)}`}</p>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Izoh (ixtiyoriy)
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                        rows={2}
                        placeholder="Izoh..."
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowPayment(false)}
                        className="flex-1 px-3 py-2 border border-white/20 rounded-lg hover:bg-white/10 transition-all text-gray-300 font-medium text-sm"
                      >
                        Bekor qilish
                      </button>
                      <button
                        onClick={handleCompleteSale}
                        disabled={isSubmitting || paymentMethods.length === 0}
                        className="flex-1 px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-lg hover:shadow-green-500/50 transition-all disabled:opacity-50 font-medium text-sm flex items-center justify-center gap-2"
                      >
                        <Check size={16} />
                        {isSubmitting ? 'Yakunlanmoqda...' : 'Yakunlash'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </CashierLayout>
  )
}

export default function SalePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SalePageContent />
    </Suspense>
  )
}
