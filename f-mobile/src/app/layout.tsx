import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'F-Mobile Do\'kon Boshqaruv Tizimi',
  description: 'Professional do\'kon boshqaruv tizimi',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="uz" className="dark">
      <body className="dark bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">{children}</body>
    </html>
  )
}
