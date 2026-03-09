'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/layouts/AdminLayout'
import { Plus, Edit2, Trash2, DollarSign, TrendingUp, X, MapPin } from 'lucide-react'
import { getCashiers, createCashier, updateCashier, deleteCashier, getBranches } from '@/lib/api'

interface Cashier {
  _id: string
  username: string
  branch?: {
    _id: string
    name: string
    address: string
  }
  role: string
  createdAt?: string
}

interface Branch {
  _id: string
  name: string
  address: string
}

export default function CashiersPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cashiers, setCashiers] = useState<Cashier[]>([])
  const [branches, setBranches] = useState<Branch[]>([])

  const [showModal, setShowModal] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    branch: '',
  })

  const fetchCashiers = async () => {
    setError(null)
    const response = await getCashiers()
    if (response.success && response.data) {
      setCashiers(response.data as Cashier[])
    } else {
      setError(response.error || 'Kassirlarni yuklashda xato')
    }
    
    const branchResponse = await getBranches()
    if (branchResponse.success && branchResponse.data) {
      setBranches(branchResponse.data as Branch[])
    }
  }

  const handleAddCashier = async () => {
    if (!formData.username) {
      setError('Foydalanuvchi nomi talab qilinadi')
      return
    }

    // Yangi kassir qo'shishda parol talab
    if (!isEditMode && !formData.password) {
      setError('Parol talab qilinadi')
      return
    }

    setIsSubmitting(true)
    setError(null)
    
    const payload: any = {
      username: formData.username,
      branch: formData.branch,
      role: 'cashier'
    }

    // Parol faqat yangi kassir qo'shishda yoki tahrirlashda o'zgartirilsa qo'shiladi
    if (formData.password) {
      payload.password = formData.password
    }

    let response
    if (isEditMode && editingId) {
      response = await updateCashier(editingId, payload)
    } else {
      response = await createCashier(payload)
    }

    if (response.success) {
      setFormData({ username: '', password: '', branch: '' })
      setShowModal(false)
      setIsEditMode(false)
      setEditingId(null)
      await fetchCashiers()
    } else {
      setError(response.error || (isEditMode ? 'Kassir tahrirlashda xato' : 'Kassir qo\'shishda xato'))
    }
    setIsSubmitting(false)
  }

  const handleDeleteCashier = async (id: string) => {
    if (!confirm('Ushbu kassirni o\'chirishni tasdiqlaysizmi?')) return
    
    setError(null)
    const response = await deleteCashier(id)
    
    if (response.success) {
      await fetchCashiers()
    } else {
      setError(response.error || 'Kassirni o\'chirishda xato')
    }
  }

  const handleEditCashier = (cashier: Cashier) => {
    setIsEditMode(true)
    setEditingId(cashier._id)
    setFormData({
      username: cashier.username,
      password: '',
      branch: cashier.branch?.name || '',
    })
    setShowModal(true)
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('adminToken')
      if (!token) {
        router.push('/')
      } else {
        fetchCashiers()
      }
    }
  }, [router])

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 backdrop-blur-sm rounded-2xl p-6 border border-white/10 flex-1 mr-4">
            <h1 className="text-3xl font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">Kassirlar</h1>
            <p className="text-gray-300 mt-1">Kassirlarni boshqarish va monitoring</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-green-500/30 font-semibold"
          >
            <Plus size={20} />
            Yangi Kassir
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cashiers.length === 0 ? (
            <div className="col-span-full bg-slate-800/50 rounded-2xl p-12 text-center border border-slate-700/50">
              <p className="text-gray-400">Kassirlar topilmadi</p>
            </div>
          ) : (
            cashiers.map((cashier) => (
              <div key={cashier._id} className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all hover:shadow-lg hover:shadow-green-500/20">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">{cashier.username}</h3>
                    <span className="inline-block mt-2 px-3 py-1 rounded-lg text-xs font-semibold bg-green-500/30 text-green-300 border border-green-500/50">
                      ✓ Faol
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditCashier(cashier)}
                      className="p-2 hover:bg-white/10 rounded-lg transition text-blue-400 hover:text-blue-300"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteCashier(cashier._id)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition text-red-400 hover:text-red-300"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <MapPin size={16} className="text-green-400 flex-shrink-0" />
                    <p className="text-gray-300">{cashier.branch?.name || '-'}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-300">
            {error}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md w-full p-6 border border-white/20">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">
                  {isEditMode ? 'Kassirni Tahrirlash' : 'Yangi Kassir Qo\'shish'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false)
                    setIsEditMode(false)
                    setEditingId(null)
                    setFormData({ username: '', password: '', branch: '' })
                  }}
                  className="p-1 hover:bg-white/10 rounded-lg transition text-gray-400 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-300 text-sm mb-4">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Foydalanuvchi Nomi
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                    placeholder="username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Parol
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                    placeholder="Parol"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Filial
                  </label>
                  <select
                    value={formData.branch}
                    onChange={(e) =>
                      setFormData({ ...formData, branch: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                  >
                    <option value="" className="bg-slate-900">Filial tanlang</option>
                    {branches.map((branch) => (
                      <option key={branch._id} value={branch.name} className="bg-slate-900">
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    setShowModal(false)
                    setIsEditMode(false)
                    setEditingId(null)
                    setFormData({ username: '', password: '', branch: '' })
                  }}
                  className="flex-1 px-4 py-2 border border-white/20 rounded-lg hover:bg-white/10 transition text-gray-300 hover:text-white font-semibold"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleAddCashier}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg transition-all hover:shadow-lg hover:shadow-green-500/30 font-semibold disabled:opacity-50"
                >
                  {isSubmitting ? (isEditMode ? 'Tahrirlash...' : 'Qo\'shilmoqda...') : (isEditMode ? 'Tahrirlash' : 'Qo\'shish')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
