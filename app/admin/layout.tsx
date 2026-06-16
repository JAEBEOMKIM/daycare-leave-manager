import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSessionProfile } from '@/lib/supabase/server'
import { Building2, LogOut } from 'lucide-react'

// 총괄관리자 전용 영역. role='admin' 이 아니면 차단.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getSessionProfile()
  if (!profile) redirect('/auth/login')
  if (profile.role !== 'admin') redirect('/')

  return (
    <div className="min-h-screen bg-background">
      <header className="h-16 bg-surface-white border-b border-outline-variant flex items-center justify-between px-6">
        <div className="flex items-center gap-2 text-primary">
          <Building2 size={22} />
          <span className="text-title-md font-bold text-on-surface">관리자 콘솔</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-label-sm text-on-surface-variant">{profile.email}</span>
          <Link href="/auth/logout" className="inline-flex items-center gap-1.5 text-label-sm text-on-surface-variant hover:text-error transition-colors">
            <LogOut size={16} /> 로그아웃
          </Link>
        </div>
      </header>
      <nav className="bg-surface-white border-b border-outline-variant px-6">
        <Link href="/admin/daycares" className="inline-block px-3 py-3 text-label-md font-medium text-primary border-b-2 border-primary">
          어린이집 관리
        </Link>
      </nav>
      <main className="p-6">{children}</main>
    </div>
  )
}
