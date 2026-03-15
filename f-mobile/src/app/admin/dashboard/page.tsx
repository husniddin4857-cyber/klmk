'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/layouts/AdminLayout'
import { Users, Store, DollarSign, TrendingUp, Calendar } from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

interface AnalyticsData {
  salesByDay: Array<{ date: string; sales: number; transactions: number }>
  topProducts: Array<{ name: string; quantity: number; revenue: number }>
  salesByBranch: Array<{ name: string; sales: number; transactions: number }>
  salesByCashier: Array<{ name: string; sales: number; transactions: number }>
  totalStats: { totalRevenue: number; totalTransactions: number; averageTransaction: number }
}

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState({
    totalBranches: 0,
    totalCashiers: 0,
    totalInventoryValue: 0,
    totalCustomers: 0,
  })
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [currency, setCurrency] = useState<'USD' | 'UZS'>('USD')
  const [exchangeRate, setExchangeRate] = useState(12500)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('adminToken')
      if (!token) {
        router.push('/')
      } else {
        fetchDashboardData()
        fetchExchangeRate()
      }
    }
  }, [router, selectedDate])

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

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'
      const token = localStorage.getItem('adminToken')
      
      // Fetch all data using public endpoints
      const [branchesRes, cashiersRes, productsRes, customersRes, analyticsRes] = await Promise.all([
        fetch(`${apiUrl}/branches/public/all`),
        fetch(`${apiUrl}/cashiers/public/all`),
        fetch(`${apiUrl}/products/public/all`),
        fetch(`${apiUrl}/customers/public/all`),
        fetch(`${apiUrl}/analytics/dashboard`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      const branchesJson = await branchesRes.json()
      const cashiersJson = await cashiersRes.json()
      const productsJson = await productsRes.json()
      const customersJson = await customersRes.json()
      const analyticsJson = await analyticsRes.json()

      // Extract data arrays
      const branchesData = branchesJson.data || branchesJson || []
      const cashiersData = cashiersJson.data || cashiersJson || []
      const productsData = productsJson.data || productsJson || []
      const customersData = customersJson.data || customersJson || []

      // Calculate total inventory value - only count available stock (not used IMEIs)
      const totalInventoryValue = Array.isArray(productsData) 
        ? productsData.reduce((sum, product) => {
            let availableStock = product.stock || 0
            if (product.imeiList && product.imeiList.length > 0) {
              availableStock = product.imeiList.filter((item: any) => !item.used).length
            }
            return sum + (product.sellPrice * availableStock)
          }, 0)
        : 0

      setStats({
        totalBranches: Array.isArray(branchesData) ? branchesData.length : 0,
        totalCashiers: Array.isArray(cashiersData) ? cashiersData.length : 0,
        totalInventoryValue: totalInventoryValue,
        totalCustomers: Array.isArray(customersData) ? customersData.length : 0,
      })

      if (analyticsJson.success) {
        setAnalytics(analyticsJson.data)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Ma'lumotlar yuklanimoqda...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 backdrop-blur-sm rounded-2xl p-8 border border-white/10 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">Dashboard</h1>
            <p className="text-gray-300">Xush kelibsiz, Admin! Tizimning umumiy ko'rinishi</p>
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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-600/20 to-blue-700/20 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/30 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-300">Jami Filiallar</h3>
              <Store className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-3xl font-black text-blue-300 mb-2">{stats.totalBranches}</p>
            <p className="text-xs text-blue-300/70">Faol filiallar</p>
          </div>

          <div className="bg-gradient-to-br from-green-600/20 to-green-700/20 backdrop-blur-sm rounded-2xl p-6 border border-green-500/30 hover:border-green-500/50 transition-all hover:shadow-lg hover:shadow-green-500/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-300">Jami Kassirlar</h3>
              <Users className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-3xl font-black text-green-300 mb-2">{stats.totalCashiers}</p>
            <p className="text-xs text-green-300/70">Faol kassirlar</p>
          </div>

          <div className="bg-gradient-to-br from-purple-600/20 to-purple-700/20 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30 hover:border-purple-500/50 transition-all hover:shadow-lg hover:shadow-purple-500/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-300">Jami Summa</h3>
              <DollarSign className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-3xl font-black text-purple-300 mb-2">{formatPrice(convertPrice(stats.totalInventoryValue))}</p>
            <p className="text-xs text-purple-300/70">Barcha mahsulotlar narxi</p>
          </div>

          <div className="bg-gradient-to-br from-red-600/20 to-red-700/20 backdrop-blur-sm rounded-2xl p-6 border border-red-500/30 hover:border-red-500/50 transition-all hover:shadow-lg hover:shadow-red-500/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-300">Jami Mijozlar</h3>
              <Users className="w-5 h-5 text-red-400" />
            </div>
            <p className="text-3xl font-black text-red-300 mb-2">{stats.totalCustomers}</p>
            <p className="text-xs text-red-300/70">Ro'yxatda</p>
          </div>
        </div>

        {/* Analytics Section */}
        {analytics && (
          <>
            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sales by Day */}
              <div className="bg-slate-800/50 border border-white/10 rounded-lg p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp size={18} className="text-blue-400" />
                  Savdolar (Oxirgi 7 kun)
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.salesByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                    <XAxis dataKey="date" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Top Products */}
              <div className="bg-slate-800/50 border border-white/10 rounded-lg p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp size={18} className="text-green-400" />
                  Top Mahsulotlar
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.topProducts}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                    <XAxis dataKey="name" stroke="#9ca3af" angle={-45} textAnchor="end" height={80} />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="revenue" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Sales by Branch */}
              <div className="bg-slate-800/50 border border-white/10 rounded-lg p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Store size={18} className="text-orange-400" />
                  Filiallar bo'yicha Savdolar
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.salesByBranch}
                      dataKey="sales"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {analytics.salesByBranch.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }}
                      labelStyle={{ color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Sales by Cashier */}
              <div className="bg-slate-800/50 border border-white/10 rounded-lg p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Users size={18} className="text-pink-400" />
                  Kassirlar bo'yicha Savdolar
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.salesByCashier} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                    <XAxis type="number" stroke="#9ca3af" />
                    <YAxis dataKey="name" type="category" stroke="#9ca3af" width={100} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="sales" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
