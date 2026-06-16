import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSessionProfile } from '@/lib/supabase/server'
import { registerKindergarten } from './actions'

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
        운영하시는 어린이집 정보를 입력해 주세요. 등록 후 관리자 승인이 완료되면 이용할 수 있습니다.
      </p>

      {error ? (
        <p className="mt-4 rounded-lg bg-error-red/15 border border-error-red/30 px-4 py-2 text-body-sm text-error-red">
          {error === 'name' ? '어린이집 이름을 입력해 주세요.' : '등록 중 오류가 발생했습니다. 다시 시도해 주세요.'}
        </p>
      ) : null}

      <form action={registerKindergarten} className="mt-6 space-y-4">
        <div>
          <label className="block text-label-md font-medium text-on-surface mb-1">어린이집 이름 <span className="text-error">*</span></label>
          <input name="name" required placeholder="예: 구립아이솔 어린이집" className="w-full rounded-lg border border-outline-variant px-4 py-2.5 text-body-md outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
        </div>
        <div>
          <label className="block text-label-md font-medium text-on-surface mb-1">사업자등록번호</label>
          <input name="business_no" placeholder="000-00-00000" className="w-full rounded-lg border border-outline-variant px-4 py-2.5 text-body-md outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
        </div>
        <div>
          <label className="block text-label-md font-medium text-on-surface mb-1">전화번호</label>
          <input name="phone" placeholder="02-000-0000" className="w-full rounded-lg border border-outline-variant px-4 py-2.5 text-body-md outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
        </div>
        <div>
          <label className="block text-label-md font-medium text-on-surface mb-1">주소</label>
          <input name="address" placeholder="시/군/구 ..." className="w-full rounded-lg border border-outline-variant px-4 py-2.5 text-body-md outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
        </div>
        <button type="submit" className="w-full py-3 rounded-lg bg-primary text-on-primary font-label-md font-semibold hover:opacity-90 transition-opacity">
          등록하고 승인 요청
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link href="/auth/logout" className="text-body-sm text-on-surface-variant hover:underline">로그아웃</Link>
      </div>
    </div>
  )
}
