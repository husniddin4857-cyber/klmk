'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/layouts/AdminLayout'
import { Plus, Edit2, Trash2, MapPin, X } from 'lucide-react'
import { getBranches, createBranch, updateBranch, deleteBranch } from '@/lib/api'

interface Branch {
  _id: string
  name: string
  address: string
  createdAt?: string
  updatedAt?: string
}

export default function BranchesPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [branches, setBranches] = useState<Branch[]>([])

  const [showModal, setShowModal] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
  })

  const fetchBranches = async () => {
    setError(null)
    const response = await getBranches()
    if (response.success && response.data) {
      setBranches(response.data as Branch[])
    } else {
      setError(response.error || 'Filiallarni yuklashda xato')
    }
  }

  const handleAddBranch = async () => {
    if (!formData.name || !formData.address) {
      setError('Barcha maydonlarni to\'ldiring')
      return
    }

    setIsSubmitting(true)
    setError(null)
    
    let response
    if (isEditMode && editingId) {
      response = await updateBranch(editingId, formData)
    } else {
      response = await createBranch(formData)
    }
    
    if (response.success) {
      setFormData({ name: '', address: '' })
      setShowModal(false)
      setIsEditMode(false)
      setEditingId(null)
      await fetchBranches()
    } else {
      setError(response.error || (isEditMode ? 'Filial tahrirlashda xato' : 'Filial qo\'shishda xato'))
    }
    setIsSubmitting(false)
  }

  const handleDeleteBranch = async (id: string) => {
    if (!confirm('Ushbu filialni o\'chirishni tasdiqlaysizmi?')) return
    
    setError(null)
    const response = await deleteBranch(id)
    
    if (response.success) {
      await fetchBranches()
    } else {
      setError(response.error || 'Filialni o\'chirishda xato')
    }
  }

  const handleEditBranch = (branch: Branch) => {
    setIsEditMode(true)
    setEditingId(branch._id)
    setFormData({
      name: branch.name,
      address: branch.address,
    })
    setShowModal(true)
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('adminToken')
      if (!token) {
        router.push('/')
      } else {
        fetchBranches()
      }
    }
  }, [router])

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 backdrop-blur-sm rounded-2xl p-6 border border-white/10 flex-1 mr-4">
            <h1 className="text-3xl font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Filiallar</h1>
            <p className="text-gray-300 mt-1">Barcha filiallarni boshqarish</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/30 font-semibold"
          >
            <Plus size={20} />
            Yangi Filial
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-300">
            {error}
          </div>
        )}

        {/* Branches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.length === 0 ? (
            <div className="col-span-full bg-slate-800/50 rounded-2xl p-12 text-center border border-slate-700/50">
              <p className="text-gray-400">Filiallar topilmadi</p>
            </div>
          ) : (
            branches.map((branch) => (
              <div key={branch._id} className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all hover:shadow-lg hover:shadow-blue-500/20">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">{branch.name}</h3>
                    <span className="inline-block mt-2 px-3 py-1 rounded-lg text-xs font-semibold bg-green-500/30 text-green-300 border border-green-500/50">
                      ✓ Faol
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditBranch(branch)}
                      className="p-2 hover:bg-white/10 rounded-lg transition text-blue-400 hover:text-blue-300"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteBranch(branch._id)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition text-red-400 hover:text-red-300"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-3 text-sm mb-4">
                  <div className="flex items-start gap-3">
                    <MapPin size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-300">{branch.address}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md w-full p-6 border border-white/20">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">
                  {isEditMode ? 'Filialni Tahrirlash' : 'Yangi Filial Qo\'shish'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false)
                    setIsEditMode(false)
                    setEditingId(null)
                    setFormData({ name: '', address: '' })
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
                    Filial Nomi
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Tashkent 3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Manzili
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Ko'chasi, raqami"
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    setShowModal(false)
                    setIsEditMode(false)
                    setEditingId(null)
                    setFormData({ name: '', address: '' })
                  }}
                  className="flex-1 px-4 py-2 border border-white/20 rounded-lg hover:bg-white/10 transition text-gray-300 hover:text-white font-semibold"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleAddBranch}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all hover:shadow-lg hover:shadow-blue-500/30 font-semibold disabled:opacity-50"
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
