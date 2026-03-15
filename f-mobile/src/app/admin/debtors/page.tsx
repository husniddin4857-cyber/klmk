'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/layouts/AdminLayout'
import { DollarSign, Phone, TrendingUp, Search, ChevronDown } from 'lucide-react'

interface DebtItem {
  product?: { name: string; _id: string }
  quantity: number
  salePrice: number
  total: number
}

interface Debt {
  _id: string
  customer?: { name: string; phone?: string }
  branch?: { name: string; _id: string }
  totalDebt: number
  items: DebtItem[]
  createdAt: string
  dueDate?: string
}

interface Branch {
  _id: string
  name: string
}

export default function DebtorsPage() {
  const router = useRouter()
  const [debts, setDebts] = useState<Debt[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBranch, setSelectedBranch] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedDebtId, setExpandedDebtId] = useState<string | null>(null)
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

      if (branchesData.success && Array.isArray(branchesData.data)) {
        setBranches(branchesData.data)
      }

      if (salesData.success && Array.isArray(salesData.data)) {
        // Filter only sales with debt
        const debtSales = salesData.data.filter((sale: any) => {
          const hasDebt = sale.paymentMethods?.some((method: any) => method.type === 'debt' && method.amount > 0)
          return hasDebt
        })

        // Group by customer and sum debts
        const debtMap = new Map<string, Debt>()
        debtSales.forEach((sale: any) => {
          const customerId = sale.customer?._id || 'unknown'
          const debtAmount = sale.paymentMethods?.find((m: any) => m.type === 'debt')?.amount || 0

          if (debtAmount > 0) {
            if (!debtMap.has(customerId)) {
              debtMap.set(customerId, {
                _id: customerId,
                customer: sale.customer,
                branch: sale.branch,
                totalDebt: 0,
                items: [],
                createdAt: sale.createdAt,
              })
            }

            const debt = debtMap.get(customerId)!
            debt.totalDebt += debtAmount
            debt.items.push(...(sale.items || []))
          }
        })

        setDebts(Array.from(debtMap.values()))
      }
    } catch (err) {
      setError('Ma\'lumotlarni yuklashda xato')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filteredDebts = debts.filter(debt => {
    const branchMatch = selectedBranch === 'all' || debt.branch?._id === selectedBranch
    const searchMatch = 
      debt.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      debt.customer?.phone?.includes(searchTerm)
    return branchMatch && searchMatch
  })

  const totalDebt = filteredDebts.reduce((sum, d) => sum + d.totalDebt, 0)
  const totalDebtors = filteredDebts.length

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Qarzdorlar ma\'lumotlari yuklanimoqda...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Qarzdorlar</h1>
            <p className="text-gray-400 mt-1">Qarz bilan sotilgan mahsulotlar</p>
          </div>
          {/* Currency Selector */}
          <div className="flex gap-2 bg-white/10 border border-white/20 rounded-lg p-1">
            <button
              onClick={() => setCurrency('USD')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                currency === 'USD'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-500/50'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              $
            </button>
            <button
              onClick={() => setCurrency('UZS')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                currency === 'UZS'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-500/50'
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
          <div className="bg-gradient-to-br from-red-500/20 to-orange-600/20 border border-red-500/30 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Jami Qarz</p>
                <p className="text-3xl font-bold text-red-400 mt-2">{formatPrice(convertPrice(totalDebt))}</p>
              </div>
              <DollarSign size={32} className="text-red-500 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500/20 to-yellow-600/20 border border-orange-500/30 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Qarzdorlar Soni</p>
                <p className="text-3xl font-bold text-orange-400 mt-2">{totalDebtors}</p>
              </div>
              <TrendingUp size={32} className="text-orange-500 opacity-50" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-800/50 border border-white/10 rounded-lg p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-gray-300 text-sm font-medium mb-2">Qidirish</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Ism yoki telefon raqami..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-gray-300 text-sm font-medium mb-2">Filial</label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full bg-slate-700/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500"
              >
                <option value="all">Barcha Filiallar</option>
                {branches.map(b => (
                  <option key={b._id} value={b._id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Debtors List */}
        <div className="bg-slate-800/50 border border-white/10 rounded-lg overflow-hidden">
          {filteredDebts.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              Qarzdor topilmadi
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {filteredDebts.map(debt => (
                <div key={debt._id} className="p-4 hover:bg-white/5 transition">
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedDebtId(expandedDebtId === debt._id ? null : debt._id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="text-white font-semibold">{debt.customer?.name || 'Noma\'lum'}</p>
                        <span className="text-xs bg-blue-500/30 text-blue-300 px-2 py-1 rounded">
                          {debt.branch?.name || 'Filial yo\'q'}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm">
                        {new Date(debt.createdAt).toLocaleDateString('uz-UZ')}
                      </p>
                    </div>
                    <div className="text-right mr-4">
                      <p className="text-red-400 font-bold">{formatPrice(convertPrice(debt.totalDebt))}</p>
                      <p className="text-gray-400 text-sm">{debt.items?.length || 0} mahsulot</p>
                    </div>
                    <ChevronDown
                      size={20}
                      className={`text-gray-400 transition-transform ${expandedDebtId === debt._id ? 'rotate-180' : ''}`}
                    />
                  </div>

                  {expandedDebtId === debt._id && (
                    <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Mijoz Ismi</p>
                          <p className="text-white font-semibold">{debt.customer?.name || '-'}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Telefon</p>
                          <p className="text-white font-semibold">{debt.customer?.phone || '-'}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Filial</p>
                          <p className="text-white font-semibold">{debt.branch?.name || '-'}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Sana</p>
                          <p className="text-white font-semibold">
                            {new Date(debt.createdAt).toLocaleDateString('uz-UZ')}
                          </p>
                        </div>
                      </div>

                      {debt.items && debt.items.length > 0 && (
                        <div className="pt-3 border-t border-white/10">
                          <p className="text-gray-300 font-semibold text-sm mb-2">Mahsulotlar</p>
                          <div className="space-y-2">
                            {debt.items.map((item, idx) => (
                              <div key={idx} className="bg-white/5 p-2 rounded text-sm">
                                <div className="flex justify-between mb-1">
                                  <span className="text-gray-300">{item.product?.name || 'Unknown'} x{item.quantity}</span>
                                  <span className="text-red-400 font-semibold">{formatPrice(convertPrice(item.total))}</span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-400">
                                  <span>Narx: {formatPrice(convertPrice(item.salePrice || 0))}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="pt-3 border-t border-white/10 bg-white/5 p-3 rounded">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Jami Qarz</span>
                          <span className="text-red-400 font-bold">{formatPrice(convertPrice(debt.totalDebt))}</span>
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
