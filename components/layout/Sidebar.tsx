'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useStaffStore, positionName } from '@/lib/staff-store'
import {
  LayoutDashboard,
  CalendarDays,
  BarChart3,
  Users,
  User,
  Settings,
  HelpCircle,
  Plus,
  CalendarCheck,
  ClipboardList,
  X,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: '대시보드', icon: LayoutDashboard },
  { href: '/statistics', label: '통계', icon: BarChart3 },
  { href: '/staff', label: '직원관리', icon: Users },
  { href: '/individual', label: '개인별조회', icon: User },
  { href: '/requests', label: '신청내역', icon: ClipboardList },
  { href: '/settings', label: '설정', icon: Settings },
]

interface SidebarProps {
  open?: boolean
  onClose?: () => void
}

export function Sidebar({ open = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const store = useStaffStore()

  // 원장(직급명 '원장')을 우선 표시, 없으면 첫 재직 직원
  const director =
    store.staff.find(
      (s) => positionName(store, s.position_id) === '원장' && s.status !== '퇴사'
    ) ??
    store.staff.find((s) => positionName(store, s.position_id) === '원장') ??
    store.staff[0]
  const directorName = director?.name ?? '관리자'
  const directorRole = director ? positionName(store, director.position_id) : '원장'
  const directorPhoto = director?.photo_url

  const isActive = (href: string) =>
    href === '/dashboard'
      ? pathname === '/dashboard' || pathname === '/'
      : pathname.startsWith(href)

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={`fixed left-0 top-0 bottom-0 z-50 flex flex-col p-4 w-[280px] h-screen bg-surface-white border-r border-outline-variant transition-transform duration-300 md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="px-4 mb-6 mt-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-on-primary">
              <CalendarCheck size={22} />
            </div>
            <div>
              <h1 className="text-title-lg font-bold text-primary leading-tight">연차관리시스템</h1>
              <p className="text-label-sm text-secondary opacity-70">LeaveSync</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden p-1 rounded-lg hover:bg-surface-container-low text-on-surface-variant"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-4 px-4 py-2 rounded-lg transition-all duration-200 ${
                  active
                    ? 'text-primary bg-secondary-container font-semibold active:scale-[0.98]'
                    : 'text-on-surface-variant hover:bg-surface-container-low'
                }`}
              >
                <Icon size={20} />
                <span className="font-label-md text-label-md">{item.label}</span>
              </Link>
            )
          })}

          {/* Apply Leave */}
          <div className="pt-6 px-2">
            <Link
              href="/leave"
              onClick={onClose}
              className="w-full bg-primary-container text-on-primary-container text-label-md py-3 rounded-lg flex items-center justify-center gap-2 shadow-sm hover:opacity-90 transition-all active:scale-[0.98]"
            >
              <Plus size={18} />
              연차등록
            </Link>
          </div>
        </nav>

        {/* Bottom */}
        <div className="mt-auto space-y-1 border-t border-outline-variant pt-4">
          <a
            href="#"
            className="flex items-center gap-4 text-on-surface-variant hover:bg-surface-container-low px-4 py-2 rounded-lg transition-colors duration-200"
          >
            <HelpCircle size={20} />
            <span className="font-label-md text-label-md">지원</span>
          </a>

          <div className="px-4 pt-4 flex items-center gap-3">
            {directorPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={directorPhoto}
                alt={directorName}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary font-bold flex-shrink-0">
                {directorName.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-label-md text-label-md text-on-surface truncate">{directorName}</p>
              <p className="text-[10px] text-secondary truncate">{directorRole}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
