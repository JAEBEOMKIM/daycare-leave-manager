import { requireDashboardTenant } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/layout/DashboardShell'

// 달력 대시보드 (full-bleed). 세션/테넌트 게이팅 후 tenantId 주입.
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const tenantId = await requireDashboardTenant()
  return (
    <DashboardShell tenantId={tenantId} variant="full-bleed">
      {children}
    </DashboardShell>
  )
}
