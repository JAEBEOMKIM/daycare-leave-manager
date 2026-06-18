'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function registerKindergarten(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const name = String(formData.get('name') ?? '').trim()
  const business_no = String(formData.get('business_no') ?? '').trim() || null
  const phone = String(formData.get('phone') ?? '').trim() || null
  const address = String(formData.get('address') ?? '').trim() || null
  if (!name) redirect('/onboarding/register?error=name')

  // 검색으로 선택된 표준데이터(있으면) 파싱 → 표준 필드 일괄 저장
  let std: Record<string, unknown> = {}
  try {
    const raw = String(formData.get('standard') ?? '').trim()
    if (raw) std = JSON.parse(raw) as Record<string, unknown>
  } catch {
    std = {}
  }
  const s = (k: string) => {
    const v = std[k]
    return v === undefined || v === null || v === '' ? null : String(v)
  }
  const n = (k: string) => {
    const v = std[k]
    return typeof v === 'number' ? v : v == null || v === '' ? null : Number(v) || null
  }

  const id = 'kg-' + crypto.randomUUID().slice(0, 8)

  // RLS(kg_director_insert): director_id=auth.uid() AND status='pending' 만 허용
  const { error: insErr } = await supabase.from('kindergartens').insert({
    id,
    name,
    business_no,
    phone: phone ?? s('phone'),
    address: address ?? s('address'),
    director_id: user.id,
    status: 'pending',
    active: false,
    // 표준데이터 필드
    sido: s('sido'),
    sigungu: s('sigungu'),
    facility_type: s('facility_type'),
    operation_status: s('operation_status'),
    zipcode: s('zipcode'),
    fax: s('fax'),
    homepage: s('homepage'),
    capacity: n('capacity'),
    current_count: n('current_count'),
    classroom_count: n('classroom_count'),
    classroom_area: n('classroom_area'),
    playground_count: n('playground_count'),
    cctv_count: n('cctv_count'),
    staff_count: n('staff_count'),
    latitude: n('latitude'),
    longitude: n('longitude'),
    commute_vehicle: s('commute_vehicle'),
    approval_date: s('approval_date'),
    rest_start_date: s('rest_start_date'),
    rest_end_date: s('rest_end_date'),
    close_date: s('close_date'),
    data_std_date: s('data_std_date'),
    stcode: s('stcode'),
  })
  if (insErr) redirect('/onboarding/register?error=insert')

  const { error: updErr } = await supabase
    .from('profiles')
    .update({ kindergarten_id: id })
    .eq('id', user.id)
  if (updErr) redirect('/onboarding/register?error=profile')

  redirect('/onboarding/pending')
}
