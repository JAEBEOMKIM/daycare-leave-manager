'use server'

import { revalidatePath } from 'next/cache'
import { getSessionProfile, createClient } from '@/lib/supabase/server'

// 관리자 권한 확인 후, 일반 인증 클라이언트 반환(kg_admin_write RLS 가 is_admin() 만 허용).
async function adminClient() {
  const profile = await getSessionProfile()
  if (!profile || profile.role !== 'admin') throw new Error('forbidden')
  return createClient()
}

const nowIso = () => new Date().toISOString()
const clean = (v?: string | null) => (v && v.trim() ? v.trim() : null)

export interface ValidityInput {
  id: string
  validFrom?: string | null
  validUntil?: string | null
}

/** 승인: 활성화 + 사용기한(from~to) + 승인일자=현재시간 */
export async function approveDaycare({ id, validFrom, validUntil }: ValidityInput) {
  if (!id) return
  const admin = await adminClient()
  await admin
    .from('kindergartens')
    .update({
      status: 'active',
      active: true,
      approved_at: nowIso(),
      valid_from: clean(validFrom) ?? new Date().toISOString().slice(0, 10),
      valid_until: clean(validUntil),
      rejected_reason: null,
      updated_at: nowIso(),
    })
    .eq('id', id)
  revalidatePath('/admin/daycares')
}

/** 반려: 사유 + 처리일자(approved_at)=현재시간 */
export async function rejectDaycare({ id, reason }: { id: string; reason?: string | null }) {
  if (!id) return
  const admin = await adminClient()
  await admin
    .from('kindergartens')
    .update({
      status: 'rejected',
      active: false,
      rejected_reason: clean(reason),
      approved_at: nowIso(),
      updated_at: nowIso(),
    })
    .eq('id', id)
  revalidatePath('/admin/daycares')
}

/** 사용 일시중지 */
export async function suspendDaycare(id: string) {
  if (!id) return
  const admin = await adminClient()
  await admin
    .from('kindergartens')
    .update({ status: 'suspended', active: false, updated_at: nowIso() })
    .eq('id', id)
  revalidatePath('/admin/daycares')
}

/** 사용 재개: 활성화 + (옵션) 사용기한 갱신 */
export async function reactivateDaycare({ id, validFrom, validUntil }: ValidityInput) {
  if (!id) return
  const admin = await adminClient()
  const patch: Record<string, unknown> = { status: 'active', active: true, updated_at: nowIso() }
  if (validFrom !== undefined) patch.valid_from = clean(validFrom)
  if (validUntil !== undefined) patch.valid_until = clean(validUntil)
  await admin.from('kindergartens').update(patch).eq('id', id)
  revalidatePath('/admin/daycares')
}

/** 사용기한(from~to) 변경 */
export async function setValidity({ id, validFrom, validUntil }: ValidityInput) {
  if (!id) return
  const admin = await adminClient()
  await admin
    .from('kindergartens')
    .update({ valid_from: clean(validFrom), valid_until: clean(validUntil), updated_at: nowIso() })
    .eq('id', id)
  revalidatePath('/admin/daycares')
}
