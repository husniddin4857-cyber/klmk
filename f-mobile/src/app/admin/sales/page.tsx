'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/layouts/AdminLayout'
import { DollarSign, Users, ShoppingCart } from 'lucide-react'

interface SaleItem {
  product?: { name: string; _id: string }
  quantity: number
  originalPrice: number
  salePrice: number
  total: number
  imei?: string
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
  createdAt: string
  status: string
}

interface Branch {
  _id: string
  name: string
}

export default function SalesPage() {
  const router = useRouter()
  const [sales, setSales] = useState<Sale[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedBranch, setSelectedBranch] = useState('all')
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null)
  const [currency, setCurrency] = useState<'USD' | 'UZS'>('USD')
  const [exchangeRate, setExchangeRate] = useState(12500)

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    setSelectedDate(today)
    
    const token = localStorage.getItem('adminToken')
    if (!token) {
      router.push('/')
      return
    }

    loadData()
    fetchExchangeRate()
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

  const loadData = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'
      const token = localStorage.getItem('adminToken')

      const [salesRes, branchesRes] = await Promise.all([
        fetch(`${apiUrl}/sales`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
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
    const saleDate = new Date(sale.createdAt).toISOString().split('T')[0]
    const dateMatch = saleDate === selectedDate
    const branchMatch = selectedBranch === 'all' || sale.branch?._id === selectedBranch
    return dateMatch && branchMatch
  })

  const totalAmount = filteredSales.reduce((sum, s) => sum + s.totalAmount, 0)
  const totalCount = filteredSales.length
  const totalItems = filteredSales.reduce((sum, s) => sum + (s.items?.length || 0), 0)

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Yuklanimoqda...</p>
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
            <h1 className="text-3xl font-bold text-white">Savdolar</h1>
            <p className="text-gray-400 mt-1">Kunlik savdo qilish ma'lumotlari</p>
          </div>
          {/* Currency Selector */}
          <div className="flex gap-2 bg-white/10 border border-white/20 rounded-lg p-1">
            <button
              onClick={() => setCurrency('USD')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                currency === 'USD'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              $
            </button>
            <button
              onClick={() => setCurrency('UZS')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                currency === 'UZS'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              So'm
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-600/20 border border-blue-500/30 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Jami Savdolar</p>
                <p className="text-3xl font-bold text-blue-400 mt-2">{formatPrice(convertPrice(totalAmount))}</p>
              </div>
              <DollarSign size={32} className="text-blue-500 opacity-50" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-500/30 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Tranzaksiyalar</p>
                <p className="text-3xl font-bold text-green-400 mt-2">{totalCount}</p>
              </div>
              <ShoppingCart size={32} className="text-green-500 opacity-50" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 border border-purple-500/30 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Mahsulotlar</p>
                <p className="text-3xl font-bold text-purple-400 mt-2">{totalItems}</p>
              </div>
              <Users size={32} className="text-purple-500 opacity-50" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-800/50 border border-white/10 rounded-lg p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-gray-300 text-sm font-medium mb-2">Sana</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-slate-700/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-gray-300 text-sm font-medium mb-2">Filial</label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full bg-slate-700/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">Barcha Filiallar</option>
                {branches.map(b => (
                  <option key={b._id} value={b._id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-4 rounded-lg">
            {error}
          </div>
        )}

        {/* Sales Table */}
        <div className="bg-slate-800/50 border border-white/10 rounded-lg overflow-hidden">
          {filteredSales.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              Savdolar topilmadi
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 bg-slate-900/50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Mijoz</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Kassir</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Filial</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Mahsulotlar</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Jami</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">To'langan</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Soat</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map(sale => (
                    <>
                      <tr key={sale._id} className="border-b border-white/5 hover:bg-white/5 transition cursor-pointer" onClick={() => setExpandedSaleId(expandedSaleId === sale._id ? null : sale._id)}>
                        <td className="px-6 py-4 text-sm text-white">{sale.customer?.name || 'Noma\'lum'}</td>
                        <td className="px-6 py-4 text-sm text-gray-300">{sale.cashier?.username || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-300">{sale.branch?.name || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-300">{sale.items?.length || 0} ta</td>
                        <td className="px-6 py-4 text-sm text-right text-green-400 font-semibold">{formatPrice(convertPrice(sale.totalAmount))}</td>
                        <td className="px-6 py-4 text-sm text-right text-cyan-400 font-semibold">{formatPrice(convertPrice(sale.paidAmount))}</td>
                        <td className="px-6 py-4 text-sm text-right text-gray-400">{new Date(sale.createdAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</td>
                      </tr>
                      {expandedSaleId === sale._id && (
                        <tr className="bg-slate-900/30 border-b border-white/5">
                          <td colSpan={7} className="px-6 py-4">
                            <div className="space-y-2">
                              <h4 className="font-semibold text-white mb-3">Mahsulotlar:</h4>
                              {sale.items?.map((item, idx) => (
                                <div key={idx} className="bg-slate-800/50 rounded p-3 text-sm">
                                  <div className="flex justify-between items-start mb-2">
                                    <span className="text-white font-medium">{item.product?.name || 'Noma\'lum'}</span>
                                    <span className="text-gray-400">x{item.quantity}</span>
                                  </div>
                                  {item.imei && (
                                    <div className="mb-2 p-2 bg-blue-500/20 border border-blue-500/30 rounded">
                                      <p className="text-xs text-gray-400">IMEKA:</p>
                                      <p className="text-xs font-mono text-blue-300">{item.imei}</p>
                                    </div>
                                  )}
                                  <div className="grid grid-cols-3 gap-4 text-xs">
                                    <div>
                                      <span className="text-gray-400">Katalog narxi:</span>
                                      <p className="text-cyan-400 font-semibold">{formatPrice(convertPrice(item.originalPrice || 0))}</p>
                                    </div>
                                    <div>
                                      <span className="text-gray-400">Sotilgan narxi:</span>
                                      <p className="text-green-400 font-semibold">{formatPrice(convertPrice(item.salePrice || 0))}</p>
                                    </div>
                                    <div>
                                      <span className="text-gray-400">Jami:</span>
                                      <p className="text-teal-400 font-semibold">{formatPrice(convertPrice(item.total || 0))}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
