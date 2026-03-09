'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import CashierLayout from '@/components/layouts/CashierLayout'
import { ArrowLeft, Plus, Trash2, Calendar, Package, ShoppingCart, X } from 'lucide-react'
import { getCustomer, getSales, createSale, getProducts } from '@/lib/api'

interface Sale {
  _id: string
  totalAmount: number
  items: Array<{ product?: { name: string }; quantity: number }>
  createdAt: string
}

interface SaleItem {
  id: string
  productId: string
  productName: string
  quantity: number
  price: number
  total: number
}

interface Product {
  _id: string
  name: string
  sellPrice: number
  stock: number
}

interface CustomerDetail {
  _id: string
  name: string
  phone: string
  email?: string
  address?: string
  totalPurchase?: number
  debt?: number
}

export default function CustomerDetailPage() {
  const router = useRouter()
  const params = useParams()
  const customerId = params.id as string
  const [error, setError] = useState<string | null>(null)
  const [customer, setCustomer] = useState<CustomerDetail | null>(null)
  const [sales, setSales] = useState<Sale[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [showSaleModal, setShowSaleModal] = useState(false)
  const [saleItems, setSaleItems] = useState<SaleItem[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [paidAmount, setPaidAmount] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paymentType, setPaymentType] = useState('cash') // cash, debt, split
  const [currency, setCurrency] = useState('usd') // usd, uzb

  const fetchData = async () => {
    setError(null)
    
    const branchId = localStorage.getItem('branchId')
    const [customerRes, salesRes, productsRes] = await Promise.all([
      getCustomer(customerId),
      getSales(),
      getProducts(branchId ? { branch: branchId } : undefined)
    ])

    if (customerRes.success && customerRes.data) {
      setCustomer(customerRes.data as CustomerDetail)
    } else {
      setError(customerRes.error || 'Mijozni yuklashda xato')
    }

    if (salesRes.success && salesRes.data) {
      const customerSales = (salesRes.data as Sale[]).filter(
        sale => sale._id === customerId || (sale as any).customer?._id === customerId
      )
      setSales(customerSales)
    }

    if (productsRes.success && productsRes.data) {
      setProducts(productsRes.data as Product[])
    }
  }

  const handleCompleteSale = async () => {
    if (!customer || saleItems.length === 0) {
      setError('Barcha maydonlarni to\'ldiring')
      return
    }

    // Validate payment amount based on payment type
    if (paymentType === 'cash' && !paidAmount) {
      setError('To\'lov summasi kiritilishi kerak')
      return
    }

    setIsSubmitting(true)
    setError(null)
    
    const totalAmount = saleItems.reduce((sum, item) => sum + item.total, 0)
    
    const saleData = {
      branch: localStorage.getItem('branchId') || '507f1f77bcf86cd799439011',
      customer: customer._id,
      items: saleItems.map(item => ({
        product: item.productId,
        quantity: item.quantity,
        price: item.price,
        total: item.total
      })),
      totalAmount: totalAmount,
      paidAmount: paymentType === 'debt' ? 0 : (paymentType === 'split' ? totalAmount / 2 : parseFloat(paidAmount || '0')),
      currency: currency === 'usd' ? 'USD' : 'UZS',
      paymentType: paymentType,
      notes: ''
    }
    
    const response = await createSale(saleData)
    
    if (response.success) {
      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        setSaleItems([])
        setPaidAmount('')
        setPaymentType('cash')
        setCurrency('usd')
        setShowSaleModal(false)
        fetchData()
      }, 2000)
    } else {
      setError(response.error || 'Savdo qo\'shishda xato')
    }
    setIsSubmitting(false)
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('cashierToken')
      if (!token) {
        router.push('/')
      } else {
        fetchData()
      }
    }
  }, [router, customerId])

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    ((p as any).imei && (p as any).imei.toLowerCase().includes(productSearch.toLowerCase()))
  )

  const handleAddItem = (product: typeof products[0]) => {
    const existingItem = saleItems.find((i) => i.productId === product._id)
    if (existingItem) {
      setSaleItems(
        saleItems.map((i) =>
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
          quantity: 1,
          price: product.sellPrice,
          total: product.sellPrice,
        },
      ])
    }
    setProductSearch('')
  }

  const handleRemoveItem = (id: string) => {
    setSaleItems(saleItems.filter((i) => i.id !== id))
  }

  const totalAmount = saleItems.reduce((sum, item) => sum + item.total, 0)
  const change = parseFloat(paidAmount) - totalAmount || 0

  if (!customer) {
    return (
      <CashierLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">Mijoz topilmadi</p>
          <Link href="/cashier/customers" className="text-teal-600 hover:underline mt-4 inline-block">
            Orqaga qaytish
          </Link>
        </div>
      </CashierLayout>
    )
  }

  return (
    <CashierLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/cashier/customers"
            className="p-2 hover:bg-white/10 rounded-lg transition"
          >
            <ArrowLeft size={24} className="text-teal-400" />
          </Link>
          <div>
            <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-cyan-400">{customer.name}</h1>
            <p className="text-gray-400 mt-1">{customer.phone}</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 backdrop-blur-sm">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-xl p-4 border border-blue-500/30 backdrop-blur-sm">
            <p className="text-sm text-blue-300 font-medium">Jami Savdolar</p>
            <p className="text-3xl font-bold text-blue-400 mt-2">{sales.length}</p>
          </div>
          <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-xl p-4 border border-green-500/30 backdrop-blur-sm">
            <p className="text-sm text-green-300 font-medium">Jami Summa</p>
            <p className="text-3xl font-bold text-green-400 mt-2">${(customer.totalPurchase || 0).toFixed(2)}</p>
          </div>
          <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 rounded-xl p-4 border border-red-500/30 backdrop-blur-sm">
            <p className="text-sm text-red-300 font-medium">Qarz</p>
            <p className="text-3xl font-bold text-red-400 mt-2">${(customer.debt || 0).toFixed(2)}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-xl p-4 border border-purple-500/30 backdrop-blur-sm">
            <p className="text-sm text-purple-300 font-medium">Manzil</p>
            <p className="text-sm font-semibold text-purple-300 mt-2">{customer.address || '-'}</p>
          </div>
        </div>

        {/* Purchase History */}
        <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-cyan-400">Savdo Tarixi</h2>
            <button
              onClick={() => setShowSaleModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white px-4 py-2 rounded-lg hover:shadow-lg hover:shadow-teal-500/50 transition font-semibold"
            >
              <ShoppingCart size={20} />
              Savdo Qilish
            </button>
          </div>

          {sales.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">Savdolar topilmadi</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sales.map((sale) => (
                <div
                  key={sale._id}
                  className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-teal-500/50 transition"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar size={16} className="text-gray-400" />
                      <p className="text-sm text-gray-400">{new Date(sale.createdAt).toLocaleDateString('uz-UZ')}</p>
                    </div>
                    <p className="font-semibold text-white">
                      {sale.items.map(item => item.product?.name || 'Noma\'lum').join(', ')}
                    </p>
                    <p className="text-sm text-gray-400">Miqdor: {sale.items.reduce((sum, item) => sum + item.quantity, 0)}</p>
                  </div>
                  <p className="text-lg font-bold text-green-400">${sale.totalAmount.toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sale Modal */}
        {showSaleModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-white/20 rounded-2xl shadow-2xl max-w-2xl w-full p-6 my-8 backdrop-blur-xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-cyan-400">Savdo Qilish</h2>
                <button
                  onClick={() => setShowSaleModal(false)}
                  className="p-1 hover:bg-white/10 rounded-lg transition"
                >
                  <X size={24} className="text-gray-400" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left - Products */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      IMEI Orqali Qidirish
                    </label>
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="IMEI yoki mahsulot nomini kiriting"
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-white placeholder-gray-400 transition-all backdrop-blur-sm"
                    />
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                    {filteredProducts.map((product) => (
                      <button
                        key={product._id}
                        onClick={() => handleAddItem(product)}
                        className="w-full flex justify-between items-center p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-teal-500/50 transition text-left"
                      >
                        <div>
                          <p className="font-semibold text-white">{product.name}</p>
                          <p className="text-xs text-gray-400">{(product as any).imei || 'IMEI yo\'q'}</p>
                          <p className="text-sm text-gray-400">${product.sellPrice}</p>
                        </div>
                        <Plus size={20} className="text-teal-400" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right - Cart & Payment */}
                <div className="space-y-4">
                  {/* Cart */}
                  <div>
                    <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                      <ShoppingCart size={20} className="text-teal-400" />
                      Savdo ({saleItems.length})
                    </h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto mb-4 pr-2">
                      {saleItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-start p-3 bg-white/5 border border-white/10 rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="font-semibold text-white text-sm">
                              {item.productName}
                            </p>
                            <p className="text-xs text-gray-400">
                              {item.quantity} x ${item.price}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-teal-300">${item.total}</p>
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-red-400 hover:text-red-300 mt-1 transition"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-white/10 pt-3">
                      <div className="flex justify-between font-bold text-white">
                        <span>Jami:</span>
                        <span className="text-teal-300">${totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment */}
                  <div className="space-y-4 border-t border-white/10 pt-4">
                    {/* Payment Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        To'lov Turi
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => setPaymentType('cash')}
                          className={`py-2 px-3 rounded-lg font-semibold transition-all ${
                            paymentType === 'cash'
                              ? 'bg-teal-600 text-white shadow-lg shadow-teal-500/50 border border-teal-400'
                              : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'
                          }`}
                        >
                          Naqd
                        </button>
                        <button
                          onClick={() => setPaymentType('debt')}
                          className={`py-2 px-3 rounded-lg font-semibold transition-all ${
                            paymentType === 'debt'
                              ? 'bg-red-600 text-white shadow-lg shadow-red-500/50 border border-red-400'
                              : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'
                          }`}
                        >
                          Qarz
                        </button>
                        <button
                          onClick={() => setPaymentType('split')}
                          className={`py-2 px-3 rounded-lg font-semibold transition-all ${
                            paymentType === 'split'
                              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50 border border-purple-400'
                              : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'
                          }`}
                        >
                          50-50
                        </button>
                      </div>
                    </div>

                    {/* Currency */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Valyuta
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setCurrency('usd')}
                          className={`py-2 px-3 rounded-lg font-semibold transition-all ${
                            currency === 'usd'
                              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50 border border-blue-400'
                              : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'
                          }`}
                        >
                          USD
                        </button>
                        <button
                          onClick={() => setCurrency('uzb')}
                          className={`py-2 px-3 rounded-lg font-semibold transition-all ${
                            currency === 'uzb'
                              ? 'bg-green-600 text-white shadow-lg shadow-green-500/50 border border-green-400'
                              : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'
                          }`}
                        >
                          UZB
                        </button>
                      </div>
                    </div>

                    {/* Payment Amount */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        To'lov Summasi
                      </label>
                      <input
                        type="number"
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-white placeholder-gray-400 transition-all backdrop-blur-sm"
                      />
                    </div>

                    {/* Summary Box */}
                    <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 p-4 rounded-lg backdrop-blur-sm">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Jami Summa:</span>
                          <span className="text-white font-semibold">${totalAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">To'lov Turi:</span>
                          <span className={`font-semibold ${
                            paymentType === 'cash' ? 'text-teal-400' :
                            paymentType === 'debt' ? 'text-red-400' :
                            'text-purple-400'
                          }`}>
                            {paymentType === 'cash' ? 'Naqd' : paymentType === 'debt' ? 'Qarz' : '50-50'}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Valyuta:</span>
                          <span className={`font-semibold ${
                            currency === 'usd' ? 'text-blue-400' : 'text-green-400'
                          }`}>
                            {currency === 'usd' ? 'USD' : 'UZB'}
                          </span>
                        </div>
                        {paidAmount && (
                          <>
                            <div className="border-t border-white/10 pt-2 mt-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-400">To'langan:</span>
                                <span className="text-white font-semibold">${parseFloat(paidAmount).toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-sm mt-1">
                                <span className="text-gray-400">Qaytarish:</span>
                                <span className={`font-bold ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  ${change.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={handleCompleteSale}
                      disabled={saleItems.length === 0 || !paidAmount || isSubmitting}
                      className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white py-3 rounded-lg hover:shadow-lg hover:shadow-teal-500/50 transition disabled:opacity-50 font-semibold"
                    >
                      {isSubmitting ? 'Jarayonda...' : 'Savdo Yakunlash'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

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
