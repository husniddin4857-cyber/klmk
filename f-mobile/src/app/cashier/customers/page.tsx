'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import CashierLayout from '@/components/layouts/CashierLayout'
import { Users, Plus, Search, Eye, Trash2, X, Edit } from 'lucide-react'
import { getCustomers, createCustomer, deleteCustomer, updateCustomer } from '@/lib/api'
import { PhoneInput } from '@/components/common/PhoneInput'
import { validateUzbekPhoneNumber } from '@/lib/phoneValidator'

interface Customer {
  _id: string
  name: string
  phone: string
  email?: string
  address?: string
  totalPurchase?: number
  debt?: number
  branches?: Array<{ _id: string; name: string }>
  createdAt?: string
}

export default function CustomersPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
  })

  const fetchCustomers = async () => {
    setError(null)
    const branchId = localStorage.getItem('branchId')
    console.log('[DEBUG] Fetching customers with branchId:', branchId)
    
    const response = await getCustomers(branchId ? { branch: branchId } : undefined)
    console.log('[DEBUG] API Response:', response)
    
    if (response.success && response.data) {
      console.log('[DEBUG] Customers received:', response.data)
      setCustomers(response.data as Customer[])
    } else {
      setError(response.error || 'Mijozlarni yuklashda xato')
    }
  }

  const handleAddCustomer = async () => {
    if (!formData.name || !formData.phone) {
      setError('Ismi va telefon majburiy')
      return
    }

    if (!validateUzbekPhoneNumber(formData.phone)) {
      setError('Telefon raqam noto\'g\'ri. +998 dan keyin 9 ta raqam kerak')
      return
    }

    setIsSubmitting(true)
    setError(null)

    let response
    if (editingId) {
      response = await updateCustomer(editingId, {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
      })
    } else {
      response = await createCustomer({
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        branch: localStorage.getItem('branchId') || '507f1f77bcf86cd799439011',
      })
    }

    if (response.success) {
      setFormData({ name: '', phone: '', address: '' })
      setShowModal(false)
      setEditingId(null)
      await fetchCustomers()
    } else {
      setError(response.error || (editingId ? 'Mijozni tahrirlashda xato' : 'Mijoz qo\'shishda xato'))
    }
    setIsSubmitting(false)
  }

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm('Ushbu mijozni o\'chirishni tasdiqlaysizmi?')) return
    
    setError(null)
    const response = await deleteCustomer(id)
    
    if (response.success) {
      await fetchCustomers()
    } else {
      setError(response.error || 'Mijozni o\'chirishda xato')
    }
  }

  const handleEditCustomer = (customer: Customer) => {
    setEditingId(customer._id)
    setFormData({
      name: customer.name,
      phone: customer.phone,
      address: customer.address || '',
    })
    setShowModal(true)
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('cashierToken')
      if (!token) {
        router.push('/')
      } else {
        fetchCustomers()
      }
    }
  }, [router])

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  )

  return (
    <CashierLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-cyan-400">Mijozlar</h1>
            <p className="text-gray-400 mt-1">Barcha mijozlarning daftarlari</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white px-6 py-3 rounded-xl hover:shadow-lg hover:shadow-teal-500/50 transition-all duration-300 font-semibold transform hover:scale-105"
          >
            <Plus size={20} />
            Yangi Mijoz
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 backdrop-blur-sm">
            {error}
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-4 w-5 h-5 text-teal-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Mijoz nomini yoki telefonini qidirish..."
            className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent backdrop-blur-sm text-white placeholder-gray-400 transition-all"
          />
        </div>

        {/* Customers List */}
        <div className="space-y-3">
          {filteredCustomers.length === 0 ? (
            <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl shadow-xl p-12 text-center backdrop-blur-sm">
              <Users className="w-16 h-16 text-teal-400/50 mx-auto mb-4" />
              <p className="text-gray-400">Mijozlar topilmadi</p>
            </div>
          ) : (
            filteredCustomers.map((customer) => (
              <div
                key={customer._id}
                className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-xl p-5 hover:border-teal-500/50 hover:shadow-lg hover:shadow-teal-500/20 transition-all duration-300 backdrop-blur-sm group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-white text-lg group-hover:text-teal-300 transition-colors">{customer.name}</h3>
                    <p className="text-sm text-gray-400 mt-1">{customer.phone}</p>
                    {customer.address && (
                      <p className="text-sm text-gray-400">{customer.address}</p>
                    )}
                    <div className="flex gap-6 mt-3 text-sm">
                      {customer.totalPurchase && (
                        <span className="text-gray-400">
                          Jami: <span className="font-semibold text-green-400">${customer.totalPurchase}</span>
                        </span>
                      )}
                      {customer.debt && customer.debt > 0 && (
                        <span className="text-gray-400">
                          Qarz: <span className="font-semibold text-red-400">${customer.debt}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/cashier/customers/${customer._id}`}
                      className="p-2 bg-teal-500/20 hover:bg-teal-500/40 rounded-lg transition-all duration-300 border border-teal-500/30 hover:border-teal-500/60"
                    >
                      <Eye size={20} className="text-teal-400" />
                    </Link>
                    <button
                      onClick={() => handleEditCustomer(customer)}
                      className="p-2 bg-blue-500/20 hover:bg-blue-500/40 rounded-lg transition-all duration-300 border border-blue-500/30 hover:border-blue-500/60"
                    >
                      <Edit size={20} className="text-blue-400" />
                    </button>
                    <button
                      onClick={() => handleDeleteCustomer(customer._id)}
                      className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-lg transition-all duration-300 border border-red-500/30 hover:border-red-500/60"
                    >
                      <Trash2 size={20} className="text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Customer Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-white/20 rounded-2xl shadow-2xl max-w-md w-full p-8 backdrop-blur-xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-cyan-400">{editingId ? 'Mijozni Tahrirlash' : 'Yangi Mijoz'}</h2>
                <button
                  onClick={() => {
                    setShowModal(false)
                    setEditingId(null)
                    setFormData({ name: '', phone: '', address: '' })
                  }}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={24} className="text-gray-400" />
                </button>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm mb-4 backdrop-blur-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Ismi
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white placeholder-gray-500 transition-all backdrop-blur-sm"
                    placeholder="Mijoz ismi"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Telefon
                  </label>
                  <PhoneInput
                    value={formData.phone}
                    onChange={(phone) =>
                      setFormData({ ...formData, phone })
                    }
                    placeholder="+998 90 123 45 67"
                    label=""
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Manzili (ixtiyoriy)
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-white placeholder-gray-500 transition-all backdrop-blur-sm"
                    placeholder="Manzili"
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    setShowModal(false)
                    setEditingId(null)
                    setFormData({ name: '', phone: '', address: '' })
                  }}
                  className="flex-1 px-4 py-2 border border-white/20 rounded-lg hover:bg-white/10 transition-all text-gray-300 font-medium"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleAddCustomer}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg hover:shadow-lg hover:shadow-teal-500/50 transition-all disabled:opacity-50 font-medium"
                >
                  {isSubmitting ? 'Qo\'shilmoqda...' : editingId ? 'Saqlash' : 'Qo\'shish'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CashierLayout>
  )
}
