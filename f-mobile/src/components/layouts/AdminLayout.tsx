'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Menu,
  X,
  LayoutDashboard,
  Store,
  Users,
  ShoppingCart,
  LogOut,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  BarChart3,
  DollarSign,
} from 'lucide-react'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter()
  const [profileOpen, setProfileOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('userRole')
    router.push('/')
  }

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' },
    { icon: Store, label: 'Asosiy Ombor', href: '/admin/main-warehouse' },
    { icon: Store, label: 'Ombor', href: '/admin/inventory' },
    { icon: Store, label: 'Filiallar', href: '/admin/branches' },
    { icon: Users, label: 'Kassirlar', href: '/admin/cashiers' },
    { icon: Users, label: 'Mijozlar', href: '/admin/customers' },
    { icon: ShoppingCart, label: 'Savdolar', href: '/admin/sales' },
    { icon: DollarSign, label: 'Kassa', href: '/admin/cashier-register' },
    { icon: TrendingDown, label: 'Qarzdorlar', href: '/admin/debtors' },
    { icon: TrendingDown, label: 'Xarajatlar', href: '/admin/expenses' },
    { icon: DollarSign, label: 'Dollar Kursi', href: '/admin/exchange-rate' },
  ]

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 to-slate-950">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950 text-white flex-col shadow-2xl border-r border-white/10">
        {/* Logo */}
        <div className="p-6 border-b border-white/10 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <span className="text-white font-bold text-lg">F</span>
            </div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">F-Mobile</h1>
          </div>
          <p className="text-blue-300 text-xs mt-1 ml-13">Admin Panel</p>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all duration-200 group border border-transparent hover:border-white/20"
            >
              <item.icon size={20} className="group-hover:scale-110 transition-transform text-blue-400 group-hover:text-cyan-400" />
              <span className="font-medium group-hover:text-cyan-300">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-white/10 bg-gradient-to-r from-blue-600/10 to-cyan-600/10 backdrop-blur-sm">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all border border-transparent hover:border-white/20"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/50">
              A
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-white">Admin</p>
              <p className="text-xs text-blue-300">Administrator</p>
            </div>
            <ChevronDown size={16} className={`transition-transform text-blue-400 ${profileOpen ? 'rotate-180' : ''}`} />
          </button>

          {profileOpen && (
            <div className="mt-2 bg-white/10 backdrop-blur-sm rounded-xl p-2 space-y-1 border border-white/20 animate-in fade-in">
              <button className="w-full text-left px-4 py-2 hover:bg-white/20 rounded-lg text-sm transition-colors text-gray-200 hover:text-white">
                Profil
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 hover:bg-red-500/20 rounded-lg text-sm flex items-center gap-2 transition-colors text-red-300 hover:text-red-200"
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
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
          <aside className="absolute left-0 top-0 h-full w-64 bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950 text-white flex flex-col shadow-2xl z-50 border-r border-white/10">
            {/* Logo */}
            <div className="p-6 border-b border-white/10 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 backdrop-blur-sm flex justify-between items-center">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">F</span>
                  </div>
                  <h1 className="text-2xl font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">F-Mobile</h1>
                </div>
                <p className="text-blue-300 text-xs mt-1 ml-13">Admin Panel</p>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1 hover:bg-white/10 rounded-lg transition">
                <X size={24} />
              </button>
            </div>

            {/* Menu */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all duration-200 border border-transparent hover:border-white/20"
                >
                  <item.icon size={20} className="text-blue-400 hover:text-cyan-400" />
                  <span className="font-medium hover:text-cyan-300">{item.label}</span>
                </Link>
              ))}
            </nav>

            {/* User Profile */}
            <div className="p-4 border-t border-white/10">
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 text-white shadow-lg shadow-red-500/30"
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
        {/* Top Bar */}
        <header className="bg-gradient-to-r from-slate-900/80 to-blue-900/80 backdrop-blur-xl px-4 md:px-6 py-4 flex items-center justify-between sticky top-0 z-30 border-b border-white/10 shadow-lg">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-white/10 rounded-lg transition text-blue-400"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Admin Panel</h2>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleLogout}
              className="px-3 md:px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition text-sm md:text-base font-medium border border-red-500/30 hover:border-red-500/50"
            >
              Chiqish
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-4 md:p-6 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
