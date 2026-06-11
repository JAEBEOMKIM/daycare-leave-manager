'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Calendar, BarChart3, Users, Settings, Plus, LogOut } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: '대시보드', icon: LayoutDashboard },
  { href: '/dashboard/statistics', label: '통계', icon: BarChart3 },
  { href: '/dashboard/employees', label: '직원 관리', icon: Users },
  { href: '/dashboard/settings', label: '설정', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <nav className="fixed left-0 top-0 h-screen w-64 hidden md:flex flex-col bg-surface-container-low border-r border-border-subtle z-40 py-8 gap-4">
      {/* Logo */}
      <div className="px-gutter mb-6 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center shrink-0">
          <span className="text-on-primary text-lg font-bold">연</span>
        </div>
        <div>
          <h1 className="font-hanken text-headline-md font-bold text-primary truncate">
            어린이집
          </h1>
          <p className="font-inter text-label-sm text-on-surface-variant truncate">
            연차관리시스템
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 flex flex-col gap-2 px-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group cursor-pointer rounded-lg py-3 px-4 flex items-center gap-3 transition-all ${
                isActive
                  ? 'bg-surface-variant/50 text-primary border-r-4 border-primary'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/30'
              }`}
            >
              <Icon size={20} />
              <span className="font-inter text-label-md">{item.label}</span>
            </Link>
          )
        })}
      </div>

      {/* CTA & Footer */}
      <div className="px-4 mt-auto flex flex-col gap-4">
        <button className="w-full py-3 bg-primary text-on-primary rounded-lg font-inter text-label-md font-bold btn-glow hover:bg-primary/90 transition-colors flex justify-center items-center gap-2">
          <Plus size={18} />
          연차 신청하기
        </button>
        <div className="h-px w-full bg-border-subtle"></div>
        <a
          href="/auth/logout"
          className="flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:text-on-surface font-inter text-label-md"
        >
          <LogOut size={18} />
          로그아웃
        </a>
      </div>
    </nav>
  )
}
