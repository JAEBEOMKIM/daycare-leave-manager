'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { StoreHydrator } from '@/components/StoreHydrator'

export function DashboardShell({
  tenantId,
  variant = 'padded',
  children,
}: {
  tenantId: string | null
  variant?: 'padded' | 'full-bleed'
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="h-screen bg-background overflow-hidden">
      <StoreHydrator tenantId={tenantId} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="md:ml-[280px] flex flex-col h-screen overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        {variant === 'full-bleed' ? (
          <div className="flex-1 overflow-hidden">{children}</div>
        ) : (
          <main className="flex-1 overflow-auto custom-scrollbar">
            <div className="px-6 md:px-8 py-6">{children}</div>
          </main>
        )}
      </div>
    </div>
  )
}
