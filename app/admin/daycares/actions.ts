'use server'

import { revalidatePath } from 'next/cache'
import { getSessionProfile, createAdminClient } from '@/lib/supabase/server'

async function assertAdmin() {
  const profile = await getSessionProfile()
  if (!profile || profile.role !== 'admin') throw new Error('forbidden')
}

/** 승인: 어린이집 활성화 + 사용기한 설정 + 원장 프로필 활성화 */
export async function approveDaycare(formData: FormData) {
  await assertAdmin()
  const id = String(formData.get('id') ?? '')
  const validUntil = String(formData.get('valid_until') ?? '').trim() || null
  if (!id) return
  const admin = await createAdminClient()

  const { data: kg } = await admin
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
    .select('director_id')
    .maybeSingle()

  if (kg?.director_id) {
    await admin.from('profiles').update({ status: 'active' }).eq('id', kg.director_id)
  }
  revalidatePath('/admin/daycares')
}

/** 거절 */
export async function rejectDaycare(formData: FormData) {
  await assertAdmin()
  const id = String(formData.get('id') ?? '')
  const reason = String(formData.get('reason') ?? '').trim() || null
  if (!id) return
  const admin = await createAdminClient()
  await admin
    .from('kindergartens')
    .update({ status: 'rejected', active: false, rejected_reason: reason, updated_at: new Date().toISOString() })
    .eq('id', id)
  revalidatePath('/admin/daycares')
}

/** 사용 일시중지 */
export async function suspendDaycare(formData: FormData) {
  await assertAdmin()
  const id = String(formData.get('id') ?? '')
  if (!id) return
  const admin = await createAdminClient()
  await admin
    .from('kindergartens')
    .update({ status: 'suspended', active: false, updated_at: new Date().toISOString() })
    .eq('id', id)
  revalidatePath('/admin/daycares')
}

/** 사용 재개 */
export async function reactivateDaycare(formData: FormData) {
  await assertAdmin()
  const id = String(formData.get('id') ?? '')
  if (!id) return
  const admin = await createAdminClient()
  await admin
    .from('kindergartens')
    .update({ status: 'active', active: true, updated_at: new Date().toISOString() })
    .eq('id', id)
  revalidatePath('/admin/daycares')
}

/** 사용기한(만료일) 변경 */
export async function setValidUntil(formData: FormData) {
  await assertAdmin()
  const id = String(formData.get('id') ?? '')
  const validUntil = String(formData.get('valid_until') ?? '').trim() || null
  if (!id) return
  const admin = await createAdminClient()
  await admin
    .from('kindergartens')
    .update({ valid_until: validUntil, updated_at: new Date().toISOString() })
    .eq('id', id)
  revalidatePath('/admin/daycares')
}
