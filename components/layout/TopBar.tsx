'use client'

import { Bell, Settings } from 'lucide-react'

export function TopBar() {
  return (
    <header className="sticky top-0 z-50 bg-surface-container/40 backdrop-blur-xl border-b border-border-subtle shadow-sm flex justify-between items-center px-margin-mobile md:px-margin-desktop h-16">
      <div className="flex items-center gap-2">
        <h1 className="font-hanken text-headline-md font-bold text-primary">
          어린이집
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <button className="p-2 rounded-full text-on-surface-variant hover:bg-surface-variant/50 transition-colors cursor-pointer active:scale-95">
          <Bell size={20} />
        </button>
        <button className="p-2 rounded-full text-on-surface-variant hover:bg-surface-variant/50 transition-colors cursor-pointer active:scale-95">
          <Settings size={20} />
        </button>
      </div>
    </header>
  )
}
