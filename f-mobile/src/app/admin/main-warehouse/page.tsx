'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/layouts/AdminLayout'
import { Plus, Trash2, X, Search, Package, Edit2, ArrowRight } from 'lucide-react'
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
  isMainWarehouse?: boolean
}

interface Branch {
  _id: string
  name: string
}

export default function MainWarehousePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [transferData, setTransferData] = useState({ quantity: '', targetBranch: '', selectedImei: '' })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [currency, setCurrency] = useState<'USD' | 'UZS'>('USD')
  const [exchangeRate, setExchangeRate] = useState(12500)
  const [imeiMode, setImeiMode] = useState<'different' | 'same' | null>(null)
  const [imeiInputs, setImeiInputs] = useState<{ [key: number]: string }>({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    buyPrice: '',
    sellPrice: '',
    stock: '',
    imei: '',
  })

  const convertPrice = (priceInUsd: number): number => {
    if (currency === 'USD') return priceInUsd
    return priceInUsd * exchangeRate
  }

  const formatPrice = (price: number): string => {
    if (currency === 'USD') return `${price.toFixed(2)}`
    return `${Math.floor(price).toLocaleString('uz-UZ')} so'm`
  }

  const fetchProducts = async () => {
    setError(null)
    try {
      const branchesRes = await getBranches()
      if (branchesRes.success && branchesRes.data) {
        setBranches(branchesRes.data as Branch[])
      }

      const response = await getProducts()
      if (response.success && response.data) {
        // Faqat asosiy omborga qo'shilgan mahsulotlarni ko'rsatish
        const mainWarehouseProducts = (response.data as Product[]).filter(p => 
          p.branch === 'main-warehouse-000' || p.isMainWarehouse === true
        )
        setProducts(mainWarehouseProducts)
      } else {
        setError(response.error || 'Mahsulotlarni yuklashda xato')
      }
    } catch (err) {
      console.error('Fetch error:', err)
      setError('Ma\'lumotlarni yuklashda xato')
    }
  }

  const fetchExchangeRate = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'
      const response = await fetch(`${apiUrl}/exchange-rate/current`)
      const data = await response.json()
      
      if (data.success && data.data) {
        setExchangeRate(data.data.rate)
        console.log('✅ Exchange rate updated:', data.data.rate)
      }
    } catch (err) {
      console.error('Exchange rate fetch error:', err)
    }
  }

  const handleAddProduct = async () => {
    if (!formData.name.trim() || !formData.buyPrice || !formData.sellPrice || !formData.stock) {
      setError('Barcha maydonlarni to\'ldirish talab qilinadi')
      return
    }

    const stock = parseInt(formData.stock)
    if (stock > 0 && !imeiMode) {
      setError('IMEI rejimini tanlang')
      return
    }

    setIsSubmitting(true)
    setError(null)

    let imeiValue = ''
    if (stock > 0) {
      if (imeiMode === 'same') {
        if (!formData.imei.trim()) {
          setError('IMEI raqamini kiriting')
          setIsSubmitting(false)
          return
        }
        imeiValue = formData.imei
      } else if (imeiMode === 'different') {
        const imeiList = []
        for (let i = 0; i < stock; i++) {
          if (!imeiInputs[i] || !imeiInputs[i].trim()) {
            setError(`${i + 1}-chi IMEI raqamini kiriting`)
            setIsSubmitting(false)
            return
          }
          imeiList.push(imeiInputs[i])
        }
        imeiValue = imeiList.join(',')
      }
    }

    const productData = {
      name: formData.name,
      category: formData.category || 'Boshqa',
      buyPrice: parseFloat(formData.buyPrice),
      sellPrice: parseFloat(formData.sellPrice),
      stock: stock,
      imei: imeiValue,
      branch: 'main-warehouse-000',
      isMainWarehouse: true,
    }

    let response
    if (editingId) {
      response = await updateProduct(editingId, productData)
    } else {
      response = await createProduct(productData)
    }

    if (response.success) {
      setFormData({ name: '', category: '', buyPrice: '', sellPrice: '', stock: '', imei: '' })
      setShowModal(false)
      setEditingId(null)
      setImeiMode(null)
      setImeiInputs({})
      await fetchProducts()
    } else {
      setError(response.error || 'Xato yuz berdi')
    }
    setIsSubmitting(false)
  }

  const handleDeleteProduct = async (id: string) => {
    setDeleteProductId(id)
    setShowDeleteConfirm(true)
  }

  const confirmDeleteProduct = async () => {
    if (!deleteProductId) return
    
    setError(null)
    const response = await deleteProduct(deleteProductId)
    
    if (response.success) {
      await fetchProducts()
      setShowDeleteConfirm(false)
      setDeleteProductId(null)
    } else {
      setError(response.error || 'Mahsulotni o\'chirishda xato')
    }
  }

  const handleEditProduct = (product: Product) => {
    setEditingId(product._id)
    
    let detectedMode: 'different' | 'same' | null = null
    const existingImeis: { [key: number]: string } = {}
    
    if (product.imei && product.stock > 0) {
      const imeiArray = product.imei.split(',').map(i => i.trim()).filter(i => i !== '')
      
      if (imeiArray.length === 1) {
        // Bir xil IMEI
        detectedMode = 'same'
      } else if (imeiArray.length === product.stock) {
        // Har xil IMEI - har biriga alohida
        detectedMode = 'different'
        imeiArray.forEach((imei, index) => {
          existingImeis[index] = imei
        })
      } else if (imeiArray.length > 1) {
        // Qismiy IMEI - har xil rejim deb hisoblash
        detectedMode = 'different'
        imeiArray.forEach((imei, index) => {
          existingImeis[index] = imei
        })
      }
    }
    
    setFormData({
      name: product.name,
      category: product.category,
      buyPrice: product.buyPrice.toString(),
      sellPrice: product.sellPrice.toString(),
      stock: product.stock.toString(),
      imei: detectedMode === 'same' ? product.imei : '',
    })
    
    setImeiMode(detectedMode)
    setImeiInputs(existingImeis)
    setShowModal(true)
  }

  const handleTransferProduct = async () => {
    if (!selectedProduct || !transferData.quantity || !transferData.targetBranch) {
      setError('Barcha maydonlarni to\'ldirish talab qilinadi')
      return
    }

    const quantity = parseInt(transferData.quantity)
    if (quantity > selectedProduct.stock) {
      setError('Kochirish miqdori stokdan ko\'p bo\'lmasligi kerak')
      return
    }

    // Agar har xil IMEI bo'lsa, IMEI tanlash kerak
    const imeiArray = selectedProduct.imei.split(',').map(i => i.trim()).filter(i => i !== '')
    if (imeiArray.length > 1 && !transferData.selectedImei) {
      setError('IMEI tanlang')
      return
    }

    setIsSubmitting(true)
    setError(null)

    const newStock = selectedProduct.stock - quantity

    // Agar soni 0 bo'lsa, mahsulotni o'chirish, aks holda yangilash
    let response1
    if (newStock === 0) {
      response1 = await deleteProduct(selectedProduct._id)
    } else {
      const updatedProduct = {
        ...selectedProduct,
        stock: newStock,
        branch: 'main-warehouse-000',
      }
      response1 = await updateProduct(selectedProduct._id, updatedProduct)
    }

    if (response1.success) {
      // Filialga yangi mahsulot qo'shish
      // Agar bir xil IMEI bo'lsa, avtomatik o'tsin
      const transferImei = imeiArray.length === 1 ? selectedProduct.imei : transferData.selectedImei
      
      const newProduct = {
        name: selectedProduct.name,
        category: selectedProduct.category,
        buyPrice: selectedProduct.buyPrice,
        sellPrice: selectedProduct.sellPrice,
        stock: quantity,
        imei: transferImei,
        branch: transferData.targetBranch,
      }

      const response2 = await createProduct(newProduct)

      if (response2.success) {
        setShowTransferModal(false)
        setSelectedProduct(null)
        setTransferData({ quantity: '', targetBranch: '', selectedImei: '' })
        await fetchProducts()
      } else {
        setError('Filialga qo\'shishda xato')
      }
    } else {
      setError('Asosiy ombordan kamaytirish xatosi')
    }

    setIsSubmitting(false)
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('adminToken')
      if (!token) {
        router.push('/')
      } else {
        fetchProducts()
        fetchExchangeRate()
      }
    }
  }, [router])

  const filteredProducts = products.filter(p => 
    p.imei.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalValue = products.reduce((sum, p) => sum + (p.sellPrice * p.stock), 0)

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-sm rounded-2xl p-6 border border-white/10 flex-1 mr-4">
            <h1 className="text-3xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Asosiy Ombor</h1>
            <p className="text-gray-300 mt-1">Mahsulot qo'shish va kochirish</p>
          </div>
          <div className="flex gap-3 items-center">
            <div className="flex gap-2 bg-white/10 border border-white/20 rounded-lg p-1">
              <button
                onClick={() => setCurrency('USD')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  currency === 'USD'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                $
              </button>
              <button
                onClick={() => setCurrency('UZS')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  currency === 'UZS'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                So'm
              </button>
            </div>
            <button
              onClick={() => {
                setFormData({ name: '', category: '', buyPrice: '', sellPrice: '', stock: '', imei: '' })
                setEditingId(null)
                setImeiMode(null)
                setImeiInputs({})
                setShowModal(true)
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-lg font-semibold transition-all hover:shadow-lg hover:shadow-purple-500/30"
            >
              <Plus size={20} />
              Yangi Mahsulot
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-purple-600/20 to-purple-700/20 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30">
            <p className="text-sm text-purple-300/70 mb-2">Jami Mahsulotlar</p>
            <p className="text-3xl font-black text-purple-300">{products.length}</p>
          </div>
          <div className="bg-gradient-to-br from-green-600/20 to-green-700/20 backdrop-blur-sm rounded-2xl p-6 border border-green-500/30">
            <p className="text-sm text-green-300/70 mb-2">Ombor Qiymati</p>
            <p className="text-3xl font-black text-green-300">{formatPrice(convertPrice(totalValue))}</p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-3 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="IMEI yoki mahsulot nomi bilan qidirish..."
              className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

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
                <h3 className="font-semibold text-white text-sm group-hover:text-purple-300 transition-colors line-clamp-2 mb-2">
                  {product.name}
                </h3>

                <div className="mb-2 pb-2 border-b border-white/10">
                  <div className="flex justify-between items-center text-sm mb-1">
                    <span className="text-gray-400">Olish:</span>
                    <span className="text-orange-400 font-bold">{formatPrice(convertPrice(product.buyPrice))}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Sotish:</span>
                    <span className="text-green-400 font-bold">{formatPrice(convertPrice(product.sellPrice))}</span>
                  </div>
                </div>

                <div className="mb-3 px-2 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded text-xs text-cyan-300 text-center">
                  Soni: {product.stock} ta
                </div>

                {product.imei && (
                  <div className="mb-3 px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded text-xs text-blue-300 text-center line-clamp-1">
                    {product.imei}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedProduct(product)
                      setTransferData({ quantity: '', targetBranch: '', selectedImei: '' })
                      setShowTransferModal(true)
                    }}
                    className="flex-1 p-1.5 bg-green-500/20 hover:bg-green-500/40 rounded transition-all duration-300 border border-green-500/30 hover:border-green-500/60 text-green-400 hover:text-green-300 text-xs"
                    title="Filialga kochirish"
                  >
                    <ArrowRight size={14} className="mx-auto" />
                  </button>
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

        {/* Mahsulot qo'shish/tahrirlash modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800/80 backdrop-blur-xl rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col border border-slate-700/50">
              <div className="flex justify-between items-center p-6 border-b border-slate-700/50">
                <h2 className="text-2xl font-bold text-white">{editingId ? 'Tahrirlash' : 'Yangi Mahsulot'}</h2>
                <button
                  onClick={() => {
                    setShowModal(false)
                    setEditingId(null)
                    setFormData({ name: '', category: '', buyPrice: '', sellPrice: '', stock: '', imei: '' })
                    setImeiMode(null)
                    setImeiInputs({})
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
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
                  <label className="block text-sm font-medium text-gray-300 mb-2">Olish Narxi ($)</label>
                  <input
                    type="number"
                    value={formData.buyPrice}
                    onChange={(e) => setFormData({ ...formData, buyPrice: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Sotish Narxi ($)</label>
                  <input
                    type="number"
                    value={formData.sellPrice}
                    onChange={(e) => setFormData({ ...formData, sellPrice: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Soni</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="0"
                  />
                </div>

                {formData.stock && parseInt(formData.stock) > 0 && (
                  <>
                    {/* Show existing IMEIs when editing */}
                    {editingId && Object.keys(imeiInputs).length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">📋 Mavjud IMEI lar</label>
                        <div className="bg-slate-700/30 border border-slate-600/50 rounded p-3 space-y-1 max-h-32 overflow-y-auto">
                          {Object.entries(imeiInputs).map(([idx, imei]) => (
                            <div key={idx} className="text-sm text-gray-300">
                              {parseInt(idx) + 1}. <span className="text-blue-300 font-mono">{imei}</span>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-400 mt-2">Tahrirlash uchun IMEI rejimini tanlang</p>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">IMEI Rejimi</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setImeiMode('different')
                            setFormData({ ...formData, imei: '' })
                          }}
                          className={`flex-1 px-3 py-2 rounded font-semibold transition ${
                            imeiMode === 'different'
                              ? 'bg-blue-600 text-white border border-blue-500'
                              : 'bg-slate-700/50 text-gray-300 border border-slate-600/50 hover:bg-slate-700'
                          }`}
                        >
                          Har xil
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setImeiMode('same')
                            setImeiInputs({})
                          }}
                          className={`flex-1 px-3 py-2 rounded font-semibold transition ${
                            imeiMode === 'same'
                              ? 'bg-green-600 text-white border border-green-500'
                              : 'bg-slate-700/50 text-gray-300 border border-slate-600/50 hover:bg-slate-700'
                          }`}
                        >
                          Bir xil
                        </button>
                      </div>
                    </div>

                    {imeiMode === 'same' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">IMEI Raqami</label>
                        <input
                          type="text"
                          value={formData.imei}
                          onChange={(e) => setFormData({ ...formData, imei: e.target.value })}
                          className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="IMEI raqami"
                        />
                        <p className="text-xs text-gray-400 mt-1">Bu IMEI barcha {formData.stock} ta mahsulotga qo'llaniladi</p>
                      </div>
                    )}

                    {imeiMode === 'different' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Har bir mahsulot uchun IMEI</label>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {Array.from({ length: parseInt(formData.stock) }).map((_, i) => (
                            <input
                              key={i}
                              type="text"
                              value={imeiInputs[i] || ''}
                              onChange={(e) => setImeiInputs({ ...imeiInputs, [i]: e.target.value })}
                              className="w-full px-3 py-1 bg-slate-700/50 border border-slate-600/50 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder={`IMEI ${i + 1}`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="p-6 border-t border-slate-700/50 flex gap-3">
                <button
                  onClick={() => {
                    setShowModal(false)
                    setEditingId(null)
                    setFormData({ name: '', category: '', buyPrice: '', sellPrice: '', stock: '', imei: '' })
                    setImeiMode(null)
                    setImeiInputs({})
                  }}
                  className="flex-1 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 rounded text-white font-semibold transition"
                >
                  Bekor
                </button>
                <button
                  onClick={handleAddProduct}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded text-white font-semibold transition"
                >
                  {isSubmitting ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mahsulot kochirish modal */}
        {showTransferModal && selectedProduct && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800/80 backdrop-blur-xl rounded-lg shadow-2xl max-w-md w-full border border-slate-700/50">
              <div className="flex justify-between items-center p-6 border-b border-slate-700/50">
                <h2 className="text-2xl font-bold text-white">Filialga Kochirish</h2>
                <button
                  onClick={() => {
                    setShowTransferModal(false)
                    setSelectedProduct(null)
                    setTransferData({ quantity: '', targetBranch: '', selectedImei: '' })
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-gray-300 mb-2">Mahsulot: <span className="font-bold text-white">{selectedProduct.name}</span></p>
                  <p className="text-sm text-gray-300">Mavjud: <span className="font-bold text-cyan-300">{selectedProduct.stock} ta</span></p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Kochirish Miqdori</label>
                  <input
                    type="number"
                    value={transferData.quantity}
                    onChange={(e) => setTransferData({ ...transferData, quantity: e.target.value })}
                    max={selectedProduct.stock}
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="0"
                  />
                </div>

                {/* IMEI Selection - only for different IMEIs */}
                {selectedProduct.imei && selectedProduct.imei.split(',').filter(i => i.trim()).length > 1 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">IMEI Tanlang</label>
                    <select
                      value={transferData.selectedImei}
                      onChange={(e) => setTransferData({ ...transferData, selectedImei: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">IMEI tanlang</option>
                      {selectedProduct.imei.split(',').map((imei, idx) => (
                        <option key={idx} value={imei.trim()}>{imei.trim()}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-400 mt-1">Har xil IMEI uchun IMEI tanlang</p>
                  </div>
                )}

                {/* For same IMEI - show it automatically */}
                {selectedProduct.imei && selectedProduct.imei.split(',').filter(i => i.trim()).length === 1 && (
                  <div>
                    <p className="text-sm text-gray-300 mb-2">IMEI: <span className="font-bold text-blue-300">{selectedProduct.imei}</span></p>
                    <p className="text-xs text-gray-400">Bir xil IMEI - avtomatik o'tadi</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Filial Tanlang</label>
                  <select
                    value={transferData.targetBranch}
                    onChange={(e) => setTransferData({ ...transferData, targetBranch: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Filial tanlang</option>
                    {branches.map(branch => (
                      <option key={branch._id} value={branch._id}>{branch.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-6 border-t border-slate-700/50 flex gap-3">
                <button
                  onClick={() => {
                    setShowTransferModal(false)
                    setSelectedProduct(null)
                    setTransferData({ quantity: '', targetBranch: '', selectedImei: '' })
                  }}
                  className="flex-1 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 rounded text-white font-semibold transition"
                >
                  Bekor
                </button>
                <button
                  onClick={handleTransferProduct}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded text-white font-semibold transition"
                >
                  {isSubmitting ? 'Kochirmoqda...' : 'Kochirish'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* O'chirish tasdiqlash dialogi */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800/80 backdrop-blur-xl rounded-lg shadow-2xl max-w-sm w-full border border-slate-700/50">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-white mb-2">Mahsulotni o'chirish</h2>
                <p className="text-gray-300 mb-6">Siz ushbu mahsulotni o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi.</p>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false)
                      setDeleteProductId(null)
                    }}
                    className="flex-1 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 rounded text-white font-semibold transition"
                  >
                    Bekor
                  </button>
                  <button
                    onClick={confirmDeleteProduct}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white font-semibold transition"
                  >
                    O'chirish
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
