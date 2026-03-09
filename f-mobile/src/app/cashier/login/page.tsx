'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Smartphone, ArrowRight, Eye, EyeOff } from 'lucide-react'

export default function CashierLogin() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!username) {
        setError('Foydalanuvchi nomini kiriting')
        setLoading(false)
        return
      }

      if (!password) {
        setError('Parol kiriting')
        setLoading(false)
        return
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'
      
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          password: password
        })
      })

      const data = await response.json()

      if (data.success && data.token) {
        // Kassirning filialini backend dan ol
        const branchId = data.user?.branch?._id || data.user?.branch
        const branchName = data.user?.branch?.name || 'Filial'
        
        if (!branchId) {
          setError('Kassirga filial tayinlanmagan')
          setLoading(false)
          return
        }

        localStorage.setItem('cashierToken', data.token)
        localStorage.setItem('userRole', 'cashier')
        localStorage.setItem('branchId', branchId)
        localStorage.setItem('cashierName', username)
        localStorage.setItem('branchName', branchName)
        
        router.push('/cashier/customers')
      } else {
        setError(data.error || 'Login xatosi')
      }
    } catch (err) {
      setError('API bilan ulanishda xato')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-teal-950 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-green-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] bg-[size:50px_50px] opacity-20"></div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-3xl p-8 border border-white/20 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 shadow-2xl shadow-teal-500/50 mb-4">
              <Smartphone className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-black text-white mb-2">F-Mobile</h1>
            <p className="text-gray-300">Kassir Panel</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Username */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-200">
                Foydalanuvchi Nomi
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all hover:border-white/30"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-200">
                Parol
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all hover:border-white/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-4 text-gray-400 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl backdrop-blur-sm">
                <p className="text-red-200 text-sm font-medium flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                  {error}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold transition-all duration-300 transform flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 hover:shadow-2xl hover:shadow-teal-500/50 disabled:from-teal-600/50 disabled:to-teal-700/50 text-white disabled:opacity-50 hover:scale-105 active:scale-95 border border-white/20"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Kirish...
                </>
              ) : (
                <>
                  Kirish
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Back Button */}
            <button
              type="button"
              onClick={() => router.push('/')}
              className="w-full py-3 rounded-xl font-semibold text-gray-300 hover:text-white border border-white/20 hover:border-white/40 transition-all hover:bg-white/5"
            >
              ← Orqaga qaytish
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-xs mt-8">
          F-Mobile v2.0.0 • © 2026
        </p>
      </div>
    </div>
  )
}
