'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import CashierLayout from '@/components/layouts/CashierLayout'
import { Plus, Trash2, Search, Package, Check, X, ArrowLeft } from 'lucide-react'
import { getProducts, createSale } from '@/lib/api'

interface Product {
  _id: string
  name: string
  buyPrice: number
  sellPrice: number
  stock: number
  imei?: string
  imeiList?: Array<{ imei: string; used: boolean }>
  branch?: string
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
  type: 'cash' | 'debt' | 'click' | 'terminal'
  amount: number
}

export default function StreetSalePage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [saleItems, setSaleItems] = useState<SaleItem[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editingPrice, setEditingPrice] = useState(0)
  const [currency, setCurrency] = useState<'USD' | 'UZS'>('USD')
  const [exchangeRate, setExchangeRate] = useState(12500)
  const [cartQuantities, setCartQuantities] = useState<{ [key: string]: number }>({}) // Default UZS to USD rate
  const [quantityInputs, setQuantityInputs] = useState<{ [key: string]: string }>({})

  const fetchProducts = async () => {
    setError(null)
    try {
      const branchId = localStorage.getItem('branchId')
      const params: Record<string, string> = {}
      
      if (branchId) {
        params.branch = branchId
      }
      
      const response = await getProducts(params)
      if (response.success && response.data) {
        const productList = Array.isArray(response.data) ? response.data : []
        setProducts(productList)
      } else {
        setError(response.error || 'Mahsulotlarni yuklashda xato')
      }
    } catch (err) {
      console.error('Fetch error:', err)
      setError('Ma\'lumotlarni yuklashda xato')
    }
  }

  const fetchExchangeRate = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'
      const response = await fetch(`${apiUrl}/exchange-rate/current`)
      const data = await response.json()
      
      if (data.success && data.data) {
        setExchangeRate(data.data.rate)
      }
    } catch (err) {
      console.error('Exchange rate fetch error:', err)
      // Keep default rate if fetch fails
    }
  }

  // Helper function to convert price based on currency
  const convertPrice = (priceInUsd: number): number => {
    if (currency === 'USD') return priceInUsd
    return priceInUsd * exchangeRate
  }

  // Helper function to format price with currency symbol
  const formatPrice = (price: number): string => {
    if (currency === 'USD') return `$${price.toFixed(2)}`
    return `${Math.floor(price).toLocaleString('uz-UZ')} so'm`
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('cashierToken')
      if (!token) {
        router.push('/')
      } else {
        fetchProducts()
        fetchExchangeRate()
      }
    }
  }, [router])

  const filteredProducts = products.filter(p => {
    if (!searchTerm.trim()) return false
    const searchLower = searchTerm.toLowerCase()
    
    // Search by name
    const nameMatch = p.name.toLowerCase().includes(searchLower)
    
    // Search by IMEI
    const imeiMatch = p.imeiList && p.imeiList.some((item: any) => 
      item.imei.toLowerCase().includes(searchLower) && !item.used
    )
    
    return nameMatch || imeiMatch
  })

  const totalAmount = saleItems.reduce((sum, item) => sum + (item.salePrice * item.quantity), 0)
  const totalPaid = paymentMethods.reduce((sum, method) => sum + method.amount, 0)
  const change = totalPaid - totalAmount
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
    const existingItem = saleItems.find(item => item.productId === product._id && item.imei === availableImei)
    
    if (existingItem) {
      // Update quantity instead of adding new item
      setSaleItems(saleItems.map(item =>
        item.id === existingItem.id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ))
    } else {
      // Add new item
      setSaleItems([...saleItems, {
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
    setSaleItems(saleItems.filter(item => item.id !== itemId))
  }

  const handleUpdatePrice = (itemId: string, newPrice: number) => {
    const item = saleItems.find(i => i.id === itemId)
    if (!item) return

    // Tushib berish narxi olish narxidan kam bo'lmasin
    // Agar som tanlangan bo'lsa, somga o'tkazib solishtir
    const minPrice = currency === 'UZS' ? convertPrice(item.buyPrice) : item.buyPrice
    
    if (newPrice < minPrice) {
      const minPriceFormatted = formatPrice(minPrice)
      setError(`Tushib berish narxi olish narxidan (${minPriceFormatted}) kam bo'lmasin`)
      return
    }

    // Agar som tanlangan bo'lsa, dollardan somga o'tkazib saqlash uchun dollarni hisoblaylik
    const priceInUsd = currency === 'UZS' ? newPrice / exchangeRate : newPrice

    setSaleItems(saleItems.map(i =>
      i.id === itemId
        ? { ...i, salePrice: priceInUsd }
        : i
    ))
    setEditingItemId(null)
    setError(null)
  }

  const handleAddPaymentMethod = (type: 'cash' | 'debt' | 'click' | 'terminal') => {
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
    // Agar som tanlangan bo'lsa, somdan dollardan o'tkazib saqlash
    const amountInUsd = currency === 'UZS' ? amount / exchangeRate : amount
    
    const updated = [...paymentMethods]
    updated[index].amount = amountInUsd
    setPaymentMethods(updated)
  }

  const handleCompleteSale = async () => {
    if (saleItems.length === 0) {
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
      customer: null, // Ko'chaga sotuv - mijoz yo'q
      items: saleItems.map(item => ({
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
      change: Math.max(0, change),
      currency: currency,
      paymentMethods,
      notes: 'Ko\'chaga sotuv'
    }

    const response = await createSale(saleData)

    if (response.success) {
      setSuccess('Savdo muvaffaqiyatli yakunlandi!')
      setSaleItems([])
      setPaymentMethods([])
      setNotes('')
      setTimeout(() => {
        setSuccess(null)
        router.push('/cashier/history')
      }, 2000)
    } else {
      setError(response.error || 'Savdo yakunlanishda xato')
    }

    setIsSubmitting(false)
  }

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
              <ArrowLeft size={24} className="text-orange-400" />
            </button>
            <div className="flex-1">
              <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-400">Ko'chaga Sotuv</h1>
              <p className="text-gray-400 mt-1">Noma'lum odamga sotuv</p>
            </div>
            {/* Currency Selector */}
            <div className="flex gap-2 bg-white/10 border border-white/20 rounded-lg p-1">
              <button
                onClick={() => setCurrency('USD')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  currency === 'USD'
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/50'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                $
              </button>
              <button
                onClick={() => setCurrency('UZS')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  currency === 'UZS'
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/50'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                So'm
              </button>
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
            <Search className="absolute left-4 top-4 w-5 h-5 text-orange-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Mahsulot nomi, IMEKA yoki barkodini kiriting..."
              className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent backdrop-blur-sm text-white placeholder-gray-400 transition-all"
            />
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-2">
            {filteredProducts.length === 0 ? (
              <div className="col-span-2 text-center py-8 text-gray-400">
                {searchTerm ? 'Mahsulot topilmadi' : 'Qidirish uchun IMEKA kiriting'}
              </div>
            ) : (
              filteredProducts.flatMap(product => {
                if (!product.imeiList || product.imeiList.length === 0) {
                  return []
                }
                
                const searchLower = searchTerm.toLowerCase()
                
                // Group IMEIs by value and count available ones
                const imeiGroups: { [key: string]: number } = {}
                product.imeiList.forEach(item => {
                  if (!item.used && item.imei.toLowerCase().includes(searchLower)) {
                    imeiGroups[item.imei] = (imeiGroups[item.imei] || 0) + 1
                  }
                })
                
                // Create one card per unique IMEI
                return Object.entries(imeiGroups).map(([imei, count]) => (
                  <div
                    key={`${product._id}-${imei}`}
                    className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-xl p-4 hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/20 transition-all duration-300 group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-white group-hover:text-orange-300 transition-colors line-clamp-2">
                          {product.name}
                        </h3>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-2xl font-bold text-orange-300">{formatPrice(convertPrice(product.sellPrice))}</p>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-blue-500/20 border border-blue-500/30 rounded p-2">
                          <p className="text-gray-400">Olish:</p>
                          <p className="text-blue-300 font-semibold">{formatPrice(convertPrice(product.buyPrice))}</p>
                        </div>
                        <div className="bg-green-500/20 border border-green-500/30 rounded p-2">
                          <p className="text-gray-400">Sotish:</p>
                          <p className="text-green-300 font-semibold">{formatPrice(convertPrice(product.sellPrice))}</p>
                        </div>
                      </div>
                      
                      <div className="bg-white/5 rounded p-2">
                        <p className="text-xs text-gray-400 mb-1">IMEKA:</p>
                        <p className="text-sm font-mono text-orange-300 break-all">{imei}</p>
                      </div>

                      {/* Available Count */}
                      <div className="bg-orange-500/20 border border-orange-500/30 rounded p-2 text-center">
                        <p className="text-xs text-orange-300">Mavjud: <span className="font-bold">{count} ta</span></p>
                      </div>

                      {/* Quantity Input - only show if count > 1 */}
                      {count > 1 ? (
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="1"
                            max={count}
                            defaultValue="1"
                            id={`qty-${product._id}-${imei}`}
                            className="flex-1 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="Miqdor"
                            onChange={(e) => {
                              const inputValue = e.target.value
                              let value = parseInt(inputValue)
                              if (!isNaN(value) && value > count) {
                                e.target.value = count.toString()
                              }
                            }}
                            onBlur={(e) => {
                              let value = parseInt(e.target.value)
                              if (isNaN(value) || value < 1) {
                                value = 1
                              } else if (value > count) {
                                value = count
                              }
                              e.target.value = value.toString()
                            }}
                          />
                          <button
                            onClick={() => {
                              const qtyInput = document.getElementById(`qty-${product._id}-${imei}`) as HTMLInputElement
                              const qty = parseInt(qtyInput?.value || '1') || 1
                              if (qty > count) {
                                setError(`Maksimum ${count} ta mavjud`)
                                return
                              }
                              handleAddToCart(product, imei, qty)
                            }}
                            className="px-3 py-1 bg-orange-600 hover:bg-orange-700 rounded text-white text-sm font-semibold transition"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAddToCart(product, imei, 1)}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-white text-sm font-semibold transition"
                        >
                          <Plus size={16} />
                          Qo'shish
                        </button>
                      )}
                    </div>
                  </div>
                ))
              })
            )}
          </div>
        </div>

        {/* Cart Section */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl p-6 backdrop-blur-sm sticky top-24 space-y-6 max-h-[calc(100vh-120px)] overflow-y-auto">
            {/* Cart Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-400 rounded-lg flex items-center justify-center">
                <Package size={20} className="text-white" />
              </div>
              <div>
                <h2 className="font-bold text-white">Savatcha</h2>
                <p className="text-sm text-gray-400">{saleItems.length} mahsulot</p>
              </div>
            </div>

            {/* Cart Items */}
            <div className="space-y-3">
              {saleItems.length === 0 ? (
                <p className="text-center text-gray-400 py-8">Savatcha bo\'sh</p>
              ) : (
                saleItems.map(item => (
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

                    {/* Buy and Sell Prices */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-blue-500/20 border border-blue-500/30 rounded p-2">
                        <p className="text-gray-400">Olish:</p>
                        <p className="text-blue-300 font-semibold">{formatPrice(convertPrice(item.buyPrice))}</p>
                      </div>
                      <div className="bg-green-500/20 border border-green-500/30 rounded p-2">
                        <p className="text-gray-400">Sotish:</p>
                        <p className="text-green-300 font-semibold">{formatPrice(convertPrice(item.originalPrice))}</p>
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
                          setSaleItems(saleItems.map(i =>
                            i.id === item.id
                              ? { ...i, quantity: value }
                              : i
                          ))
                        }}
                        className="flex-1 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                            // Faqat raqamlar va nuqta qabul qil
                            if (value === '' || /^\d*\.?\d*$/.test(value)) {
                              setEditingPrice(value === '' ? 0 : parseFloat(value))
                            }
                          }}
                          className="flex-1 bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                          setEditingPrice(currency === 'UZS' ? convertPrice(item.salePrice) : item.salePrice)
                        }}
                        className="w-full text-left px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-orange-300 text-sm transition"
                      >
                        Tushib berish: {formatPrice(convertPrice(item.salePrice))}
                      </button>
                    )}

                    <div className="text-right">
                      <p className="font-bold text-orange-300">{formatPrice(convertPrice(item.salePrice * item.quantity))}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Divider */}
            {saleItems.length > 0 && <div className="border-t border-white/10"></div>}

            {/* Totals */}
            {saleItems.length > 0 && (
              <div className="space-y-3">
                <div className="flex justify-between text-gray-300">
                  <span>Jami:</span>
                  <span className="font-bold text-orange-300">{formatPrice(convertPrice(totalAmount))}</span>
                </div>

                <div className="space-y-3 bg-white/5 border border-white/10 rounded-lg p-4">
                  {/* Payment Methods */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Tolov Turlari (maksimum 2 ta)
                    </label>
                    <div className="grid grid-cols-2 gap-2 mb-3">
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
                                ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/50 border border-orange-400'
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
                        const displayAmount = currency === 'UZS' ? method.amount * exchangeRate : method.amount
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
                                // Faqat raqamlar va nuqta qabul qil
                                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                  handleUpdatePaymentAmount(index, value === '' ? 0 : parseFloat(value))
                                }
                              }}
                              className="w-32 bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                              placeholder={currency === 'UZS' ? '0' : '0.00'}
                            />
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Change */}
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2 text-center">
                    <p className="text-gray-400 text-xs">Qaytarish</p>
                    <p className="font-bold text-green-400">{formatPrice(convertPrice(Math.max(0, change)))}</p>
                  </div>

                  {/* Action Buttons */}
                  <button
                    onClick={handleCompleteSale}
                    disabled={isSubmitting || paymentMethods.length === 0}
                    className="w-full px-3 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:shadow-lg hover:shadow-orange-500/50 transition-all disabled:opacity-50 font-medium text-sm flex items-center justify-center gap-2"
                  >
                    <Check size={16} />
                    {isSubmitting ? 'Yakunlanmoqda...' : 'Yakunlash'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </CashierLayout>
  )
}
