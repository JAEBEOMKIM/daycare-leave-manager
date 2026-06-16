import { redirect } from 'next/navigation'
import { getSessionProfile } from '@/lib/supabase/server'

// 미들웨어가 인증을 보장. 관리자는 관리자 콘솔, 원장은 달력 대시보드로.
export default async function Home() {
  const profile = await getSessionProfile()
  if (profile?.role === 'admin') redirect('/admin/daycares')
  redirect('/dashboard')
}
