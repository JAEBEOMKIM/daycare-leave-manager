import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component에서 호출된 경우 무시
          }
        },
      },
    }
  )
}

export async function createAdminClient() {
  const { createClient } = await import('@supabase/supabase-js')
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export interface SessionProfile {
  userId: string
  email: string | null
  role: 'director' | 'admin'
  kindergartenId: string | null
  profileStatus: string
  tenantStatus: string | null // kindergartens.status
  tenantActive: boolean
  validUntil: string | null
}

/**
 * 현재 세션 사용자 + profiles + (원장이면) kindergartens 상태를 조회.
 * 미인증이면 null. 미들웨어/레이아웃/관리자 게이팅에 사용.
 */
export async function getSessionProfile(): Promise<SessionProfile | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  // allowlist 이메일이면 admin 자동 승격(프로필 보장). 미생성 함수면 조용히 무시.
  try {
    await supabase.rpc('sync_my_role')
  } catch {
    /* noop */
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, kindergarten_id, status')
    .eq('id', user.id)
    .maybeSingle()

  let tenantStatus: string | null = null
  let tenantActive = false
  let validUntil: string | null = null
  const kindergartenId = (profile?.kindergarten_id as string | null) ?? null

  if (kindergartenId) {
    const { data: kg } = await supabase
      .from('kindergartens')
      .select('status, active, valid_until')
      .eq('id', kindergartenId)
      .maybeSingle()
    if (kg) {
      tenantStatus = kg.status as string
      tenantActive = !!kg.active
      validUntil = (kg.valid_until as string | null) ?? null
    }
  }

  return {
    userId: user.id,
    email: user.email ?? null,
    role: ((profile?.role as string) ?? 'director') as 'director' | 'admin',
    kindergartenId,
    profileStatus: (profile?.status as string) ?? 'pending',
    tenantStatus,
    tenantActive,
    validUntil,
  }
}

/**
 * 대시보드 진입 게이팅: 미인증→login, 원장 미승인/정지/만료→온보딩.
 * 통과 시 사용할 tenantId 반환(관리자는 null). 서버 레이아웃 공용.
 */
export async function requireDashboardTenant(): Promise<string | null> {
  const profile = await getSessionProfile()
  if (!profile) redirect('/auth/login')

  // 관리자는 (테넌트별) 대시보드 대신 관리자 콘솔로. 특정 어린이집 열람 기능은 추후.
  if (profile.role === 'admin') redirect('/admin/daycares')

  if (!profile.kindergartenId) redirect('/onboarding/register')
  if (profile.tenantStatus === 'pending') redirect('/onboarding/pending')
  if (profile.tenantStatus === 'rejected') redirect('/onboarding/rejected')
  const expired = profile.validUntil
    ? profile.validUntil < new Date().toISOString().slice(0, 10)
    : false
  if (profile.tenantStatus === 'suspended' || !profile.tenantActive || expired) {
    redirect('/onboarding/suspended')
  }
  return profile.kindergartenId
}
