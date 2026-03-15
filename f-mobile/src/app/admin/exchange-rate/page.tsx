'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/layouts/AdminLayout'
import { DollarSign, Check, X } from 'lucide-react'

interface ExchangeRate {
  _id: string
  currency: string
  rate: number
  date: string
}

export default function ExchangeRatePage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [currentRate, setCurrentRate] = useState<ExchangeRate | null>(null)
  const [loading, setLoading] = useState(true)
  const [newRate, setNewRate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'
      const token = localStorage.getItem('adminToken')

      const currentRes = await fetch(`${apiUrl}/exchange-rate/current`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const currentData = await currentRes.json()

      if (currentData.success && currentData.data) {
        setCurrentRate(currentData.data)
        // Convert 1$ rate to 100$ rate for display
        setNewRate((currentData.data.rate * 100).toString())
      }
    } catch (err) {
      setError('Ma\'lumotlarni yuklashda xato')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateRate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newRate) {
      setError('Kurs miqdori talab qilinadi')
      return
    }

    // Remove formatting dots and convert to number
    const rateValue100 = parseFloat(newRate.replace(/\./g, ''))

    if (isNaN(rateValue100) || rateValue100 <= 0) {
      setError('Kurs miqdori noto\'g\'ri')
      return
    }

    // Convert 100$ rate to 1$ rate for storage
    const rateValue = rateValue100 / 100

    setIsSubmitting(true)
    setError(null)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'
      const token = localStorage.getItem('adminToken')

      const response = await fetch(`${apiUrl}/exchange-rate/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          rate: rateValue,
          notes: ''
        })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Dollar kursi muvaffaqiyatli yangilandi!')
        setCurrentRate(data.data)
        setTimeout(() => setSuccess(null), 3000)
        fetchData()
      } else {
        setError(data.error || 'Kursni yangilashda xato')
      }
    } catch (err) {
      setError('Kursni yangilashda xato')
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Ma\'lumotlar yuklanimoqda...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-2xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Dollar Kursi</h1>
          <p className="text-gray-400 mt-1">USD to UZS exchange rate</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-4 rounded-lg flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="p-1 hover:bg-red-500/20 rounded">
              <X size={20} />
            </button>
          </div>
        )}

        {success && (
          <div className="bg-green-500/20 border border-green-500/50 text-green-200 p-4 rounded-lg flex items-center gap-2">
            <Check size={20} />
            <span>{success}</span>
          </div>
        )}

        {/* Current Rate Card */}
        {currentRate && (
          <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-500/30 rounded-lg p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Joriy Dollar Kursi</p>
                <p className="text-5xl font-bold text-green-400 mt-2">
                  100 $ = {(currentRate.rate * 100).toLocaleString('uz-UZ')} so'm
                </p>
              </div>
              <DollarSign size={64} className="text-green-500 opacity-30" />
            </div>
          </div>
        )}

        {/* Update Form */}
        <div className="bg-slate-800/50 border border-white/10 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-6">Kursni Yangilash</h2>
          
          <form onSubmit={handleUpdateRate} className="space-y-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Yangi Kurs (100 $ = ? so'm)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={newRate}
                onChange={(e) => {
                  let value = e.target.value
                  
                  // Remove all non-digit characters
                  const digitsOnly = value.replace(/\D/g, '')
                  
                  // Limit to 9 digits (for 100$ rate)
                  if (digitsOnly.length > 9) {
                    return
                  }
                  
                  // Format with thousand separators (nuqtalar)
                  // Masalan: 1220000 -> 1.220.000
                  let formatted = ''
                  for (let i = 0; i < digitsOnly.length; i++) {
                    if (i > 0 && (digitsOnly.length - i) % 3 === 0) {
                      formatted += '.'
                    }
                    formatted += digitsOnly[i]
                  }
                  
                  setNewRate(formatted)
                }}
                className="w-full bg-slate-700/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 text-lg font-semibold"
                placeholder="122.000.000 yoki 1.200.000"
              />
              <p className="text-gray-400 text-xs mt-2">Masalan: 1.200.000 (100$ = 1 mln 200 ming so'm)</p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-lg hover:shadow-green-500/50 transition-all disabled:opacity-50 font-semibold flex items-center justify-center gap-2"
            >
              <Check size={20} />
              {isSubmitting ? 'Yangilanimoqda...' : 'Kursni Yangilash'}
            </button>
          </form>
        </div>
      </div>
    </AdminLayout>
  )
}
