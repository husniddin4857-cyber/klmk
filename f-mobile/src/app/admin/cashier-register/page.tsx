'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/layouts/AdminLayout'
import { DollarSign, TrendingUp, Calendar, ChevronDown } from 'lucide-react'

interface SaleItem {
  product?: { name: string; _id: string }
  quantity: number
  originalPrice: number
  salePrice: number
  total: number
  imei?: string
}

interface PaymentMethod {
  type: 'cash' | 'debt' | 'click' | 'terminal'
  amount: number
}

interface Sale {
  _id: string
  customer?: { name: string; phone?: string }
  branch?: { name: string; _id: string }
  cashier?: { username: string }
  totalAmount: number
  paidAmount: number
  change: number
  items: SaleItem[]
  paymentMethods?: PaymentMethod[]
  createdAt: string
  status: string
  notes?: string
}

interface Branch {
  _id: string
  name: string
}

export default function CashierRegisterPage() {
  const router = useRouter()
  const [sales, setSales] = useState<Sale[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBranch, setSelectedBranch] = useState('all')
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null)
  const [currency, setCurrency] = useState<'USD' | 'UZS'>('USD')
  const [exchangeRate, setExchangeRate] = useState(12500)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('adminToken')
      if (!token) {
        router.push('/')
      } else {
        fetchData()
        fetchExchangeRate()
      }
    }
  }, [router])

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
    }
  }

  const convertPrice = (priceInUsd: number): number => {
    if (currency === 'USD') return priceInUsd
    return priceInUsd * exchangeRate
  }

  const formatPrice = (price: number): string => {
    if (currency === 'USD') return `$${price.toFixed(2)}`
    return `${Math.floor(price).toLocaleString('uz-UZ')} so'm`
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'
      const token = localStorage.getItem('adminToken')

      const [salesRes, branchesRes] = await Promise.all([
        fetch(
          `${apiUrl}/sales`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        ),
        fetch(`${apiUrl}/branches`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      const salesData = await salesRes.json()
      const branchesData = await branchesRes.json()

      if (salesData.success && Array.isArray(salesData.data)) {
        setSales(salesData.data)
      }
      if (branchesData.success && Array.isArray(branchesData.data)) {
        setBranches(branchesData.data)
      }
    } catch (err) {
      setError('Ma\'lumotlarni yuklashda xato')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filteredSales = sales.filter(sale => {
    const branchMatch = selectedBranch === 'all' || sale.branch?._id === selectedBranch
    return branchMatch
  })

  // Calculate total cash (only cash, terminal, click - NOT debt)
  const totalCash = filteredSales.reduce((sum, s) => {
    const cashAmount = s.paymentMethods?.reduce((methodSum, method) => {
      if (method.type === 'cash' || method.type === 'terminal' || method.type === 'click') {
        return methodSum + method.amount
      }
      return methodSum
    }, 0) || 0
    return sum + cashAmount
  }, 0)
  
  const totalTransactions = filteredSales.length

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Kassa ma\'lumotlari yuklanimoqda...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Kassa Registri</h1>
            <p className="text-gray-400 mt-1">Barcha savdo tranzaksiyalari</p>
          </div>
          {/* Currency Selector */}
          <div className="flex gap-2 bg-white/10 border border-white/20 rounded-lg p-1">
            <button
              onClick={() => setCurrency('USD')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                currency === 'USD'
                  ? 'bg-green-600 text-white shadow-lg shadow-green-500/50'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              $
            </button>
            <button
              onClick={() => setCurrency('UZS')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                currency === 'UZS'
                  ? 'bg-green-600 text-white shadow-lg shadow-green-500/50'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              So'm
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-4 rounded-lg">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-500/30 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Jami Kassa</p>
                <p className="text-3xl font-bold text-green-400 mt-2">{formatPrice(convertPrice(totalCash))}</p>
              </div>
              <DollarSign size={32} className="text-green-500 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-600/20 border border-blue-500/30 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Tranzaksiyalar</p>
                <p className="text-3xl font-bold text-blue-400 mt-2">{totalTransactions}</p>
              </div>
              <TrendingUp size={32} className="text-blue-500 opacity-50" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-800/50 border border-white/10 rounded-lg p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-gray-300 text-sm font-medium mb-2">Filial</label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full bg-slate-700/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
              >
                <option value="all">Barcha Filiallar</option>
                {branches.map(b => (
                  <option key={b._id} value={b._id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Sales List */}
        <div className="bg-slate-800/50 border border-white/10 rounded-lg overflow-hidden">
          {filteredSales.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              Savdolar topilmadi
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {filteredSales.map(sale => (
                <div key={sale._id} className="p-4 hover:bg-white/5 transition">
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedSaleId(expandedSaleId === sale._id ? null : sale._id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="text-white font-semibold">{sale.cashier?.username || 'Noma\'lum'}</p>
                        <span className="text-xs bg-blue-500/30 text-blue-300 px-2 py-1 rounded">
                          {sale.notes === 'Ko\'chaga sotuv' ? 'Ko\'chaga sotuv' : (sale.customer?.name || 'Noma\'lum')}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm">
                        {new Date(sale.createdAt).toLocaleDateString('uz-UZ')} {new Date(sale.createdAt).toLocaleTimeString('uz-UZ')}
                      </p>
                    </div>
                    <div className="text-right mr-4">
                      <p className="text-green-400 font-bold">{formatPrice(convertPrice(sale.paidAmount))}</p>
                      <p className="text-gray-400 text-sm">{sale.items?.length || 0} mahsulot</p>
                    </div>
                    <ChevronDown
                      size={20}
                      className={`text-gray-400 transition-transform ${expandedSaleId === sale._id ? 'rotate-180' : ''}`}
                    />
                  </div>

                  {expandedSaleId === sale._id && (
                    <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Kassir</p>
                          <p className="text-white font-semibold">{sale.cashier?.username || '-'}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Filial</p>
                          <p className="text-white font-semibold">{sale.branch?.name || '-'}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Mijoz</p>
                          <p className="text-white font-semibold">
                            {sale.notes === 'Ko\'chaga sotuv' ? 'Ko\'chaga sotuv' : (sale.customer?.name || 'Noma\'lum')}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">Sana va Vaqt</p>
                          <p className="text-white font-semibold">
                            {new Date(sale.createdAt).toLocaleDateString('uz-UZ')} {new Date(sale.createdAt).toLocaleTimeString('uz-UZ')}
                          </p>
                        </div>
                      </div>

                      {sale.items && sale.items.length > 0 && (
                        <div className="pt-3 border-t border-white/10">
                          <p className="text-gray-300 font-semibold text-sm mb-2">Mahsulotlar</p>
                          <div className="space-y-2">
                            {sale.items.map((item, idx) => (
                              <div key={idx} className="bg-white/5 p-2 rounded text-sm">
                                <div className="flex justify-between mb-1">
                                  <span className="text-gray-300">{item.product?.name || 'Unknown'} x{item.quantity}</span>
                                  <span className="text-green-400 font-semibold">{formatPrice(convertPrice(item.total))}</span>
                                </div>
                                {item.imei && (
                                  <div className="text-xs text-blue-300 bg-blue-500/20 border border-blue-500/30 rounded p-1 mb-1">
                                    IMEKA: {item.imei}
                                  </div>
                                )}
                                <div className="flex justify-between text-xs text-gray-400">
                                  <span>Katalog: {formatPrice(convertPrice(item.originalPrice))}</span>
                                  <span>Sotilgan: {formatPrice(convertPrice(item.salePrice))}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {sale.paymentMethods && sale.paymentMethods.length > 0 && (
                        <div className="pt-3 border-t border-white/10">
                          <p className="text-gray-300 font-semibold text-sm mb-2">Tolov Turlari</p>
                          <div className="space-y-1">
                            {sale.paymentMethods.map((method, idx) => {
                              const typeText = method.type === 'cash' ? 'Naqd' : method.type === 'debt' ? 'Qarz' : method.type === 'click' ? 'Click' : 'Terminal'
                              return (
                                <div key={idx} className="flex justify-between text-sm text-gray-300 bg-white/5 p-2 rounded">
                                  <span>{typeText}</span>
                                  <span className="text-cyan-400">{formatPrice(convertPrice(method.amount))}</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      <div className="pt-3 border-t border-white/10 bg-white/5 p-3 rounded">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-400">Jami Summa</span>
                          <span className="text-white font-bold">{formatPrice(convertPrice(sale.totalAmount))}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">To'langan</span>
                          <span className="text-green-400 font-bold">{formatPrice(convertPrice(sale.paidAmount))}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
