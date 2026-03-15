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
  buyPrice: number
  originalPrice: number
  salePrice: number
  total: number
  imei?: string
  imeiCount?: number
}

interface PaymentMethod {
  type: 'cash' | 'click' | 'terminal'
  amount: number
}

interface Product {
  _id: string
  name: string
  sellPrice: number
  stock: number
  buyPrice?: number
  imeiList?: Array<{ imei: string; used: boolean }>
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

interface PaymentState {
  [key: string]: number
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
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [showSuccess, setShowSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currency, setCurrency] = useState<'USD' | 'UZS'>('USD')
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editingPrice, setEditingPrice] = useState(0)
  const [exchangeRate, setExchangeRate] = useState(12500)
  const [paymentState, setPaymentState] = useState<PaymentState>({})

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

  const handleCompleteSale = async () => {
    if (!customer || saleItems.length === 0) {
      setError('Barcha maydonlarni to\'ldiring')
      return
    }

    if (paymentMethods.length === 0) {
      setError('Tolov turini tanlang')
      return
    }

    const totalAmount = saleItems.reduce((sum, item) => sum + item.total, 0)
    const totalPaid = paymentMethods.reduce((sum, method) => sum + method.amount, 0)

    // Qarz bo'lsa, savdo yakunlanishi kerak (totalPaid < totalAmount bo'lsa ham)
    // Lekin agar qarz bo'lmasa, to'lov yetarli bo'lishi kerak
    const hasDebt = totalPaid < totalAmount
    if (hasDebt && totalPaid === 0) {
      setError('Kamida bir xil tolov turi tanlang')
      return
    }

    setIsSubmitting(true)
    setError(null)
    
    const saleData = {
      branch: localStorage.getItem('branchId') || '507f1f77bcf86cd799439011',
      customer: customer._id,
      items: saleItems.map(item => ({
        product: item.productId,
        quantity: item.quantity,
        originalPrice: item.originalPrice,
        salePrice: item.salePrice,
        imei: item.imei,
        total: item.total
      })),
      totalAmount: totalAmount,
      paidAmount: totalPaid,
      change: Math.max(0, totalPaid - totalAmount),
      currency: currency,
      paymentMethods: paymentMethods,
      notes: ''
    }
    
    const response = await createSale(saleData)
    
    if (response.success) {
      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        setSaleItems([])
        setPaymentMethods([])
        setCurrency('USD')
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
        fetchExchangeRate()
      }
    }
  }, [router, customerId])

  const filteredProducts = products.filter((p) => {
    if (!productSearch.trim()) return false
    const searchLower = productSearch.toLowerCase()
    
    // Mahsulot nomi bilan qidirish
    const nameMatch = p.name.toLowerCase().includes(searchLower)
    
    // IMEI bilan qidirish (agar imeiList bo'lsa)
    const imeiMatch = p.imeiList && p.imeiList.some((item: any) => 
      item.imei.toLowerCase().includes(searchLower) && !item.used
    )
    
    // Agar imeiList bo'lmasa, faqat nomi bilan qidirish
    if (!p.imeiList || p.imeiList.length === 0) {
      return nameMatch
    }
    
    return nameMatch || imeiMatch
  })

  const handleAddItem = (product: Product, imei?: string, quantity: number = 1) => {
    // Agar stock yetarli bo'lmasa
    if (!imei && product.stock < quantity) {
      setError(`Maksimum ${product.stock} ta mavjud`)
      return
    }

    const existingItem = saleItems.find((i) => i.productId === product._id && i.imei === imei)
    
    if (existingItem) {
      setSaleItems(
        saleItems.map((i) =>
          i.id === existingItem.id
            ? { 
                ...i, 
                quantity: i.quantity + quantity, 
                total: (i.quantity + quantity) * i.salePrice 
              }
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
          quantity: quantity,
          buyPrice: product.buyPrice || 0,
          originalPrice: product.sellPrice,
          salePrice: product.sellPrice,
          total: product.sellPrice * quantity,
          imei: imei,
          imeiCount: imei ? quantity : product.stock
        },
      ])
    }
    setProductSearch('')
  }

  const handleRemoveItem = (id: string) => {
    setSaleItems(saleItems.filter((i) => i.id !== id))
  }

  const totalAmount = saleItems.reduce((sum, item) => sum + item.total, 0)
  const totalPaid = paymentMethods.reduce((sum, method) => sum + method.amount, 0)
  const finalDebt = Math.max(0, totalAmount - totalPaid)

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

  const handleUpdatePrice = (itemId: string, newPrice: number) => {
    const item = saleItems.find(i => i.id === itemId)
    if (!item) return

    if (newPrice < item.buyPrice) {
      setError(`Tushib berish narxi olish narxidan (${item.buyPrice}$) kam bo'lmasligi kerak`)
      return
    }

    setSaleItems(saleItems.map(i =>
      i.id === itemId
        ? { ...i, salePrice: newPrice, total: newPrice * i.quantity }
        : i
    ))
    setEditingItemId(null)
    setError(null)
  }

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
        <div className="flex items-center gap-4">
          <Link href="/cashier/customers" className="p-2 hover:bg-white/10 rounded-lg transition">
            <ArrowLeft size={24} className="text-teal-400" />
          </Link>
          <div>
            <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-cyan-400">{customer.name}</h1>
            <p className="text-gray-400 mt-1">{customer.phone}</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 backdrop-blur-sm">
            {error}
          </div>
        )}

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

        <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-cyan-400">Savdo Tarixi</h2>
            <button onClick={() => setShowSaleModal(true)} className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white px-4 py-2 rounded-lg hover:shadow-lg hover:shadow-teal-500/50 transition font-semibold">
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
                <div key={sale._id} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-teal-500/50 transition">
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

        {showSaleModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-white/20 rounded-2xl shadow-2xl max-w-2xl w-full p-6 my-8 backdrop-blur-xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-cyan-400">Savdo Qilish</h2>
                <button onClick={() => setShowSaleModal(false)} className="p-1 hover:bg-white/10 rounded-lg transition">
                  <X size={24} className="text-gray-400" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">IMEI Orqali Qidirish</label>
                    <input type="text" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="IMEI yoki mahsulot nomini kiriting" className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-white placeholder-gray-400 transition-all backdrop-blur-sm" />
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                    {filteredProducts.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        {productSearch ? 'Mahsulot topilmadi' : 'Qidirish uchun IMEKA yoki nomi kiriting'}
                      </div>
                    ) : (
                      filteredProducts.map((product) => {
                        // Agar imeiList bo'lsa, uni ko'rsatish
                        if (product.imeiList && product.imeiList.length > 0) {
                          const searchLower = productSearch.toLowerCase()
                          const imeiGroups: { [key: string]: number } = {}
                          
                          product.imeiList.forEach(item => {
                            if (!item.used && item.imei.toLowerCase().includes(searchLower)) {
                              imeiGroups[item.imei] = (imeiGroups[item.imei] || 0) + 1
                            }
                          })
                          
                          if (product.name.toLowerCase().includes(searchLower)) {
                            product.imeiList.forEach(item => {
                              if (!item.used) {
                                imeiGroups[item.imei] = (imeiGroups[item.imei] || 0) + 1
                              }
                            })
                          }
                          
                          return Object.entries(imeiGroups).map(([imei, count]) => (
                            <button key={`${product._id}-${imei}`} onClick={() => {
                              if (count > 1) {
                                const qtyInput = document.getElementById(`qty-${product._id}-${imei}`) as HTMLInputElement
                                const qty = parseInt(qtyInput?.value || '1') || 1
                                if (qty > count) {
                                  setError(`Maksimum ${count} ta mavjud`)
                                  return
                                }
                                handleAddItem(product, imei, qty)
                              } else {
                                handleAddItem(product, imei, 1)
                              }
                            }} className="w-full flex justify-between items-center p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-teal-500/50 transition text-left">
                              <div className="flex-1">
                                <p className="font-semibold text-white">{product.name}</p>
                                <p className="text-xs text-gray-400">IMEKA: {imei}</p>
                                <div className="flex gap-3 mt-1 text-xs">
                                  <span className="text-yellow-400">Olish: ${(product.buyPrice || 0).toFixed(2)}</span>
                                  <span className="text-green-400">Sotish: ${product.sellPrice.toFixed(2)}</span>
                                </div>
                                {count > 1 && (
                                  <div className="flex gap-2 mt-2">
                                    <input type="number" min="1" max={count} defaultValue="1" id={`qty-${product._id}-${imei}`} onClick={(e) => e.stopPropagation()} className="w-16 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="Miqdor" onChange={(e) => { const inputValue = e.target.value; let value = parseInt(inputValue); if (!isNaN(value) && value > count) { e.target.value = count.toString() } }} onBlur={(e) => { let value = parseInt(e.target.value); if (isNaN(value) || value < 1) { value = 1 } else if (value > count) { value = count } e.target.value = value.toString() }} />
                                    <span className="text-xs text-teal-300 flex items-center">Mavjud: {count} ta</span>
                                  </div>
                                )}
                              </div>
                              <Plus size={20} className="text-teal-400" />
                            </button>
                          ))
                        }
                        
                        // Agar imeiList bo'lmasa, oddiy mahsulot sifatida ko'rsatish
                        return (
                          <button key={product._id} onClick={() => {
                            handleAddItem(product, undefined, 1)
                          }} className="w-full flex justify-between items-center p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-teal-500/50 transition text-left">
                            <div className="flex-1">
                              <p className="font-semibold text-white">{product.name}</p>
                              <div className="flex gap-3 mt-1 text-xs">
                                <span className="text-yellow-400">Olish: ${(product.buyPrice || 0).toFixed(2)}</span>
                                <span className="text-green-400">Sotish: ${product.sellPrice.toFixed(2)}</span>
                              </div>
                              <div className="flex gap-2 mt-2">
                                <span className="text-xs text-teal-300">Mavjud: {product.stock} ta</span>
                              </div>
                            </div>
                            <Plus size={20} className="text-teal-400" />
                          </button>
                        )
                      })
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                      <ShoppingCart size={20} className="text-teal-400" />
                      Savdo ({saleItems.length})
                    </h3>
                    <div className="space-y-2 mb-4 max-h-48 overflow-y-auto pr-2">
                      {saleItems.map((item) => (
                        <div key={item.id} className="p-3 bg-white/5 border border-white/10 rounded-lg space-y-2">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-semibold text-white text-sm">{item.productName}</p>
                              <div className="flex gap-3 mt-1 text-xs">
                                <span className="text-yellow-400">Olish: ${item.buyPrice.toFixed(2)}</span>
                                <span className="text-green-400">Sotish: ${item.originalPrice.toFixed(2)}</span>
                              </div>
                            </div>
                            <button onClick={() => handleRemoveItem(item.id)} className="text-red-400 hover:text-red-300 transition">
                              <Trash2 size={16} />
                            </button>
                          </div>

                          <div className="flex items-center gap-2 bg-white/5 rounded p-2">
                            <span className="text-xs text-gray-400">Miqdor:</span>
                            <input type="number" min="1" max={item.imeiCount || 1} defaultValue={item.quantity} id={`qty-cart-${item.id}`} onChange={(e) => { let value = parseInt(e.target.value); if (isNaN(value) || value < 1) { value = 1; e.target.value = '1' } else if (value > (item.imeiCount || 1)) { value = item.imeiCount || 1; e.target.value = (item.imeiCount || 1).toString() } setSaleItems(saleItems.map(i => i.id === item.id ? { ...i, quantity: value, total: value * i.salePrice } : i)) }} className="flex-1 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="Miqdor" />
                            <span className="text-xs text-gray-400">/ {item.imeiCount || 1}</span>
                          </div>

                          {editingItemId === item.id ? (
                            <div className="flex gap-2">
                              <input type="text" inputMode="decimal" value={editingPrice} onChange={(e) => { const value = e.target.value; if (value === '' || /^\d*\.?\d*$/.test(value)) { setEditingPrice(value === '' ? 0 : parseFloat(value)) } }} className="flex-1 bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="0.00" />
                              <button onClick={() => handleUpdatePrice(item.id, editingPrice)} className="px-2 py-1 bg-green-500/20 hover:bg-green-500/40 rounded text-green-400 text-sm transition">OK</button>
                            </div>
                          ) : (
                            <button onClick={() => { setEditingItemId(item.id); setEditingPrice(item.salePrice) }} className="w-full text-left px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-teal-300 text-sm transition">
                              Tushib berish: ${item.salePrice.toFixed(2)}
                            </button>
                          )}

                          <div className="text-right">
                            <p className="text-sm text-gray-400">Jami:</p>
                            <p className="font-bold text-teal-300">${item.total.toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {saleItems.length > 0 && (
                      <div className="border-t border-white/10 pt-3">
                        <div className="flex justify-between font-bold text-white">
                          <span>Jami:</span>
                          <span className="text-teal-300">
                            {currency === 'UZS' 
                              ? `${Math.floor(totalAmount * exchangeRate).toLocaleString('uz-UZ')} so'm` 
                              : `$${totalAmount.toFixed(2)}`
                            }
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {saleItems.length > 0 && (
                    <div className="space-y-4 border-t border-white/10 pt-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-sm font-medium text-gray-300">Tolov Turlari (maksimum 2 ta)</label>
                          <div className="flex gap-2 bg-white/10 border border-white/20 rounded-lg p-1">
                            <button onClick={() => setCurrency('USD')} className={`px-3 py-1 rounded-lg font-semibold transition-all text-sm ${currency === 'USD' ? 'bg-teal-600 text-white shadow-lg shadow-teal-500/50' : 'text-gray-300 hover:text-white'}`}>$</button>
                            <button onClick={() => setCurrency('UZS')} className={`px-3 py-1 rounded-lg font-semibold transition-all text-sm ${currency === 'UZS' ? 'bg-teal-600 text-white shadow-lg shadow-teal-500/50' : 'text-gray-300 hover:text-white'}`}>So'm</button>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          {['cash', 'click', 'terminal'].map(type => {
                            const isSelected = paymentMethods.some(m => m.type === type as any)
                            const typeText = type === 'cash' ? 'Naqd' : type === 'click' ? 'Click' : 'Terminal'
                            return (
                              <button key={type} onClick={() => { if (isSelected) { handleRemovePaymentMethod(paymentMethods.findIndex(m => m.type === type as any)) } else { handleAddPaymentMethod(type as any) } }} className={`py-2 px-3 rounded-lg font-semibold transition-all ${isSelected ? 'bg-teal-600 text-white shadow-lg shadow-teal-500/50 border border-teal-400' : 'bg-white/10 text-gray-300 border border-white/10 hover:bg-white/20'}`}>
                                {typeText}
                              </button>
                            )
                          })}
                        </div>

                        <div className="space-y-2">
                          {paymentMethods.map((method, index) => {
                            const typeText = method.type === 'cash' ? 'Naqd' : method.type === 'click' ? 'Click' : 'Terminal'
                            const displayAmount = currency === 'UZS' ? (paymentState[`${method.type}_${index}`] || 0) : method.amount
                            return (
                              <div key={index} className="flex gap-2">
                                <label className="flex-1 text-sm text-gray-400 flex items-center">{typeText}:</label>
                                <input type="text" inputMode="decimal" value={displayAmount} onChange={(e) => { const value = e.target.value; if (value === '' || /^\d*\.?\d*$/.test(value)) { const numValue = value === '' ? 0 : parseFloat(value); setPaymentState({ ...paymentState, [`${method.type}_${index}`]: numValue }); const amountInUsd = currency === 'UZS' ? numValue / exchangeRate : numValue; handleUpdatePaymentAmount(index, amountInUsd) } }} className="w-32 bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder={currency === 'UZS' ? '0' : '0.00'} />
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-center">
                        <p className="text-gray-400 text-xs mb-1">❌ Qarz</p>
                        <p className="font-bold text-red-400 text-lg">
                          {currency === 'UZS' 
                            ? `${Math.floor(Math.max(0, finalDebt) * exchangeRate).toLocaleString('uz-UZ')} so'm` 
                            : `$${Math.max(0, finalDebt).toFixed(2)}`
                          }
                        </p>
                      </div>

                      <button onClick={handleCompleteSale} disabled={saleItems.length === 0 || paymentMethods.length === 0 || isSubmitting} className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white py-3 rounded-lg hover:shadow-lg hover:shadow-teal-500/50 transition disabled:opacity-50 font-semibold">
                        {isSubmitting ? 'Jarayonda...' : 'Savdo Yakunlash'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {showSuccess && (
          <div className="fixed bottom-4 right-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-green-500/50 animate-pulse z-50 backdrop-blur-sm border border-green-500/30">
            ✓ Savdo muvaffaqiyatli yakunlandi!
          </div>
        )}
      </div>
    </CashierLayout>
  )
}
