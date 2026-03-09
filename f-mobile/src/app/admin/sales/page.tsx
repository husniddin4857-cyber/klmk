'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/layouts/AdminLayout'
import { TrendingUp, DollarSign, Users } from 'lucide-react'
import { getSales } from '@/lib/api'

interface Sale {
  _id: string
  customer?: { name: string }
  branch?: { name: string }
  totalAmount: number
  items: Array<{ quantity: number }>
  createdAt: string
}

export default function SalesPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [sales, setSales] = useState<Sale[]>([])

  const fetchSales = async () => {
    setError(null)
    const response = await getSales()
    if (response.success && response.data) {
      setSales(response.data as Sale[])
    } else {
      setError(response.error || 'Savdolarni yuklashda xato')
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('adminToken')
      if (!token) {
        router.push('/')
      } else {
        fetchSales()
      }
    }
  }, [router])

  const totalSales = sales.reduce((sum, s) => sum + s.totalAmount, 0)
  const totalItems = sales.reduce((sum, s) => sum + s.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0)

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="bg-gradient-to-r from-cyan-600/20 to-blue-600/20 backdrop-blur-sm rounded-2xl p-6 border border-white/10 flex-1 mr-4">
            <h1 className="text-3xl font-black bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Savdolar</h1>
            <p className="text-gray-300 mt-1">Barcha filiallardan savdo qilish</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-cyan-600/20 to-cyan-700/20 backdrop-blur-sm rounded-2xl p-6 border border-cyan-500/30">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-cyan-300/70">Jami Savdolar</p>
              <DollarSign className="w-5 h-5 text-cyan-400" />
            </div>
            <p className="text-3xl font-black text-cyan-300">${(totalSales / 1000).toFixed(1)}K</p>
          </div>
          <div className="bg-gradient-to-br from-green-600/20 to-green-700/20 backdrop-blur-sm rounded-2xl p-6 border border-green-500/30">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-green-300/70">Tranzaksiyalar</p>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-3xl font-black text-green-300">{sales.length}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-600/20 to-purple-700/20 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-purple-300/70">Mahsulotlar</p>
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-3xl font-black text-purple-300">{totalItems}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Mijoz</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Filial</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Summa</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Mahsulotlar</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Sana</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <p className="text-gray-400">Savdolar topilmadi</p>
                    </td>
                  </tr>
                ) : (
                  sales.map((sale) => (
                    <tr key={sale._id} className="hover:bg-white/5 transition">
                      <td className="px-6 py-4 font-semibold text-white">{sale.customer?.name || 'Noma\'lum'}</td>
                      <td className="px-6 py-4 text-gray-300">{sale.branch?.name || '-'}</td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-cyan-300">${sale.totalAmount.toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{sale.items.length} ta</td>
                      <td className="px-6 py-4 text-gray-300">{new Date(sale.createdAt).toLocaleDateString('uz-UZ')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
