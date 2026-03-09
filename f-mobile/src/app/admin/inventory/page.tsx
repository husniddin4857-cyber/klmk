'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/layouts/AdminLayout'
import { Plus, Trash2, X, Search, Package, Edit2 } from 'lucide-react'
import { getProducts, createProduct, deleteProduct, updateProduct, getBranches } from '@/lib/api'

interface Product {
  _id: string
  name: string
  category: string
  buyPrice: number
  sellPrice: number
  stock: number
  imei: string
  branch: string | { _id: string; name: string }
}

interface Branch {
  _id: string
  name: string
}

export default function InventoryPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranch, setSelectedBranch] = useState<string>('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    buyPrice: '',
    sellPrice: '',
    stock: '',
    imei: '',
    branch: '',
  })

  const fetchProducts = async () => {
    setError(null)
    
    try {
      // Fetch branches
      const branchesRes = await getBranches()
      if (branchesRes.success && branchesRes.data) {
        setBranches(branchesRes.data as Branch[])
        if ((branchesRes.data as Branch[]).length > 0 && !selectedBranch) {
          setSelectedBranch((branchesRes.data as Branch[])[0]._id)
        }
      }

      // Fetch products
      const response = await getProducts()
      if (response.success && response.data) {
        setProducts(response.data as Product[])
      } else {
        setError(response.error || 'Mahsulotlarni yuklashda xato')
      }
    } catch (err) {
      console.error('Fetch error:', err)
      setError('Ma\'lumotlarni yuklashda xato')
    }
  }

  const handleAddProduct = async () => {
    if (!formData.name || !formData.sellPrice || !formData.branch) {
      setError('Mahsulot nomi, narx va filial talab qilinadi')
      return
    }

    const sellPrice = parseFloat(formData.sellPrice)
    if (isNaN(sellPrice) || sellPrice <= 0) {
      setError('Sotish narxi to\'g\'ri raqam bo\'lishi kerak')
      return
    }

    setIsSubmitting(true)
    setError(null)

    const productData = {
      name: formData.name,
      category: formData.category || 'Boshqa',
      buyPrice: formData.buyPrice ? parseFloat(formData.buyPrice) : 0,
      sellPrice: sellPrice,
      stock: formData.stock ? parseInt(formData.stock) : 0,
      imei: formData.imei || '',
      branch: formData.branch,
    }

    let response
    if (editingId) {
      response = await updateProduct(editingId, productData)
    } else {
      response = await createProduct(productData)
    }

    if (response.success) {
      setFormData({ name: '', category: '', buyPrice: '', sellPrice: '', stock: '', imei: '', branch: '' })
      setShowModal(false)
      setEditingId(null)
      await fetchProducts()
    } else {
      setError(response.error || (editingId ? 'Mahsulotni tahrirlashda xato' : 'Mahsulot qo\'shishda xato'))
    }
    setIsSubmitting(false)
  }

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Ushbu mahsulotni o\'chirishni tasdiqlaysizmi?')) return
    
    setError(null)
    const response = await deleteProduct(id)
    
    if (response.success) {
      await fetchProducts()
    } else {
      setError(response.error || 'Mahsulotni o\'chirishda xato')
    }
  }

  const handleEditProduct = (product: Product) => {
    setEditingId(product._id)
    const branchId = typeof product.branch === 'string' ? product.branch : product.branch._id
    setFormData({
      name: product.name,
      category: product.category,
      buyPrice: product.buyPrice.toString(),
      sellPrice: product.sellPrice.toString(),
      stock: product.stock.toString(),
      imei: typeof product.imei === 'string' ? product.imei : '',
      branch: branchId,
    })
    setShowModal(true)
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('adminToken')
      if (!token) {
        router.push('/')
      } else {
        fetchProducts()
      }
    }
  }, [router])

  const filteredProducts = products
    .filter(p => selectedBranch ? (typeof p.branch === 'string' ? p.branch === selectedBranch : p.branch?._id === selectedBranch) : true)
    .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))

  // Calculate stats for selected branch only
  const branchProductCount = filteredProducts.length
  const branchTotalValue = filteredProducts.reduce((sum, p) => sum + (p.sellPrice || 0), 0)

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-sm rounded-2xl p-6 border border-white/10 flex-1 mr-4">
            <h1 className="text-3xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Ombor</h1>
            <p className="text-gray-300 mt-1">Inventar boshqarish va monitoring</p>
          </div>
          <button
            onClick={() => {
              if (branches.length === 0) {
                setError('Avval filial qo\'shish kerak')
                return
              }
              setFormData({ name: '', category: '', buyPrice: '', sellPrice: '', stock: '', imei: '', branch: selectedBranch })
              setShowModal(true)
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-lg font-semibold transition-all hover:shadow-lg hover:shadow-purple-500/30 disabled:opacity-50"
            disabled={branches.length === 0}
          >
            <Plus size={20} />
            Yangi Mahsulot
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-300">
            {error}
          </div>
        )}

        {/* No Branches Warning */}
        {branches.length === 0 && (
          <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 text-yellow-300">
            ⚠️ Mahsulot qo'shish uchun avval <strong>Filiallar</strong> bo'limida filial qo'shish kerak
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-purple-600/20 to-purple-700/20 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30">
            <p className="text-sm text-purple-300/70 mb-2">Jami Mahsulotlar</p>
            <p className="text-3xl font-black text-purple-300">{branchProductCount}</p>
          </div>
          <div className="bg-gradient-to-br from-green-600/20 to-green-700/20 backdrop-blur-sm rounded-2xl p-6 border border-green-500/30">
            <p className="text-sm text-green-300/70 mb-2">Ombor Qiymati</p>
            <p className="text-3xl font-black text-green-300">${(branchTotalValue / 1000).toFixed(1)}K</p>
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-3 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Mahsulot qidirish..."
              className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 min-w-[200px]"
          >
            <option value="">Barcha Filiallar</option>
            {branches.map(branch => (
              <option key={branch._id} value={branch._id}>{branch.name}</option>
            ))}
          </select>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Package className="w-12 h-12 text-gray-500 mx-auto mb-2" />
              <p className="text-gray-400">Mahsulotlar topilmadi</p>
            </div>
          ) : (
            filteredProducts.map((product) => (
              <div
                key={product._id}
                className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-lg p-3 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300 group backdrop-blur-sm"
              >
                {/* Product Name */}
                <h3 className="font-semibold text-white text-sm group-hover:text-purple-300 transition-colors line-clamp-2 mb-2">
                  {product.name}
                </h3>

                {/* Price */}
                <div className="mb-2 pb-2 border-b border-white/10">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Narx:</span>
                    <span className="text-green-400 font-bold">${product.sellPrice.toFixed(2)}</span>
                  </div>
                </div>

                {/* IMEI Badge */}
                {product.imei && (
                  <div className="mb-3 px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded text-xs text-blue-300 text-center line-clamp-1">
                    {product.imei}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditProduct(product)}
                    className="flex-1 p-1.5 bg-blue-500/20 hover:bg-blue-500/40 rounded transition-all duration-300 border border-blue-500/30 hover:border-blue-500/60 text-blue-400 hover:text-blue-300 text-xs"
                  >
                    <Edit2 size={14} className="mx-auto" />
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product._id)}
                    className="flex-1 p-1.5 bg-red-500/20 hover:bg-red-500/40 rounded transition-all duration-300 border border-red-500/30 hover:border-red-500/60 text-red-400 hover:text-red-300 text-xs"
                  >
                    <Trash2 size={14} className="mx-auto" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800/80 backdrop-blur-xl rounded-lg shadow-2xl max-w-md w-full p-6 border border-slate-700/50">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">{editingId ? 'Mahsulotni Tahrirlash' : 'Yangi Mahsulot'}</h2>
                <button
                  onClick={() => {
                    setShowModal(false)
                    setEditingId(null)
                    setFormData({ name: '', category: '', buyPrice: '', sellPrice: '', stock: '', imei: '', branch: '' })
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded p-3 text-red-300 text-sm mb-4">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Filial</label>
                  <select
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Filial tanlang</option>
                    {branches.map(branch => (
                      <option key={branch._id} value={branch._id}>{branch.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Mahsulot Nomi</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Mahsulot nomi"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Sotish Narxi</label>
                  <div className="relative">
                    <span className="absolute left-4 top-2 text-gray-400 text-lg">$</span>
                    <input
                      type="number"
                      value={formData.sellPrice}
                      onChange={(e) => setFormData({ ...formData, sellPrice: e.target.value })}
                      className="w-full pl-8 pr-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">IMEI (ixtiyoriy)</label>
                  <input
                    type="text"
                    value={formData.imei}
                    onChange={(e) => setFormData({ ...formData, imei: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="IMEI raqamini kiriting"
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    setShowModal(false)
                    setEditingId(null)
                    setFormData({ name: '', category: '', buyPrice: '', sellPrice: '', stock: '', imei: '', branch: '' })
                  }}
                  className="flex-1 px-4 py-2 border border-slate-600/50 rounded hover:bg-slate-700/50 text-gray-300 font-semibold transition"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleAddProduct}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-semibold transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Jarayonda...' : editingId ? 'Saqlash' : 'Qo\'shish'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
