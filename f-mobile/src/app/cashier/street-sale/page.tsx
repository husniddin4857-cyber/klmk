'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import CashierLayout from '@/components/layouts/CashierLayout'
import { Plus, Trash2, X, Search, Package } from 'lucide-react'
import { getProducts, createSale } from '@/lib/api'

interface Product {
  _id: string
  name: string
  sellPrice: number
  imei: string
}

interface SaleItem {
  id: string
  productId: string
  productName: string
  price: number
  quantity: number
  total: number
}

export default function StreetSalePage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [saleItems, setSaleItems] = useState<SaleItem[]>([])
  const [paidAmount, setPaidAmount] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const fetchProducts = async () => {
    setError(null)
    try {
      const response = await getProducts()
      if (response.success && response.data) {
        // Filter products by branch
        const branchId = localStorage.getItem('branchId')
        console.log('Current branchId:', branchId)
        
        const filteredByBranch = branchId 
          ? (response.data as Product[]).filter(p => {
              const pBranchId = typeof (p as any).branch === 'string' 
                ? (p as any).branch 
                : (p as any).branch?._id
              console.log(`Product ${p.name}: branch=${pBranchId}, matches=${pBranchId === branchId}`)
              return pBranchId === branchId
            })
          : response.data as Product[]
        
        console.log(`Filtered products: ${filteredByBranch.length}`)
        setProducts(filteredByBranch)
      } else {
        setError(response.error || 'Mahsulotlarni yuklashda xato')
      }
    } catch (err) {
      console.error('Fetch error:', err)
      setError('Ma\'lumotlarni yuklashda xato')
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('cashierToken')
      if (!token) {
        router.push('/')
      } else {
        fetchProducts()
      }
    }
  }, [router])

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddItem = (product: Product) => {
    const existingItem = saleItems.find(i => i.productId === product._id)
    if (existingItem) {
      setSaleItems(
        saleItems.map(i =>
          i.productId === product._id
            ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.price }
            : i
        )
      )
    } else {
      setSaleItems([
        ...saleItems,
        {
          id: Math.random().toString(),
          productId: product._id,
          productName: product.name,
          price: product.sellPrice,
          quantity: 1,
          total: product.sellPrice,
        },
      ])
    }
    setSearchTerm('')
  }

  const handleRemoveItem = (id: string) => {
    setSaleItems(saleItems.filter(i => i.id !== id))
  }

  const handleCompleteSale = async () => {
    if (saleItems.length === 0 || !paidAmount) {
      setError('Mahsulot va to\'lov summasi talab qilinadi')
      return
    }

    setIsSubmitting(true)
    setError(null)

    const totalAmount = saleItems.reduce((sum, item) => sum + item.total, 0)

    const saleData = {
      branch: localStorage.getItem('branchId') || '507f1f77bcf86cd799439011',
      customer: null, // Ko'chaga sotuv - mijoz yo'q
      items: saleItems.map(item => ({
        product: item.productId,
        quantity: item.quantity,
        price: item.price,
        total: item.total
      })),
      totalAmount: totalAmount,
      paidAmount: parseFloat(paidAmount),
      currency: 'USD',
      debt: 0,
      notes: 'Ko\'chaga sotuv'
    }

    const response = await createSale(saleData)

    if (response.success) {
      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        setSaleItems([])
        setPaidAmount('')
      }, 2000)
    } else {
      setError(response.error || 'Savdo qo\'shishda xato')
    }
    setIsSubmitting(false)
  }

  const totalAmount = saleItems.reduce((sum, item) => sum + item.total, 0)
  const change = parseFloat(paidAmount) - totalAmount || 0

  return (
    <CashierLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600/20 to-red-600/20 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <h1 className="text-3xl font-black bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">Ko'chaga Sotuv</h1>
          <p className="text-gray-300 mt-1">Narxiga sotish - mijoz sifatida saqlanmaydi</p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-300">
            {error}
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-3 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Mahsulot qidirish..."
                className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredProducts.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <Package className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                  <p className="text-gray-400">Mahsulotlar topilmadi</p>
                </div>
              ) : (
                filteredProducts.map((product) => (
                  <button
                    key={product._id}
                    onClick={() => handleAddItem(product)}
                    className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-lg p-4 hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/20 transition-all duration-300 group text-left"
                  >
                    <h3 className="font-semibold text-white group-hover:text-orange-300 transition-colors line-clamp-2 mb-2">
                      {product.name}
                    </h3>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xs text-gray-400">Narx:</p>
                        <p className="text-lg font-bold text-orange-400">${product.sellPrice.toFixed(2)}</p>
                      </div>
                      <Plus size={20} className="text-orange-400 group-hover:scale-110 transition-transform" />
                    </div>
                    {product.imei && (
                      <p className="text-xs text-blue-300 mt-2 truncate">IMEI: {product.imei}</p>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Cart */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl p-6 backdrop-blur-sm h-fit sticky top-6">
            <h2 className="text-xl font-bold text-white mb-4">Savdo ({saleItems.length})</h2>

            {/* Items */}
            <div className="space-y-2 max-h-64 overflow-y-auto mb-4 pr-2">
              {saleItems.map((item) => (
                <div key={item.id} className="flex justify-between items-start p-3 bg-white/5 border border-white/10 rounded-lg">
                  <div className="flex-1">
                    <p className="font-semibold text-white text-sm">{item.productName}</p>
                    <p className="text-xs text-gray-400">{item.quantity} x ${item.price.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-orange-300">${item.total.toFixed(2)}</p>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-red-400 hover:text-red-300 mt-1 transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="border-t border-white/10 pt-3 mb-4">
              <div className="flex justify-between font-bold text-white mb-2">
                <span>Jami:</span>
                <span className="text-orange-300">${totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  To'lov Summasi
                </label>
                <input
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {paidAmount && (
                <div className="bg-green-500/10 border border-green-500/30 p-3 rounded-lg">
                  <p className="text-sm text-gray-400">Qaytarish:</p>
                  <p className="text-2xl font-bold text-green-400">${change.toFixed(2)}</p>
                </div>
              )}

              <button
                onClick={handleCompleteSale}
                disabled={saleItems.length === 0 || !paidAmount || isSubmitting}
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white py-3 rounded-lg transition disabled:opacity-50 font-semibold"
              >
                {isSubmitting ? 'Jarayonda...' : 'Savdo Yakunlash'}
              </button>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="fixed bottom-4 right-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-green-500/50 animate-pulse z-50 backdrop-blur-sm border border-green-500/30">
            ✓ Savdo muvaffaqiyatli yakunlandi!
          </div>
        )}
      </div>
    </CashierLayout>
  )
}
