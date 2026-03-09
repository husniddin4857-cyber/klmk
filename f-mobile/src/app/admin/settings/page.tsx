'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/layouts/AdminLayout'
import { Settings, Save, Lock, Bell, Globe, Database } from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState({
    companyName: 'F-Mobile',
    email: 'admin@f-mobile.uz',
    phone: '+998 71 123 45 67',
    currency: 'USD',
    language: 'uz',
    notifications: true,
    emailNotifications: true,
    darkMode: true,
    backupEnabled: true,
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('adminToken')
      if (!token) {
        router.push('/')
      }
    }
  }, [router])

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-teal-600/20 to-cyan-600/20 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <h1 className="text-3xl font-black bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">Sozlamalar</h1>
          <p className="text-gray-300 mt-1">Tizim sozlamalarini konfiguratsiya qilish</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
              <div className="space-y-2 p-4">
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-teal-600/30 border border-teal-500/50 text-teal-300 font-semibold transition-all">
                  <Globe size={20} />
                  Umumiy
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white font-semibold transition-all">
                  <Bell size={20} />
                  Bildirishnomalar
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white font-semibold transition-all">
                  <Lock size={20} />
                  Xavfsizlik
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white font-semibold transition-all">
                  <Database size={20} />
                  Ma'lumotlar
                </button>
              </div>
            </div>
          </div>

          {/* Right Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* General Settings */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-teal-400" />
                Umumiy Sozlamalar
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Kompaniya Nomi</label>
                  <input type="text" value={settings.companyName} onChange={(e) => setSettings({ ...settings, companyName: e.target.value })} className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                  <input type="email" value={settings.email} onChange={(e) => setSettings({ ...settings, email: e.target.value })} className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Telefon</label>
                  <input type="tel" value={settings.phone} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Valyuta</label>
                    <select value={settings.currency} onChange={(e) => setSettings({ ...settings, currency: e.target.value })} className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all">
                      <option value="USD" className="bg-slate-900">USD</option>
                      <option value="UZS" className="bg-slate-900">UZS</option>
                      <option value="EUR" className="bg-slate-900">EUR</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Til</label>
                    <select value={settings.language} onChange={(e) => setSettings({ ...settings, language: e.target.value })} className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all">
                      <option value="uz" className="bg-slate-900">O'zbek</option>
                      <option value="ru" className="bg-slate-900">Русский</option>
                      <option value="en" className="bg-slate-900">English</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5 text-purple-400" />
                Bildirishnomalar
              </h2>
              <div className="space-y-4">
                <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition cursor-pointer">
                  <input type="checkbox" checked={settings.notifications} onChange={(e) => setSettings({ ...settings, notifications: e.target.checked })} className="w-4 h-4 rounded accent-purple-500" />
                  <span className="text-gray-300">Tizim bildirishnomalarini yoqish</span>
                </label>
                <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition cursor-pointer">
                  <input type="checkbox" checked={settings.emailNotifications} onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })} className="w-4 h-4 rounded accent-purple-500" />
                  <span className="text-gray-300">Email bildirishnomalarini yoqish</span>
                </label>
              </div>
            </div>

            {/* Security Settings */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5 text-red-400" />
                Xavfsizlik
              </h2>
              <div className="space-y-4">
                <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition cursor-pointer">
                  <input type="checkbox" checked={settings.darkMode} onChange={(e) => setSettings({ ...settings, darkMode: e.target.checked })} className="w-4 h-4 rounded accent-red-500" />
                  <span className="text-gray-300">Qora rejim (Dark Mode)</span>
                </label>
                <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition cursor-pointer">
                  <input type="checkbox" checked={settings.backupEnabled} onChange={(e) => setSettings({ ...settings, backupEnabled: e.target.checked })} className="w-4 h-4 rounded accent-red-500" />
                  <span className="text-gray-300">Avtomatik zaxira nusxasini yoqish</span>
                </label>
                <button className="w-full px-4 py-2 border border-red-500/30 text-red-300 hover:bg-red-500/20 rounded-lg transition font-semibold">
                  Parolni O'zgartirish
                </button>
              </div>
            </div>

            {/* Save Button */}
            <button onClick={handleSave} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white rounded-xl transition-all hover:shadow-lg hover:shadow-teal-500/30 font-semibold">
              <Save size={20} />
              Saqlash
            </button>

            {saved && (
              <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-xl text-green-300 text-center font-semibold">
                ✓ Sozlamalar muvaffaqiyatli saqlandi
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
