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
    <div className="flex flex-col gap-6">
      {/* 페이지 헤더 */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-headline-lg font-bold text-on-surface">어린이집 등록</h1>
          <p className="mt-2 text-body-lg text-on-surface-variant">
            공공데이터에서 어린이집을 검색해 정보를 불러오거나 직접 입력하세요. 등록 후 관리자 승인이 완료되면 이용할 수 있습니다.
          </p>
        </div>
        <Link href="/auth/logout" className="shrink-0 text-label-md text-on-surface-variant hover:text-primary transition-colors">
          로그아웃
        </Link>
      </div>

      <RegisterForm errorCode={error} />
    </div>
  )
}
