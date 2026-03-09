'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/layouts/AdminLayout'
import { Users, Store, DollarSign } from 'lucide-react'

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState({
    totalBranches: 0,
    totalCashiers: 0,
    totalInventoryValue: 0,
    totalCustomers: 0,
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('adminToken')
      if (!token) {
        router.push('/')
      } else {
        fetchDashboardData()
      }
    }
  }, [router])

  const fetchDashboardData = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'
      
      // Fetch all data using public endpoints
      const [branchesRes, cashiersRes, productsRes, customersRes] = await Promise.all([
        fetch(`${apiUrl}/branches/public/all`),
        fetch(`${apiUrl}/cashiers/public/all`),
        fetch(`${apiUrl}/products/public/all`),
        fetch(`${apiUrl}/customers/public/all`)
      ])

      const branchesJson = await branchesRes.json()
      const cashiersJson = await cashiersRes.json()
      const productsJson = await productsRes.json()
      const customersJson = await customersRes.json()

      // Extract data arrays (API returns {success, data})
      const branchesData = branchesJson.data || branchesJson || []
      const cashiersData = cashiersJson.data || cashiersJson || []
      const productsData = productsJson.data || productsJson || []
      const customersData = customersJson.data || customersJson || []

      console.log('Dashboard data:', { branchesData, cashiersData, productsData, customersData })

      // Calculate total inventory value (sum of all product sell prices)
      const totalInventoryValue = Array.isArray(productsData) 
        ? productsData.reduce((sum, product) => {
            const value = product.sellPrice || 0
            console.log(`Product: ${product.name}, Price: ${product.sellPrice}, Running Total: ${sum + value}`)
            return sum + value
          }, 0)
        : 0

      console.log('Total Inventory Value:', totalInventoryValue)

      setStats({
        totalBranches: Array.isArray(branchesData) ? branchesData.length : 0,
        totalCashiers: Array.isArray(cashiersData) ? cashiersData.length : 0,
        totalInventoryValue: totalInventoryValue,
        totalCustomers: Array.isArray(customersData) ? customersData.length : 0,
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
          <h1 className="text-4xl font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">Dashboard</h1>
          <p className="text-gray-300">Xush kelibsiz, Admin! Tizimning umumiy ko'rinishi</p>
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
            <p className="text-3xl font-black text-purple-300 mb-2">${(stats.totalInventoryValue / 1000).toFixed(1)}K</p>
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


      </div>
    </AdminLayout>
  )
}
