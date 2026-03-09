'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import CashierLayout from '@/components/layouts/CashierLayout'
import { Banknote } from 'lucide-react'

export default function HandoverPage() {
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('cashierToken')
      if (!token) {
        router.push('/')
      }
    }
  }, [router])

  return (
    <CashierLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kirim Berish</h1>
          <p className="text-gray-600">Pul kirim berish va balans o'zgarishi</p>
        </div>

        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Banknote className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Kirim berish sahifasi tez orada tayyorlangan bo'ladi</p>
        </div>
      </div>
    </CashierLayout>
  )
}
