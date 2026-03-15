'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/layouts/AdminLayout'
import { Plus, Edit2, Trash2, TrendingDown, X } from 'lucide-react'

interface Expense {
  _id: string
  category: string
  amount: number
  currency: string
  date: string
  description: string
  vendor?: string
  createdAt?: string
}

export default function ExpensesPage() {
  const router = useRouter()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [showModal, setShowModal] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [currency, setCurrency] = useState<'USD' | 'UZS'>('USD')
  const [exchangeRate, setExchangeRate] = useState(12500)
  const [formData, setFormData] = useState({
    category: 'supplies',
    amount: '',
    currency: 'USD',
    date: new Date().toISOString().split('T')[0],
    description: '',
    vendor: '',
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('adminToken')
      if (!token) {
        router.push('/')
      } else {
        fetchExpenses()
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

  const fetchExpenses = async () => {
    try {
      setError(null)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'
      const token = localStorage.getItem('adminToken')
      
      const response = await fetch(`${apiUrl}/expenses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      const data = await response.json()
      if (data.success && Array.isArray(data.data)) {
        setExpenses(data.data)
        const total = data.data.reduce((sum: number, item: Expense) => sum + item.amount, 0)
        setTotalExpenses(total)
      }
    } catch (err) {
      setError('Xarajatlarni yuklashda xato')
      console.error(err)
    }
  }

  const handleAddExpense = async () => {
    if (!formData.category || !formData.amount) {
      setError('Barcha maydonlarni to\'ldiring')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'
      const token = localStorage.getItem('adminToken')
      
      const method = isEditMode ? 'PUT' : 'POST'
      const url = isEditMode ? `${apiUrl}/expenses/${editingId}` : `${apiUrl}/expenses`
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount)
        })
      })

      const data = await response.json()
      if (data.success) {
        setFormData({
          category: 'supplies',
          amount: '',
          currency: 'USD',
          date: new Date().toISOString().split('T')[0],
          description: '',
          vendor: '',
        })
        setShowModal(false)
        setIsEditMode(false)
        fetchExpenses()
      } else {
        setError(data.error || 'Xato yuz berdi')
      }
    } catch (err) {
      setError('Xarajat qo\'shishda xato')
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (expense: Expense) => {
    setFormData({
      category: expense.category,
      amount: expense.amount.toString(),
      currency: expense.currency,
      date: expense.date,
      description: expense.description,
      vendor: expense.vendor || '',
    })
    setEditingId(expense._id)
    setIsEditMode(true)
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Rostdan ham o\'chirmoqchisiz?')) return

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'
      const token = localStorage.getItem('adminToken')
      
      const response = await fetch(`${apiUrl}/expenses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()
      if (data.success) {
        fetchExpenses()
      } else {
        setError(data.error || 'O\'chirishda xato')
      }
    } catch (err) {
      setError('O\'chirishda xato')
      console.error(err)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setIsEditMode(false)
    setEditingId(null)
    setFormData({
      category: 'supplies',
      amount: '',
      currency: 'USD',
      date: new Date().toISOString().split('T')[0],
      description: '',
      vendor: '',
    })
  }

  return (
    <AdminLayout>
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">Xarajatlar</h1>
              <p className="text-sm sm:text-base text-gray-400">Jami xarajat: {formatPrice(convertPrice(totalExpenses))}</p>
            </div>
            <div className="flex gap-3 items-center w-full sm:w-auto">
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
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-all text-sm sm:text-base w-full sm:w-auto justify-center sm:justify-start"
              >
                <Plus size={18} /> Yangi Xarajat
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 mb-8">
            <div className="bg-gradient-to-br from-red-500/20 to-orange-600/20 border border-red-500/30 rounded-lg p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-xs sm:text-sm">Jami Xarajat</p>
                  <p className="text-2xl sm:text-3xl font-bold text-red-400">{formatPrice(convertPrice(totalExpenses))}</p>
                </div>
                <TrendingDown size={32} className="text-red-500 opacity-50 hidden sm:block" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-600/20 border border-blue-500/30 rounded-lg p-4 sm:p-6">
              <p className="text-gray-400 text-xs sm:text-sm">Xarajatlar Soni</p>
              <p className="text-2xl sm:text-3xl font-bold text-blue-400">{expenses.length}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 border border-purple-500/30 rounded-lg p-4 sm:p-6">
              <p className="text-gray-400 text-xs sm:text-sm">O'rtacha Xarajat</p>
              <p className="text-2xl sm:text-3xl font-bold text-purple-400">{formatPrice(convertPrice(expenses.length > 0 ? totalExpenses / expenses.length : 0))}</p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Table - Mobile Card View */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/10 rounded-lg overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 bg-gradient-to-r from-slate-900/50 to-slate-800/50">
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm text-gray-300 font-semibold">Kategoriya</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm text-gray-300 font-semibold">Miqdor</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm text-gray-300 font-semibold">Sotuvchi</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm text-gray-300 font-semibold">Sana</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm text-gray-300 font-semibold">Tavsif</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm text-gray-300 font-semibold">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 sm:px-6 py-8 text-center text-gray-400 text-sm">
                        Xarajatlar mavjud emas
                      </td>
                    </tr>
                  ) : (
                    expenses.map((expense) => (
                      <tr key={expense._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-white font-medium text-sm">{expense.category}</td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-red-400 font-semibold text-sm">{formatPrice(convertPrice(expense.amount))}</td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-gray-300 text-sm">{expense.vendor || '-'}</td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-gray-400 text-sm">{new Date(expense.date).toLocaleDateString('uz-UZ')}</td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-gray-400 truncate text-sm">{expense.description}</td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 flex gap-1 sm:gap-2">
                          <button
                            onClick={() => handleEdit(expense)}
                            className="p-1.5 sm:p-2 hover:bg-blue-500/20 rounded-lg transition-colors"
                          >
                            <Edit2 size={16} className="text-blue-400" />
                          </button>
                          <button
                            onClick={() => handleDelete(expense._id)}
                            className="p-1.5 sm:p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} className="text-red-400" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="sm:hidden space-y-3 p-4">
              {expenses.length === 0 ? (
                <p className="text-center text-gray-400 py-8">Xarajatlar mavjud emas</p>
              ) : (
                expenses.map((expense) => (
                  <div key={expense._id} className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-white font-semibold text-sm">{expense.category}</p>
                        <p className="text-gray-400 text-xs">{expense.vendor || 'Sotuvchi yo\'q'}</p>
                      </div>
                      <p className="text-red-400 font-bold text-sm">{formatPrice(convertPrice(expense.amount))}</p>
                    </div>
                    <p className="text-gray-400 text-xs">{new Date(expense.date).toLocaleDateString('uz-UZ')}</p>
                    {expense.description && <p className="text-gray-400 text-xs">{expense.description}</p>}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleEdit(expense)}
                        className="flex-1 p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        <Edit2 size={14} className="text-blue-400" />
                        <span className="text-xs text-blue-400">Tahrirlash</span>
                      </button>
                      <button
                        onClick={() => handleDelete(expense._id)}
                        className="flex-1 p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        <Trash2 size={14} className="text-red-400" />
                        <span className="text-xs text-red-400">O'chirish</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 rounded-lg max-w-sm md:max-w-md w-full p-4 md:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg md:text-2xl font-bold text-white">
                {isEditMode ? 'Xarajatni Tahrirlash' : 'Yangi Xarajat'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-xs md:text-sm font-medium mb-2">Kategoriya</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-slate-700/50 border border-white/10 rounded-lg px-3 md:px-4 py-2 text-white focus:outline-none focus:border-blue-500 text-sm"
                >
                  <option value="supplies">Ehtiyotlar</option>
                  <option value="rent">Ijara</option>
                  <option value="utilities">Kommunal Xizmatlar</option>
                  <option value="salary">Oylik</option>
                  <option value="transport">Transport</option>
                  <option value="other">Boshqa</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-300 text-xs md:text-sm font-medium mb-2">Miqdor</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  step="0.01"
                  className="w-full bg-slate-700/50 border border-white/10 rounded-lg px-3 md:px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="block text-gray-300 text-xs md:text-sm font-medium mb-2">Valyuta</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full bg-slate-700/50 border border-white/10 rounded-lg px-3 md:px-4 py-2 text-white focus:outline-none focus:border-blue-500 text-sm"
                  >
                    <option>USD</option>
                    <option>UZS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 text-xs md:text-sm font-medium mb-2">Sana</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-slate-700/50 border border-white/10 rounded-lg px-3 md:px-4 py-2 text-white focus:outline-none focus:border-blue-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 text-xs md:text-sm font-medium mb-2">Sotuvchi</label>
                <input
                  type="text"
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  placeholder="Sotuvchi nomi"
                  className="w-full bg-slate-700/50 border border-white/10 rounded-lg px-3 md:px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-xs md:text-sm font-medium mb-2">Tavsif</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Xarajat haqida ma'lumot"
                  rows={2}
                  className="w-full bg-slate-700/50 border border-white/10 rounded-lg px-3 md:px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>

              <div className="flex gap-2 md:gap-3 pt-4">
                <button
                  onClick={closeModal}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-3 md:px-4 py-2 rounded-lg font-semibold transition-colors text-sm"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleAddExpense}
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 disabled:opacity-50 text-white px-3 md:px-4 py-2 rounded-lg font-semibold transition-all text-sm"
                >
                  {isSubmitting ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
