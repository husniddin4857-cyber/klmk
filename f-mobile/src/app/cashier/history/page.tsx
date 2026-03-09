'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import CashierLayout from '@/components/layouts/CashierLayout'
import { Search, ChevronDown, Trash2 } from 'lucide-react'
import { getSales, deleteSale } from '@/lib/api'

interface Sale {
  _id: string
  customer?: { name: string }
  totalAmount: number
  items: Array<{ product?: { name: string }; quantity: number }>
  createdAt: string
}

export default function HistoryPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sales, setSales] = useState<Sale[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

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
      const token = localStorage.getItem('cashierToken')
      if (!token) {
        router.push('/')
      } else {
        fetchSales()
      }
    }
  }, [router])

  const filteredSales = sales.filter((sale) => {
    return (
      (sale.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.items.some(item => (item.product?.name || '').toLowerCase().includes(searchTerm.toLowerCase()))
    )
  })

  const handleDeleteSale = async (saleId: string) => {
    if (!confirm('Ushbu savdoni o\'chirishni tasdiqlaysizmi?')) return

    setIsDeleting(saleId)
    setError(null)

    const response = await deleteSale(saleId)

    if (response.success) {
      setSales(sales.filter(s => s._id !== saleId))
    } else {
      setError(response.error || 'Savdoni o\'chirishda xato')
    }

    setIsDeleting(null)
  }

  return (
    <CashierLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-cyan-400">Savdo Tarixi</h1>
          <p className="text-gray-400 mt-1">O'tgan savdo tranzaksiyalari</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 backdrop-blur-sm">
            {error}
          </div>
        )}

        {/* Search */}
        <div className="card-glass p-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-teal-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Mijoz yoki mahsulot qidirish..."
              className="input-glass w-full pl-10"
            />
          </div>
        </div>

        {/* Table */}
        <div className="card-glass rounded-xl overflow-hidden">
          <div className="space-y-2 p-4">
            {filteredSales.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400">Savdolar topilmadi</p>
              </div>
            ) : (
              filteredSales.map((sale) => (
                <div key={sale._id} className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                  {/* Main Row */}
                  <button
                    onClick={() => setExpandedId(expandedId === sale._id ? null : sale._id)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/10 transition text-left"
                  >
                    <div className="flex-1 grid grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-400">Sana va Vaqt</p>
                        <p className="text-white font-semibold">{new Date(sale.createdAt).toLocaleString('uz-UZ')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Mijoz</p>
                        <p className="text-white font-semibold">{sale.customer?.name || 'Noma\'lum'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Miqdor</p>
                        <p className="text-white font-semibold">{sale.items.reduce((sum, item) => sum + item.quantity, 0)} ta</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Summa</p>
                        <p className="text-green-400 font-bold">${sale.totalAmount.toFixed(2)}</p>
                      </div>
                    </div>
                    <ChevronDown
                      size={20}
                      className={`text-teal-400 transition-transform ml-4 flex-shrink-0 ${
                        expandedId === sale._id ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Expanded Details */}
                  {expandedId === sale._id && (
                    <div className="bg-white/5 border-t border-white/10 px-6 py-4 space-y-3">
                      <div>
                        <p className="text-sm font-semibold text-teal-300 mb-2">Mahsulotlar:</p>
                        <div className="space-y-2">
                          {sale.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm text-gray-300 bg-white/5 p-2 rounded">
                              <span>{item.product?.name || 'Noma\'lum'}</span>
                              <span className="font-semibold">x{item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2 pt-4 border-t border-white/10">
                        <button
                          onClick={() => handleDeleteSale(sale._id)}
                          disabled={isDeleting === sale._id}
                          className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg transition disabled:opacity-50 font-semibold text-sm"
                        >
                          <Trash2 size={16} />
                          {isDeleting === sale._id ? 'O\'chirilmoqda...' : 'O\'chirish'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </CashierLayout>
  )
}
