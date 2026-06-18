import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSessionProfile } from '@/lib/supabase/server'
import { RegisterForm } from './RegisterForm'

export default async function RegisterDaycarePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const profile = await getSessionProfile()
  if (!profile) redirect('/auth/login')
  // 이미 어린이집을 등록한 원장은 상태 화면으로
  if (profile.kindergartenId) redirect('/onboarding/pending')

  const { error } = await searchParams

  return (
    <div className="bg-surface-white rounded-2xl border border-outline-variant shadow-sm p-8">
      <h1 className="text-headline-md font-bold text-on-surface">어린이집 등록</h1>
      <p className="mt-2 text-body-md text-on-surface-variant">
        공공데이터에서 어린이집을 검색해 정보를 불러오거나 직접 입력하세요. 등록 후 관리자 승인이 완료되면 이용할 수 있습니다.
      </p>

      <RegisterForm errorCode={error} />

      <div className="mt-6 text-center">
        <Link href="/auth/logout" className="text-body-sm text-on-surface-variant hover:underline">로그아웃</Link>
      </div>
    </div>
  )
}
