'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/layouts/AdminLayout'
import { Users, Edit, Trash2, X } from 'lucide-react'
import { getCustomers, updateCustomer, deleteCustomer, getBranches } from '@/lib/api'

interface Customer {
  _id: string
  name: string
  phone: string
  email?: string
  address?: string
  branch?: string | { _id: string; name: string }
  totalPurchase?: number
  debt?: number
}

interface Branch {
  _id: string
  name: string
}

export default function AdminCustomersPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    branch: '',
  })

  const fetchData = async () => {
    setError(null)
    const [customersRes, branchesRes] = await Promise.all([
      getCustomers(),
      getBranches()
    ])

    if (customersRes.success && customersRes.data) {
      setCustomers(customersRes.data as Customer[])
    } else {
      setError(customersRes.error || 'Mijozlarni yuklashda xato')
    }

    if (branchesRes.success && branchesRes.data) {
      setBranches(branchesRes.data as Branch[])
    }
  }

  const handleEditBranch = (customer: Customer) => {
    setEditingId(customer._id)
    const branchId = typeof customer.branch === 'string'
      ? customer.branch
      : customer.branch?._id || ''
    setFormData({ branch: branchId })
  }

  const handleSaveBranch = async () => {
    if (!editingId) return

    setError(null)
    const response = await updateCustomer(editingId, {
      branch: formData.branch || null
    })

    if (response.success) {
      setEditingId(null)
      await fetchData()
    } else {
      setError(response.error || 'Filialni o\'zgartirishda xato')
    }
  }

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm('Ushbu mijozni o\'chirishni tasdiqlaysizmi?')) return

    setError(null)
    const response = await deleteCustomer(id)

    if (response.success) {
      await fetchData()
    } else {
      setError(response.error || 'Mijozni o\'chirishda xato')
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('adminToken')
      if (!token) {
        router.push('/')
      } else {
        fetchData()
      }
    }
  }, [router])

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">Mijozlar</h1>
          <p className="text-gray-400 mt-1">Barcha mijozlarni boshqarish</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 backdrop-blur-sm">
            {error}
          </div>
        )}

        {/* Customers Table */}
        <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Ismi</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Telefon</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Filial</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Jami Savdo</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Qarz</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => {
                  const branchName = typeof customer.branch === 'string'
                    ? branches.find(b => b._id === customer.branch)?.name || 'Noma\'lum'
                    : customer.branch?.name || 'Noma\'lum'

                  return (
                    <tr key={customer._id} className="border-b border-white/10 hover:bg-white/5 transition">
                      <td className="px-6 py-4 text-white font-medium">{customer.name}</td>
                      <td className="px-6 py-4 text-gray-400">{customer.phone}</td>
                      <td className="px-6 py-4">
                        {editingId === customer._id ? (
                          <select
                            value={formData.branch}
                            onChange={(e) => setFormData({ branch: e.target.value })}
                            className="px-3 py-1 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Filial tanlamang</option>
                            {branches.map(branch => (
                              <option key={branch._id} value={branch._id}>{branch.name}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                            branchName === 'Noma\'lum'
                              ? 'bg-red-500/20 text-red-300'
                              : 'bg-blue-500/20 text-blue-300'
                          }`}>
                            {branchName}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-green-400 font-semibold">${(customer.totalPurchase || 0).toFixed(2)}</td>
                      <td className="px-6 py-4 text-red-400 font-semibold">${(customer.debt || 0).toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {editingId === customer._id ? (
                            <>
                              <button
                                onClick={handleSaveBranch}
                                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition"
                              >
                                Saqlash
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition"
                              >
                                Bekor
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEditBranch(customer)}
                                className="p-2 bg-blue-500/20 hover:bg-blue-500/40 rounded-lg transition border border-blue-500/30 hover:border-blue-500/60"
                              >
                                <Edit size={16} className="text-blue-400" />
                              </button>
                              <button
                                onClick={() => handleDeleteCustomer(customer._id)}
                                className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-lg transition border border-red-500/30 hover:border-red-500/60"
                              >
                                <Trash2 size={16} className="text-red-400" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {customers.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">Mijozlar topilmadi</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
