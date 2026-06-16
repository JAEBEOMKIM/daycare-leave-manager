import { requireDashboardTenant } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/layout/DashboardShell'

// 서버 컴포넌트: 세션/테넌트 게이팅 후 클라이언트 셸에 tenantId 주입.
export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const tenantId = await requireDashboardTenant()
  return <DashboardShell tenantId={tenantId}>{children}</DashboardShell>
}
