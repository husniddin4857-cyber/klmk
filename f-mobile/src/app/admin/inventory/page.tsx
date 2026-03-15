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
  imeiList?: Array<{ imei: string; used: boolean }>
  branch: string | { _id: string; name: string }
  isMainWarehouse?: boolean
}

interface Branch {
  _id: string
  name: string
}

interface IMEIInput {
  [key: number]: string
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
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [transferData, setTransferData] = useState({ quantity: '', selectedImei: '' })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [originalStock, setOriginalStock] = useState(0)
  const [imeiMode, setImeiMode] = useState<'different' | 'same' | null>(null)
  const [imeiInputs, setImeiInputs] = useState<IMEIInput>({})
  const [currency, setCurrency] = useState<'USD' | 'UZS'>('USD')
  const [exchangeRate, setExchangeRate] = useState(12500)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    buyPrice: '',
    sellPrice: '',
    stock: '',
    imei: '',
    branch: '',
  })

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

  const isFormValid = () => {
    const hasBasicFields = (
      formData.name.trim() !== '' &&
      formData.branch.trim() !== '' &&
      formData.buyPrice.trim() !== '' &&
      formData.sellPrice.trim() !== '' &&
      formData.stock.trim() !== ''
    )

    if (!hasBasicFields) return false

    // Calculate final stock
    let finalStock = 0
    if (formData.stock.includes('+')) {
      const parts = formData.stock.split('+').filter(p => p.trim() !== '')
      if (parts.length > 0) {
        const addValue = parseInt(parts[parts.length - 1]) || 0
        finalStock = originalStock + addValue
      }
    } else {
      finalStock = parseInt(formData.stock) || 0
    }

    // If stock is 0 or empty, IMEI is optional
    if (finalStock === 0 || isNaN(finalStock)) return true

    // If stock > 0, check IMEI mode
    if (imeiMode === 'same') {
      return formData.imei.trim() !== ''
    } else if (imeiMode === 'different') {
      // Check if all IMEI inputs are filled
      for (let i = 0; i < finalStock; i++) {
        if (!imeiInputs[i] || imeiInputs[i].trim() === '') {
          return false
        }
      }
      return true
    }

    // If imeiMode is null but stock > 0, form is invalid
    return imeiMode !== null
  }

  const handleStockChange = (value: string) => {
    // Update form data with the original input value
    setFormData(prev => ({ ...prev, stock: value }))
    
    // If value contains + and we're in different mode, add IMEI inputs
    if (value.includes('+') && imeiMode === 'different') {
      // Extract the number after +
      const parts = value.split('+')
      const addValue = parseInt(parts[parts.length - 1]) || 0
      
      console.log('Adding IMEI inputs:', { addValue, currentImeiCount: Object.keys(imeiInputs).length, imeiMode })
      
      if (addValue > 0) {
        setImeiInputs(prevInputs => {
          const updatedInputs = { ...prevInputs }
          
          // Find the highest index in existing inputs
          const existingIndices = Object.keys(updatedInputs).map(k => parseInt(k))
          const maxIndex = existingIndices.length > 0 ? Math.max(...existingIndices) : -1
          
          console.log('Max index:', maxIndex, 'Adding from:', maxIndex + 1)
          
          // Add empty inputs starting from maxIndex + 1
          for (let i = 0; i < addValue; i++) {
            updatedInputs[maxIndex + 1 + i] = ''
          }
          
          console.log('Updated inputs count:', Object.keys(updatedInputs).length)
          return updatedInputs
        })
      }
    }
  }

  const handleImeiModeSelect = (mode: 'different' | 'same') => {
    console.log('[INVENTORY] handleImeiModeSelect called:', { mode, currentImeiMode: imeiMode });
    setImeiMode(mode)
    if (mode === 'same') {
      setImeiInputs({})
    } else {
      setFormData({ ...formData, imei: '' })
    }
  }

  const handleImeiInputChange = (index: number, value: string) => {
    setImeiInputs({ ...imeiInputs, [index]: value })
  }

  const handleAddProduct = async () => {
    if (!isFormValid()) {
      setError('Barcha maydonlarni to\'ldirish talab qilinadi')
      return
    }

    const buyPrice = parseFloat(formData.buyPrice)
    const sellPrice = parseFloat(formData.sellPrice)
    
    // Calculate final stock value
    let finalStock = 0
    if (formData.stock.includes('+')) {
      const parts = formData.stock.split('+').filter(p => p.trim() !== '')
      if (parts.length > 0) {
        const addValue = parseInt(parts[parts.length - 1]) || 0
        finalStock = originalStock + addValue
      }
    } else {
      finalStock = parseInt(formData.stock) || 0
    }

    if (isNaN(buyPrice) || buyPrice < 0) {
      setError('Olish narxi to\'g\'ri raqam bo\'lishi kerak')
      return
    }

    if (isNaN(sellPrice) || sellPrice <= 0) {
      setError('Sotish narxi to\'g\'ri raqam bo\'lishi kerak')
      return
    }

    if (isNaN(finalStock) || finalStock < 0) {
      setError('Soni to\'g\'ri raqam bo\'lishi kerak')
      return
    }

    setIsSubmitting(true)
    setError(null)

    // Check if IMEI mode is selected when stock > 0
    if (finalStock > 0 && !imeiMode) {
      setError('IMEI rejimini tanlang: "Har xil" yoki "Bir xil"')
      setIsSubmitting(false)
      return
    }

    // Determine IMEI value based on mode
    let imeiValue = ''
    console.log('[INVENTORY] handleAddProduct:', { imeiMode, finalStock, formDataImei: formData.imei });
    if (finalStock > 0) {
      if (imeiMode === 'same') {
        imeiValue = formData.imei
        console.log('[INVENTORY] Using same IMEI mode:', { imeiValue });
        if (!imeiValue || !imeiValue.trim()) {
          setError('IMEI raqamini kiriting')
          setIsSubmitting(false)
          return
        }
      } else if (imeiMode === 'different') {
        // Create comma-separated IMEI list - only include filled values
        const imeiList = []
        for (let i = 0; i < finalStock; i++) {
          imeiList.push(imeiInputs[i] || '')
        }
        imeiValue = imeiList.join(',')
        console.log('[INVENTORY] Using different IMEI mode:', { imeiValue });
      }
    }
    console.log('[INVENTORY] Final imeiValue:', { imeiValue, finalStock });

    const productData = {
      name: formData.name,
      category: formData.category || 'Boshqa',
      buyPrice: buyPrice,
      sellPrice: sellPrice,
      stock: finalStock,
      imei: imeiValue,
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
      setOriginalStock(0)
      setImeiMode(null)
      setImeiInputs({})
      await fetchProducts()
    } else {
      setError(response.error || (editingId ? 'Mahsulotni tahrirlashda xato' : 'Mahsulot qo\'shishda xato'))
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

  const handleTransferToMainWarehouse = async () => {
    if (!selectedProduct || !transferData.quantity) {
      setError('Miqdorni kiriting')
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

    // Filialdan miqdor kamaytirish
    const updatedProduct = {
      ...selectedProduct,
      stock: selectedProduct.stock - quantity,
    }

    const response1 = await updateProduct(selectedProduct._id, updatedProduct)

    if (response1.success) {
      // Asosiy omborga yangi mahsulot qo'shish
      // Agar bir xil IMEI bo'lsa, avtomatik o'tsin
      const transferImei = imeiArray.length === 1 ? selectedProduct.imei : transferData.selectedImei
      
      const newProduct = {
        name: selectedProduct.name,
        category: selectedProduct.category,
        buyPrice: selectedProduct.buyPrice,
        sellPrice: selectedProduct.sellPrice,
        stock: quantity,
        imei: transferImei,
        branch: 'main-warehouse-000',
        isMainWarehouse: true,
      }

      const response2 = await createProduct(newProduct)

      if (response2.success) {
        setShowTransferModal(false)
        setSelectedProduct(null)
        setTransferData({ quantity: '', selectedImei: '' })
        await fetchProducts()
      } else {
        setError('Asosiy omborga qo\'shishda xato')
      }
    } else {
      setError('Filialdan kamaytirish xatosi')
    }

    setIsSubmitting(false)
  }

  const handleEditProduct = (product: Product) => {
    setEditingId(product._id)
    setOriginalStock(product.stock)
    const branchId = typeof product.branch === 'string' ? product.branch : product.branch._id
    
    // Parse existing IMEIs if they exist
    const existingImeis: IMEIInput = {}
    let detectedMode: 'different' | 'same' | null = null
    
    if (product.imei && product.stock > 0) {
      const imeiArray = product.imei.split(',').map(i => i.trim())
      
      // Determine mode based on existing data
      if (imeiArray.length === 1) {
        // All same IMEI
        detectedMode = 'same'
      } else if (imeiArray.length === product.stock) {
        // Different IMEIs for each product
        detectedMode = 'different'
        imeiArray.forEach((imei, index) => {
          existingImeis[index] = imei
        })
      } else {
        // Partial IMEIs - treat as different mode
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
      branch: branchId,
    })
    
    setImeiMode(detectedMode)
    setImeiInputs(existingImeis)
    setShowModal(true)
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

  const filteredProducts = products
    .filter(p => {
      // Exclude main warehouse products
      if (p.isMainWarehouse === true || p.branch === 'main-warehouse-000') {
        return false
      }
      
      // If branch selected, filter by branch
      if (selectedBranch) {
        return typeof p.branch === 'string' ? p.branch === selectedBranch : p.branch?._id === selectedBranch
      }
      
      // If no branch selected, show all non-main-warehouse products
      return true
    })
    .filter(p => {
      // Calculate available stock based on imeiList
      if (p.imeiList && p.imeiList.length > 0) {
        const availableCount = p.imeiList.filter((item: any) => !item.used).length
        return availableCount > 0
      }
      return p.stock > 0
    })
    .filter(p => 
      p.imei.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

  // Calculate stats for selected branch only
  const branchProductCount = filteredProducts.length
  const branchTotalValue = filteredProducts.reduce((sum, p) => {
    const availableStock = p.imeiList && p.imeiList.length > 0 
      ? p.imeiList.filter((item: any) => !item.used).length 
      : p.stock
    return sum + (p.sellPrice * availableStock)
  }, 0)

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-sm rounded-2xl p-6 border border-white/10 flex-1 mr-4">
            <h1 className="text-3xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Ombor</h1>
            <p className="text-gray-300 mt-1">Inventar boshqarish va monitoring</p>
          </div>
          <div className="flex gap-3 items-center">
            {/* Currency Selector */}
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
                if (branches.length === 0) {
                  setError('Avval filial qo\'shish kerak')
                  return
                }
                setFormData({ name: '', category: '', buyPrice: '', sellPrice: '', stock: '', imei: '', branch: selectedBranch })
                setImeiMode(null)
                setImeiInputs({})
                setShowModal(true)
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-lg font-semibold transition-all hover:shadow-lg hover:shadow-purple-500/30 disabled:opacity-50"
              disabled={branches.length === 0}
            >
              <Plus size={20} />
              Yangi Mahsulot
            </button>
          </div>
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
            <p className="text-3xl font-black text-green-300">{formatPrice(convertPrice(branchTotalValue))}</p>
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
              placeholder="IMEI yoki mahsulot nomi bilan qidirish..."
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
                  <div className="flex justify-between items-center text-sm mb-1">
                    <span className="text-gray-400">Olish:</span>
                    <span className="text-orange-400 font-bold">{formatPrice(convertPrice(product.buyPrice))}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Sotish:</span>
                    <span className="text-green-400 font-bold">{formatPrice(convertPrice(product.sellPrice))}</span>
                  </div>
                </div>

                {/* Stock */}
                <div className="mb-3 px-2 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded text-xs text-cyan-300 text-center">
                  Soni: {product.imeiList && product.imeiList.length > 0 
                    ? product.imeiList.filter((item: any) => !item.used).length 
                    : product.stock} ta
                </div>

                {/* IMEI Badge */}
                {product.imeiList && product.imeiList.length > 0 ? (
                  <div className="mb-3 px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded text-xs text-blue-300 text-center line-clamp-1">
                    {product.imeiList[0]?.imei || 'IMEI yo\'q'}
                  </div>
                ) : product.imei ? (
                  <div className="mb-3 px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded text-xs text-blue-300 text-center line-clamp-1">
                    {product.imei}
                  </div>
                ) : null}

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
            <div className="bg-slate-800/80 backdrop-blur-xl rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col border border-slate-700/50">
              {/* Header */}
              <div className="flex justify-between items-center p-6 border-b border-slate-700/50">
                <h2 className="text-2xl font-bold text-white">{editingId ? 'Mahsulotni Tahrirlash' : 'Yangi Mahsulot'}</h2>
                <button
                  onClick={() => {
                    setShowModal(false)
                    setEditingId(null)
                    setFormData({ name: '', category: '', buyPrice: '', sellPrice: '', stock: '', imei: '', branch: '' })
                    setImeiMode(null)
                    setImeiInputs({})
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6">
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
                  <label className="block text-sm font-medium text-gray-300 mb-2">Olish Narxi</label>
                  <div className="relative">
                    <span className="absolute left-4 top-2 text-gray-400 text-lg">$</span>
                    <input
                      type="number"
                      value={formData.buyPrice}
                      onChange={(e) => setFormData({ ...formData, buyPrice: e.target.value })}
                      className="w-full pl-8 pr-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="0.00"
                    />
                  </div>
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
                  <label className="block text-sm font-medium text-gray-300 mb-2">Soni</label>
                  <input
                    type="text"
                    value={formData.stock}
                    onChange={(e) => handleStockChange(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Masalan: 10 yoki +5 yoki 13+10"
                  />
                  {editingId && formData.stock && (
                    <p className="text-xs text-gray-400 mt-1">
                      {formData.stock.includes('+') 
                        ? (() => {
                            const parts = formData.stock.split('+').filter(p => p.trim() !== '')
                            const addValue = parseInt(parts[parts.length - 1]) || 0
                            const totalStock = originalStock + addValue
                            return `Qo'shiladi: ${addValue} → Jami: ${totalStock} ta`
                          })()
                        : `Jami: ${formData.stock} ta`
                      }
                    </p>
                  )}
                </div>

                {/* IMEI Mode Selection */}
                {formData.stock && parseInt(formData.stock) > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">IMEI Rejimi</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleImeiModeSelect('different')}
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
                        onClick={() => handleImeiModeSelect('same')}
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
                )}

                {/* IMEI Inputs */}
                {imeiMode === 'same' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">IMEI Raqami</label>
                    <input
                      type="text"
                      value={formData.imei}
                      onChange={(e) => setFormData({ ...formData, imei: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Barcha mahsulotlar uchun IMEI"
                    />
                    <p className="text-xs text-gray-400 mt-1">Bu IMEI barcha {formData.stock} ta mahsulotga qo'llaniladi</p>
                  </div>
                )}

                {imeiMode === 'different' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Har bir mahsulot uchun IMEI</label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {(() => {
                        // Calculate the actual stock value for rendering
                        let renderStock = 0
                        if (formData.stock.includes('+')) {
                          const parts = formData.stock.split('+')
                          const addValue = parseInt(parts[parts.length - 1]) || 0
                          renderStock = originalStock + addValue
                        } else {
                          renderStock = parseInt(formData.stock) || 0
                        }
                        
                        return Array.from({ length: renderStock }).map((_, index) => (
                          <input
                            key={index}
                            type="text"
                            value={imeiInputs[index] || ''}
                            onChange={(e) => handleImeiInputChange(index, e.target.value)}
                            className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder={`Mahsulot ${index + 1} uchun IMEI`}
                          />
                        ))
                      })()}
                    </div>
                  </div>
                )}

                {!imeiMode && formData.stock && parseInt(formData.stock) > 0 && (
                  <div className="bg-yellow-500/20 border border-yellow-500/50 rounded p-3 text-yellow-300 text-sm">
                    ⚠️ IMEI rejimini tanlang: "Har xil" yoki "Bir xil"
                  </div>
                )}
                </div>
              </div>

              {/* Footer with Buttons */}
              <div className="border-t border-slate-700/50 p-6 bg-slate-800/50 flex gap-3">
                <button
                  onClick={() => {
                    setShowModal(false)
                    setEditingId(null)
                    setFormData({ name: '', category: '', buyPrice: '', sellPrice: '', stock: '', imei: '', branch: '' })
                    setImeiMode(null)
                    setImeiInputs({})
                  }}
                  className="flex-1 px-4 py-2 border border-slate-600/50 rounded hover:bg-slate-700/50 text-gray-300 font-semibold transition"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleAddProduct}
                  disabled={isSubmitting || !isFormValid()}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Jarayonda...' : editingId ? 'Saqlash' : 'Qo\'shish'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Asosiy omborga kochirish modal */}
        {showTransferModal && selectedProduct && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800/80 backdrop-blur-xl rounded-lg shadow-2xl max-w-md w-full border border-slate-700/50">
              <div className="flex justify-between items-center p-6 border-b border-slate-700/50">
                <h2 className="text-2xl font-bold text-white">Asosiy Omborga Kochirish</h2>
                <button
                  onClick={() => {
                    setShowTransferModal(false)
                    setSelectedProduct(null)
                    setTransferData({ quantity: '', selectedImei: '' })
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
              </div>

              <div className="p-6 border-t border-slate-700/50 flex gap-3">
                <button
                  onClick={() => {
                    setShowTransferModal(false)
                    setSelectedProduct(null)
                    setTransferData({ quantity: '', selectedImei: '' })
                  }}
                  className="flex-1 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 rounded text-white font-semibold transition"
                >
                  Bekor
                </button>
                <button
                  onClick={handleTransferToMainWarehouse}
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
