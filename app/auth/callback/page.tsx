'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

function AuthCallbackContent() {
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const supabase = createClient()

        // Exchange code for session
        const code = searchParams.get('code')
        const next = searchParams.get('next') || '/dashboard'

        if (!code) {
          setError('인증 코드를 받지 못했습니다')
          return
        }

        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (error) {
          setError(error.message)
          return
        }

        // Redirect to next page
        window.location.href = next
      } catch (err) {
        setError(err instanceof Error ? err.message : '알 수 없는 오류 발생')
      }
    }

    handleCallback()
  }, [searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-deep">
      <div className="text-center">
        <div className="mb-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
        <h1 className="font-hanken text-headline-md text-on-surface mb-2">
          로그인 중
        </h1>
        <p className="font-inter text-body-md text-on-surface-variant">
          잠시만 기다려주세요...
        </p>
        {error && (
          <p className="font-inter text-body-md text-error-red mt-4">{error}</p>
        )}
      </div>
    </div>
  )
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-surface-deep">
        <div className="text-center">
          <div className="mb-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
          <p className="font-inter text-body-md text-on-surface">로딩 중...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}
