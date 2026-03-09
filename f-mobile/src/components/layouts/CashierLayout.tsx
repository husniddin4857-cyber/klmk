'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Menu, X, LayoutDashboard, Clock, Users, LogOut, ChevronDown, ShoppingBag } from 'lucide-react'

interface CashierLayoutProps {
  children: React.ReactNode
}

export default function CashierLayout({ children }: CashierLayoutProps) {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [cashierName, setCashierName] = useState('Kassir')
  const [branchName, setBranchName] = useState('Filial')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const name = localStorage.getItem('cashierName') || 'Kassir'
      const branch = localStorage.getItem('branchName') || 'Filial'
      setCashierName(name)
      setBranchName(branch)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('cashierToken')
    localStorage.removeItem('userRole')
    localStorage.removeItem('branchId')
    router.push('/')
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-gradient-to-b from-teal-900/40 to-slate-950 border-r border-white/10 text-white flex-col shadow-2xl backdrop-blur-xl">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-cyan-400">F-Mobile</h1>
          <p className="text-teal-300/70 text-xs mt-1">Kassir Panel</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <Link href="/cashier/customers" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-all duration-200 group border border-transparent hover:border-teal-500/50">
            <Users size={20} className="group-hover:scale-110 transition-transform text-teal-400" />
            <span className="font-medium">Mijozlar</span>
          </Link>
          <Link href="/cashier/street-sale" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-all duration-200 group border border-transparent hover:border-teal-500/50">
            <ShoppingBag size={20} className="group-hover:scale-110 transition-transform text-teal-400" />
            <span className="font-medium">Ko'chaga Sotuv</span>
          </Link>
          <Link href="/cashier/history" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-all duration-200 group border border-transparent hover:border-teal-500/50">
            <Clock size={20} className="group-hover:scale-110 transition-transform text-teal-400" />
            <span className="font-medium">Savdo Tarixи</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-all border border-transparent hover:border-white/20"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-cyan-400 rounded-full flex items-center justify-center text-slate-900 font-bold">
              {cashierName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold">{cashierName}</p>
              <p className="text-xs text-teal-300/70">{branchName}</p>
            </div>
            <ChevronDown size={16} className={`transition-transform text-teal-400 ${profileOpen ? 'rotate-180' : ''}`} />
          </button>

          {profileOpen && (
            <div className="mt-2 bg-white/10 rounded-lg p-2 space-y-1 border border-white/10 backdrop-blur-sm">
              <button className="w-full text-left px-4 py-2 hover:bg-white/20 rounded text-sm transition-colors text-gray-300">
                Profil
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 hover:bg-red-500/20 rounded text-sm flex items-center gap-2 transition-colors text-red-400"
              >
                <LogOut size={16} />
                Chiqish
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
          <aside className="absolute left-0 top-0 h-full w-64 bg-gradient-to-b from-teal-900/40 to-slate-950 border-r border-white/10 text-white flex flex-col shadow-2xl z-50 backdrop-blur-xl">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-cyan-400">F-Mobile</h1>
                <p className="text-teal-300/70 text-xs mt-1">Kassir Panel</p>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1 hover:bg-white/10 rounded">
                <X size={24} />
              </button>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              <Link href="/cashier/customers" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-all duration-200 border border-transparent hover:border-teal-500/50">
                <Users size={20} className="text-teal-400" />
                <span className="font-medium">Mijozlar</span>
              </Link>
              <Link href="/cashier/street-sale" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-all duration-200 border border-transparent hover:border-teal-500/50">
                <ShoppingBag size={20} className="text-teal-400" />
                <span className="font-medium">Ko'chaga Sotuv</span>
              </Link>
              <Link href="/cashier/history" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-all duration-200 border border-transparent hover:border-teal-500/50">
                <Clock size={20} className="text-teal-400" />
                <span className="font-medium">Savdo Tarixи</span>
              </Link>
            </nav>

            <div className="p-4 border-t border-white/10">
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:shadow-lg hover:shadow-red-500/50 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2"
              >
                <LogOut size={16} />
                Chiqish
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-gradient-to-r from-white/10 to-white/5 border-b border-white/10 shadow-lg px-4 md:px-6 py-4 flex items-center justify-between sticky top-0 z-30 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-white/10 rounded-lg transition"
            >
              <Menu size={24} className="text-teal-400" />
            </button>
            <h2 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-cyan-400">Kassir Panel</h2>
          </div>

          <button
            onClick={handleLogout}
            className="px-3 md:px-4 py-2 text-red-400 hover:bg-red-500/20 rounded-lg transition text-sm md:text-base font-medium border border-red-500/30 hover:border-red-500/60"
          >
            Chiqish
          </button>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
