'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { StoreHydrator } from '@/components/StoreHydrator'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="h-screen bg-background overflow-hidden">
      <StoreHydrator />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="md:ml-[280px] flex flex-col h-screen overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        {/* Full-bleed content (calendar dashboard) */}
        <div className="flex-1 overflow-hidden">{children}</div>
      </div>
    </div>
  )
}
