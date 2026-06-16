import { redirect } from 'next/navigation'
import { getSessionProfile } from '@/lib/supabase/server'

// 온보딩(어린이집 등록/승인 대기). 인증 필요, 관리자는 관리자 화면으로.
export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getSessionProfile()
  if (!profile) redirect('/auth/login')
  if (profile.role === 'admin') redirect('/admin/daycares')

  return (
    <div className="min-h-screen bg-surface-deep flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">{children}</div>
    </div>
  )
}
