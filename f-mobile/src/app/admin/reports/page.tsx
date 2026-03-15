'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/layouts/AdminLayout'
import { Download, Calendar, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

interface ReportData {
  totalSales: number
  totalIncome: number
  totalExpenses: number
  profit: number
  totalTransactions: number
  averageTransaction: number
  topProducts: Array<{ name: string; quantity: number; revenue: number }>
  topCashiers: Array<{ name: string; sales: number; amount: number }>
}

export default function ReportsPage() {
  const router = useRouter()
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('adminToken')
      if (!token) {
        router.push('/')
      } else {
        fetchReports()
      }
    }
  }, [router, dateRange])

  const fetchReports = async () => {
    try {
      setLoading(true)
      setError(null)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'
      const token = localStorage.getItem('adminToken')
      
      const response = await fetch(
        `${apiUrl}/reports?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      )
      
      const data = await response.json()
      if (data.success) {
        setReportData(data.data)
      } else {
        setError(data.error || 'Hisobotlarni yuklashda xato')
      }
    } catch (err) {
      setError('Hisobotlarni yuklashda xato')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    if (!reportData) return
    
    const rows = [
      ['F-Mobile Hisoboti'],
      ['Sana:', new Date().toLocaleDateString('uz-UZ')],
      ['Sana oralig\'i:', `${dateRange.startDate} - ${dateRange.endDate}`],
      [],
      ['UMUMIY KO\'RSATKICH'],
      ['Jami Savdolar', `${reportData.totalSales.toFixed(2)}`],
      ['Jami Kirimlar', `${reportData.totalIncome.toFixed(2)}`],
      ['Jami Xarajatlar', `${reportData.totalExpenses.toFixed(2)}`],
      ['Foyda', `${reportData.profit.toFixed(2)}`],
      ['Tranzaksiyalar Soni', reportData.totalTransactions],
      ['O\'rtacha Tranzaksiya', `${reportData.averageTransaction.toFixed(2)}`],
      [],
      ['ENG KO\'P SOTILGAN MAHSULOTLAR'],
      ['Mahsulot', 'Miqdor', 'Daromad'],
      ...reportData.topProducts.map(p => [p.name, p.quantity, `${p.revenue.toFixed(2)}`]),
      [],
      ['ENG FAOL KASSIRLAR'],
      ['Kassir', 'Savdolar Soni', 'Jami Summa'],
      ...reportData.topCashiers.map(c => [c.name, c.sales, `${c.amount.toFixed(2)}`]),
    ]

    const csv = rows.map(row => 
      row.map(cell => {
        const str = String(cell)
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      }).join(',')
    ).join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `hisobot-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Hisobotlar yuklanimoqda...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="bg-gray-50 min-h-screen p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Hisobotlar</h1>
              <p className="text-gray-500 mt-1">Biznes analitikasi va statistikasi</p>
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
            >
              <Download size={18} /> CSV Yuklab Olish
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded">
              {error}
            </div>
          )}

          {/* Date Range Filter */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar size={20} className="text-blue-600" />
                <span className="text-gray-700 font-semibold">Sana oralig'i:</span>
              </div>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-400">-</span>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {reportData && (
            <>
              {/* Main KPI Cards - 4 Column */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Jami Savdolar */}
                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Jami Savdolar</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">${reportData.totalSales.toFixed(2)}</p>
                      <p className="text-xs text-gray-500 mt-2">Barcha savdolar</p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                {/* Jami Kirimlar */}
                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Jami Kirimlar</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">${reportData.totalIncome.toFixed(2)}</p>
                      <p className="text-xs text-gray-500 mt-2">Qo'shimcha kirimlar</p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>

                {/* Jami Xarajatlar */}
                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Jami Xarajatlar</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">${reportData.totalExpenses.toFixed(2)}</p>
                      <p className="text-xs text-gray-500 mt-2">Barcha xarajatlar</p>
                    </div>
                    <div className="bg-red-100 p-3 rounded-lg">
                      <TrendingDown className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                </div>

                {/* Foyda */}
                <div className={`bg-white rounded-lg shadow p-6 border-l-4 ${reportData.profit >= 0 ? 'border-purple-500' : 'border-orange-500'} hover:shadow-lg transition-shadow`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Foyda</p>
                      <p className={`text-3xl font-bold mt-2 ${reportData.profit >= 0 ? 'text-purple-600' : 'text-orange-600'}`}>
                        ${reportData.profit.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">{reportData.profit >= 0 ? 'Musbat' : 'Manfiy'}</p>
                    </div>
                    <div className={`${reportData.profit >= 0 ? 'bg-purple-100' : 'bg-orange-100'} p-3 rounded-lg`}>
                      <DollarSign className={`w-6 h-6 ${reportData.profit >= 0 ? 'text-purple-600' : 'text-orange-600'}`} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Secondary Stats - 3 Column */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                  <p className="text-gray-600 text-sm font-medium">Jami Tranzaksiyalar</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{reportData.totalTransactions}</p>
                  <div className="mt-4 bg-yellow-100 rounded-full h-2 w-full"></div>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                  <p className="text-gray-600 text-sm font-medium">O'rtacha Tranzaksiya</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">${reportData.averageTransaction.toFixed(2)}</p>
                  <div className="mt-4 bg-cyan-100 rounded-full h-2 w-full"></div>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                  <p className="text-gray-600 text-sm font-medium">Foyda Foizi</p>
                  <p className={`text-3xl font-bold mt-2 ${reportData.totalSales > 0 && ((reportData.profit / reportData.totalSales) * 100) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {reportData.totalSales > 0 ? ((reportData.profit / reportData.totalSales) * 100).toFixed(1) : '0.0'}%
                  </p>
                  <div className="mt-4 bg-pink-100 rounded-full h-2 w-full"></div>
                </div>
              </div>

              {/* Charts Section - 2 Column */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Products Chart */}
                {reportData.topProducts && reportData.topProducts.length > 0 && (
                  <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Eng Ko'p Sotilgan Mahsulotlar</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={reportData.topProducts}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" stroke="#6b7280" angle={-45} textAnchor="end" height={80} />
                        <YAxis stroke="#6b7280" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                          labelStyle={{ color: '#111827' }}
                        />
                        <Bar dataKey="quantity" fill="#10b981" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Top Cashiers Chart */}
                {reportData.topCashiers && reportData.topCashiers.length > 0 && (
                  <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Eng Faol Kassirlar</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={reportData.topCashiers} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis type="number" stroke="#6b7280" />
                        <YAxis dataKey="name" type="category" stroke="#6b7280" width={100} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                          labelStyle={{ color: '#111827' }}
                        />
                        <Bar dataKey="amount" fill="#3b82f6" radius={[0, 8, 8, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Data Tables - 2 Column */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Products Table */}
                {reportData.topProducts && reportData.topProducts.length > 0 && (
                  <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                      <h3 className="text-lg font-bold text-gray-900">Mahsulotlar Jadval</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Mahsulot</th>
                            <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Miqdor</th>
                            <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Daromad</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.topProducts.map((product, idx) => (
                            <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 text-sm text-gray-900">{product.name}</td>
                              <td className="px-6 py-4 text-sm text-right text-gray-600">{product.quantity}</td>
                              <td className="px-6 py-4 text-sm text-right font-semibold text-green-600">${product.revenue.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Top Cashiers Table */}
                {reportData.topCashiers && reportData.topCashiers.length > 0 && (
                  <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                      <h3 className="text-lg font-bold text-gray-900">Kassirlar Jadval</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Kassir</th>
                            <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Savdolar</th>
                            <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Jami Summa</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.topCashiers.map((cashier, idx) => (
                            <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 text-sm text-gray-900">{cashier.name}</td>
                              <td className="px-6 py-4 text-sm text-right text-gray-600">{cashier.sales}</td>
                              <td className="px-6 py-4 text-sm text-right font-semibold text-blue-600">${cashier.amount.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Summary Section */}
              <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Xulosa</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
                    <p className="text-gray-600 text-sm mb-2">Xarajat Foizi</p>
                    <p className="text-2xl font-bold text-red-600">
                      {reportData.totalSales > 0 ? ((reportData.totalExpenses / reportData.totalSales) * 100).toFixed(1) : '0.0'}%
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                    <p className="text-gray-600 text-sm mb-2">Kirim Foizi</p>
                    <p className="text-2xl font-bold text-green-600">
                      {reportData.totalSales > 0 ? ((reportData.totalIncome / reportData.totalSales) * 100).toFixed(1) : '0.0'}%
                    </p>
                  </div>
                  <div className={`bg-gradient-to-br ${reportData.profit >= 0 ? 'from-purple-50 to-purple-100' : 'from-orange-50 to-orange-100'} rounded-lg p-4 border ${reportData.profit >= 0 ? 'border-purple-200' : 'border-orange-200'}`}>
                    <p className="text-gray-600 text-sm mb-2">Neto Foyda</p>
                    <p className={`text-2xl font-bold ${reportData.profit >= 0 ? 'text-purple-600' : 'text-orange-600'}`}>
                      ${reportData.profit.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                    <p className="text-gray-600 text-sm mb-2">Sana Oralig'i</p>
                    <p className="text-sm font-bold text-blue-600">
                      {dateRange.startDate} - {dateRange.endDate}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
