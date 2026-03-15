'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import CashierLayout from '@/components/layouts/CashierLayout'
import { Search, Package, TrendingUp, AlertCircle } from 'lucide-react'
import { getProducts } from '@/lib/api'

interface Product {
  _id: string
  name: string
  category: string
  sellPrice: number
  buyPrice: number
  stock: number
  barcode?: string
  imei?: string
  imeiList?: Array<{ imei: string; used: boolean }>
  branch?: string
}

export default function ProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('cashierToken')
      if (!token) {
        router.push('/cashier/login')
        return
      }
      fetchProducts()
    }
  }, [router])

  const fetchProducts = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const branchId = localStorage.getItem('branchId')
      const params: Record<string, string> = {}
      
      if (branchId) {
        params.branch = branchId
      }
      
      const response = await getProducts(params)
      
      if (response.success && response.data) {
        const productList = Array.isArray(response.data) ? response.data : []
        setProducts(productList)
        setFilteredProducts(productList)
      } else {
        setError(response.error || 'Mahsulotlarni yuklashda xato')
      }
    } catch (err) {
      setError('Mahsulotlarni yuklashda xato')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let result = products

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      result = result.filter(p => {
        const nameMatch = p.name.toLowerCase().includes(searchLower)
        const barcodeMatch = p.barcode?.toLowerCase().includes(searchLower)
        const imeiMatch = p.imeiList?.some(item => item.imei.toLowerCase().includes(searchLower))
        return nameMatch || barcodeMatch || imeiMatch
      })
    }

    setFilteredProducts(result)
  }, [searchTerm, products])

  const getAvailableImeiCount = (product: Product) => {
    if (!product.imeiList) return 0
    return product.imeiList.filter(item => !item.used).length
  }

  const getTotalImeiCount = (product: Product) => {
    return product.imeiList?.length || 0
  }

  return (
    <CashierLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-cyan-400">
              Maxsulotlar
            </h1>
            <p className="text-gray-400 mt-2">Jami: {filteredProducts.length} ta mahsulot</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 backdrop-blur-sm flex items-center gap-3">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-4 w-5 h-5 text-teal-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Mahsulot nomi, barkod yoki IMEKA..."
            className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent backdrop-blur-sm text-white placeholder-gray-400 transition-all"
          />
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Mahsulotlar yuklanimoqda...</p>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Package size={48} className="mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400">Mahsulotlar topilmadi</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredProducts.map(product => (
              <div
                key={product._id}
                className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-lg p-3 hover:border-teal-500/50 hover:shadow-lg hover:shadow-teal-500/20 transition-all duration-300 group flex flex-col"
              >
                {/* Nomi */}
                <h3 className="font-bold text-white text-sm group-hover:text-teal-300 transition-colors line-clamp-2 mb-2">
                  {product.name}
                </h3>

                {/* Sotilish Narxi */}
                <div className="mb-2">
                  <p className="text-xs text-gray-400">Sotilish</p>
                  <p className="text-lg font-bold text-teal-300">${product.sellPrice.toFixed(2)}</p>
                </div>

                {/* IMEKA */}
                {getTotalImeiCount(product) > 0 && (
                  <div className="mb-3 flex-1">
                    <p className="text-xs text-gray-400 mb-1">IMEKA ({getAvailableImeiCount(product)}/{getTotalImeiCount(product)})</p>
                    <div className="space-y-1 max-h-20 overflow-y-auto">
                      {product.imeiList?.filter(item => !item.used).map((item, idx) => (
                        <div
                          key={idx}
                          className="text-xs font-mono p-1 rounded bg-green-500/20 text-green-300 truncate"
                        >
                          {item.imei}
                        </div>
                      ))}
                    </div>
                  </div>
                )}


              </div>
            ))}
          </div>
        )}
      </div>
    </CashierLayout>
  )
}
