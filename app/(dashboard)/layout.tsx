'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { StoreHydrator } from '@/components/StoreHydrator'

export default function DashboardGroupLayout({
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

        {/* 좌측 상단 정렬 + 적정 패딩, 넘칠 경우 내부 스크롤 */}
        <main className="flex-1 overflow-auto custom-scrollbar">
          <div className="px-6 md:px-8 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
