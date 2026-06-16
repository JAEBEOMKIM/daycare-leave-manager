'use server'

import { revalidatePath } from 'next/cache'
import { getSessionProfile, createClient } from '@/lib/supabase/server'

// 관리자 권한 확인 후, 일반 인증 클라이언트 반환(kg_admin_write RLS 가 is_admin() 만 허용).
async function adminClient() {
  const profile = await getSessionProfile()
  if (!profile || profile.role !== 'admin') throw new Error('forbidden')
  return createClient()
}

/** 승인: 어린이집 활성화 + 사용기한 설정 + 원장 프로필 활성화 */
export async function approveDaycare(formData: FormData) {
  const admin = await adminClient()
  const id = String(formData.get('id') ?? '')
  const validUntil = String(formData.get('valid_until') ?? '').trim() || null
  if (!id) return

  // 원장 접근 권한은 kindergartens 상태로 게이팅되므로 profiles.status 갱신은 불필요.
  await admin
    .from('kindergartens')
    .update({
      status: 'active',
      active: true,
      approved_at: new Date().toISOString(),
      valid_from: new Date().toISOString().slice(0, 10),
      valid_until: validUntil,
      rejected_reason: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  revalidatePath('/admin/daycares')
}

/** 거절 */
export async function rejectDaycare(formData: FormData) {
  const admin = await adminClient()
  const id = String(formData.get('id') ?? '')
  const reason = String(formData.get('reason') ?? '').trim() || null
  if (!id) return
  await admin
    .from('kindergartens')
    .update({ status: 'rejected', active: false, rejected_reason: reason, updated_at: new Date().toISOString() })
    .eq('id', id)
  revalidatePath('/admin/daycares')
}

/** 사용 일시중지 */
export async function suspendDaycare(formData: FormData) {
  const admin = await adminClient()
  const id = String(formData.get('id') ?? '')
  if (!id) return
  await admin
    .from('kindergartens')
    .update({ status: 'suspended', active: false, updated_at: new Date().toISOString() })
    .eq('id', id)
  revalidatePath('/admin/daycares')
}

/** 사용 재개 */
export async function reactivateDaycare(formData: FormData) {
  const admin = await adminClient()
  const id = String(formData.get('id') ?? '')
  if (!id) return
  await admin
    .from('kindergartens')
    .update({ status: 'active', active: true, updated_at: new Date().toISOString() })
    .eq('id', id)
  revalidatePath('/admin/daycares')
}

/** 사용기한(만료일) 변경 */
export async function setValidUntil(formData: FormData) {
  const admin = await adminClient()
  const id = String(formData.get('id') ?? '')
  const validUntil = String(formData.get('valid_until') ?? '').trim() || null
  if (!id) return
  await admin
    .from('kindergartens')
    .update({ valid_until: validUntil, updated_at: new Date().toISOString() })
    .eq('id', id)
  revalidatePath('/admin/daycares')
}
