'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import CashierLayout from '@/components/layouts/CashierLayout'
import { BarChart3, TrendingUp } from 'lucide-react'
import { getSales } from '@/lib/api'

interface Sale {
  totalAmount: number
  createdAt: string
}

export default function ReportsPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalSales: 0,
    totalTransactions: 0,
    avgTransaction: 0,
    todaySales: 0,
  })

  const fetchReports = async () => {
    setError(null)
    
    const response = await getSales()
    if (response.success && response.data) {
      const sales = response.data as Sale[]
      const totalSales = sales.reduce((sum: number, sale: Sale) => sum + sale.totalAmount, 0)
      
      // Calculate today's sales
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const todaysSales = sales.filter((sale: Sale) => {
        const saleDate = new Date(sale.createdAt)
        saleDate.setHours(0, 0, 0, 0)
        return saleDate.getTime() === today.getTime()
      })
      
      const todayTotal = todaysSales.reduce((sum: number, sale: Sale) => sum + sale.totalAmount, 0)
      
      setStats({
        totalSales,
        totalTransactions: sales.length,
        avgTransaction: sales.length > 0 ? totalSales / sales.length : 0,
        todaySales: todayTotal,
      })
    } else {
      setError(response.error || 'Ma\'lumotlarni yuklashda xato')
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('cashierToken')
      if (!token) {
        router.push('/')
      } else {
        fetchReports()
      }
    }
  }, [router])

  return (
    <CashierLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hisobotlar</h1>
          <p className="text-gray-600">Shaxsiy savdo hisobotlari va statistikasi</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <p className="text-gray-600 text-sm font-medium">Bugungi Savdolar</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">${stats.todaySales.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <p className="text-gray-600 text-sm font-medium">Jami Savdolar</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">${stats.totalSales.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
            <p className="text-gray-600 text-sm font-medium">Tranzaksiyalar</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalTransactions}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
            <p className="text-gray-600 text-sm font-medium">O'rtacha Chek</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">${stats.avgTransaction.toFixed(2)}</p>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <BarChart3 size={24} className="text-blue-600" />
              Savdo Statistikasi
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Jami Savdolar</span>
                <span className="font-bold text-gray-900">${stats.totalSales.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Tranzaksiyalar</span>
                <span className="font-bold text-gray-900">{stats.totalTransactions}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">O'rtacha Chek</span>
                <span className="font-bold text-gray-900">${stats.avgTransaction.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp size={24} className="text-green-600" />
              Bugungi Statistika
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Bugungi Savdolar</span>
                <span className="font-bold text-gray-900">${stats.todaySales.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Sana</span>
                <span className="font-bold text-gray-900">{new Date().toLocaleDateString('uz-UZ')}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Vaqt</span>
                <span className="font-bold text-gray-900">{new Date().toLocaleTimeString('uz-UZ')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CashierLayout>
  )
}
