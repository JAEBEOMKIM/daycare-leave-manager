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

  const id = 'kg-' + crypto.randomUUID().slice(0, 8)

  // RLS(kg_director_insert): director_id=auth.uid() AND status='pending' 만 허용
  const { error: insErr } = await supabase.from('kindergartens').insert({
    id,
    name,
    business_no,
    phone,
    address,
    director_id: user.id,
    status: 'pending',
    active: false,
  })
  if (insErr) redirect('/onboarding/register?error=insert')

  const { error: updErr } = await supabase
    .from('profiles')
    .update({ kindergarten_id: id })
    .eq('id', user.id)
  if (updErr) redirect('/onboarding/register?error=profile')

  redirect('/onboarding/pending')
}
