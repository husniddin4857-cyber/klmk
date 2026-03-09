'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import CashierLayout from '@/components/layouts/CashierLayout'
import { getProducts, getCustomer, createSale } from '@/lib/api'
import { ShoppingCart, Plus, Minus, Trash2, Search, X, Check, ArrowLeft } from 'lucide-react'

interface Product {
  _id: string
  name: string
  category: string
  sellPrice: number
  stock: number
  barcode?: string
}

interface Customer {
  _id: string
  name: string
  phone: string
  debt?: number
}

interface CartItem {
  product: Product
  quantity: number
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

  const [cart, setCart] = useState<CartItem[]>([])
  const [showPayment, setShowPayment] = useState(false)
  const [paidAmount, setPaidAmount] = useState(0)
  const [notes, setNotes] = useState('')

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.barcode && p.barcode.includes(searchTerm))
  )

  const totalAmount = cart.reduce((sum, item) => sum + item.product.sellPrice * item.quantity, 0)
  const change = paidAmount - totalAmount
  const finalDebt = Math.max(0, totalAmount - paidAmount)

  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) {
      setError('Bu mahsulot sotuvda yo\'q')
      return
    }

    const existingItem = cart.find(item => item.product._id === product._id)
    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        setCart(cart.map(item =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ))
      } else {
        setError('Ushbu mahsulotdan ko\'proq sotib bo\'lmaydi')
      }
    } else {
      setCart([...cart, { product, quantity: 1 }])
    }
    setError(null)
  }

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.product._id !== productId))
    } else {
      const product = cart.find(item => item.product._id === productId)?.product
      if (product && quantity <= product.stock) {
        setCart(cart.map(item =>
          item.product._id === productId
            ? { ...item, quantity }
            : item
        ))
      }
    }
  }

  const handleRemoveFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product._id !== productId))
  }

  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      setError('Savatcha bo\'sh')
      return
    }

    if (paidAmount < 0) {
      setError('To\'lov miqdori noto\'g\'ri')
      return
    }

    setIsSubmitting(true)
    setError(null)

    const saleData = {
      branch: localStorage.getItem('branchId') || '507f1f77bcf86cd799439011',
      customer: selectedCustomer?._id || null,
      items: cart.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.product.sellPrice,
        total: item.product.sellPrice * item.quantity
      })),
      totalAmount,
      paidAmount,
      change: Math.max(0, change),
      currency: 'USD',
      debt: finalDebt,
      notes
    }

    const response = await createSale(saleData)

    if (response.success) {
      setSuccess('Savdo muvaffaqiyatli yakunlandi!')
      setCart([])
      setPaidAmount(0)
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
          // Filter products by branch
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
              placeholder="Mahsulot nomini yoki barkodini qidirish..."
              className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent backdrop-blur-sm text-white placeholder-gray-400 transition-all"
            />
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-2">
            {filteredProducts.length === 0 ? (
              <div className="col-span-2 text-center py-8 text-gray-400">
                Mahsulot topilmadi
              </div>
            ) : (
              filteredProducts.map(product => (
                <div
                  key={product._id}
                  className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-xl p-4 hover:border-teal-500/50 hover:shadow-lg hover:shadow-teal-500/20 transition-all duration-300 group cursor-pointer"
                  onClick={() => handleAddToCart(product)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-white group-hover:text-teal-300 transition-colors line-clamp-2">
                        {product.name}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">{product.category}</p>
                    </div>
                    <Plus size={20} className="text-teal-400 group-hover:scale-110 transition-transform" />
                  </div>

                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-2xl font-bold text-teal-300">${product.sellPrice}</p>
                      <p className={`text-xs mt-1 ${product.stock > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {product.stock > 0 ? `${product.stock} ta` : 'Sotuvda yo\'q'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Cart Section */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl p-6 backdrop-blur-sm sticky top-24 space-y-6">
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
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {cart.length === 0 ? (
                <p className="text-center text-gray-400 py-8">Savatcha bo\'sh</p>
              ) : (
                cart.map(item => (
                  <div key={item.product._id} className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold text-white text-sm line-clamp-2">{item.product.name}</p>
                        <p className="text-teal-300 font-bold text-sm mt-1">${item.product.sellPrice}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveFromCart(item.product._id)}
                        className="p-1 hover:bg-red-500/20 rounded transition"
                      >
                        <Trash2 size={16} className="text-red-400" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateQuantity(item.product._id, item.quantity - 1)}
                        className="p-1 bg-white/10 hover:bg-white/20 rounded transition"
                      >
                        <Minus size={16} className="text-gray-300" />
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleUpdateQuantity(item.product._id, parseInt(e.target.value) || 0)}
                        className="flex-1 bg-white/10 border border-white/20 rounded px-2 py-1 text-center text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                      <button
                        onClick={() => handleUpdateQuantity(item.product._id, item.quantity + 1)}
                        className="p-1 bg-white/10 hover:bg-white/20 rounded transition"
                      >
                        <Plus size={16} className="text-gray-300" />
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-gray-400">Jami:</p>
                      <p className="font-bold text-teal-300">${(item.product.sellPrice * item.quantity).toFixed(2)}</p>
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
                    {/* Paid Amount */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        To'langan miqdor
                      </label>
                      <input
                        type="number"
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder="0"
                      />
                    </div>

                    {/* Change/Debt */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2 text-center">
                        <p className="text-gray-400 text-xs">Qaytarish</p>
                        <p className="font-bold text-green-400">${Math.max(0, change).toFixed(2)}</p>
                      </div>
                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 text-center">
                        <p className="text-gray-400 text-xs">Qarz</p>
                        <p className="font-bold text-red-400">${finalDebt.toFixed(2)}</p>
                      </div>
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
                        disabled={isSubmitting}
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
