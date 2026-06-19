import { createClient } from '@/lib/supabase/server'
import { AdminDaycaresClient, type Kg } from './AdminDaycaresClient'

export const dynamic = 'force-dynamic'

export default async function AdminDaycaresPage() {
  // 관리자는 is_admin() RLS 로 전체 조회 가능 → 서비스 롤 불필요
  const admin = await createClient()
  const { data: kgs } = await admin
    .from('kindergartens')
    .select('*')
    .order('created_at', { ascending: false })
  const { data: profiles } = await admin.from('profiles').select('id, email')
  const emailById = new Map((profiles ?? []).map((p) => [p.id as string, p.email as string]))

  const daycares: Kg[] = ((kgs ?? []) as Record<string, unknown>[]).map((k) => ({
    id: k.id as string,
    name: (k.name as string) ?? '',
    business_no: (k.business_no as string) ?? null,
    phone: (k.phone as string) ?? null,
    fax: (k.fax as string) ?? null,
    address: (k.address as string) ?? null,
    zipcode: (k.zipcode as string) ?? null,
    homepage: (k.homepage as string) ?? null,
    facility_type: (k.facility_type as string) ?? null,
    operation_status: (k.operation_status as string) ?? null,
    capacity: (k.capacity as number) ?? null,
    current_count: (k.current_count as number) ?? null,
    staff_count: (k.staff_count as number) ?? null,
    cctv_count: (k.cctv_count as number) ?? null,
    classroom_count: (k.classroom_count as number) ?? null,
    playground_count: (k.playground_count as number) ?? null,
    director_id: (k.director_id as string) ?? null,
    directorEmail: k.director_id ? emailById.get(k.director_id as string) ?? null : null,
    status: (k.status as string) ?? 'pending',
    active: !!k.active,
    valid_from: (k.valid_from as string) ?? null,
    valid_until: (k.valid_until as string) ?? null,
    approved_at: (k.approved_at as string) ?? null,
    rejected_reason: (k.rejected_reason as string) ?? null,
    created_at: (k.created_at as string) ?? '',
    stcode: (k.stcode as string) ?? null,
  }))

  return <AdminDaycaresClient daycares={daycares} />
}
