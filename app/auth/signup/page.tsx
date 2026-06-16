'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { UserPlus, Mail, Lock } from 'lucide-react'

export const dynamic = 'force-dynamic'

function SignupForm() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setInfo('')

    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding/register` },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // 이메일 확인이 꺼져 있으면 즉시 세션 → 어린이집 등록으로
    if (data.session) {
      window.location.href = '/onboarding/register'
      return
    }
    setInfo('확인 메일을 보냈습니다. 메일의 링크로 가입을 완료해 주세요.')
    setLoading(false)
  }

  const handleOAuth = async (provider: 'google' | 'kakao') => {
    setLoading(true)
    const supabase = createClient()
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/onboarding/register`,
      },
    })
    if (oauthError) {
      setError(oauthError.message)
      setLoading(false)
    }
  }

  const handleNaver = () => {
    window.location.href = `/api/auth/naver?redirect=${encodeURIComponent('/onboarding/register')}`
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-deep px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-container mb-4">
            <span className="text-on-primary text-3xl font-bold font-hanken">어</span>
          </div>
          <h1 className="font-hanken text-headline-lg text-on-surface mb-2">원장 회원가입</h1>
          <p className="font-inter text-body-md text-on-surface-variant">
            가입 후 어린이집을 등록하고 승인을 요청하세요.
          </p>
        </div>

        {error ? (
          <div className="mb-6 p-4 bg-error-red/20 border border-error-red rounded-lg">
            <p className="font-inter text-body-sm text-error-red">{error}</p>
          </div>
        ) : null}
        {info ? (
          <div className="mb-6 p-4 bg-success-green/15 border border-success-green/40 rounded-lg">
            <p className="font-inter text-body-sm text-success-green">{info}</p>
          </div>
        ) : null}

        <form onSubmit={handleSignUp} className="space-y-4 mb-6">
          <div>
            <label className="block font-inter text-label-md text-on-surface mb-2">이메일</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={20} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full pl-10 pr-4 py-3 bg-surface-container border border-border-subtle rounded-lg font-inter text-body-sm text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                disabled={loading}
              />
            </div>
          </div>
          <div>
            <label className="block font-inter text-label-md text-on-surface mb-2">비밀번호</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={20} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6자 이상"
                required
                className="w-full pl-10 pr-4 py-3 bg-surface-container border border-border-subtle rounded-lg font-inter text-body-sm text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                disabled={loading}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-on-primary rounded-lg font-inter text-label-md font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <UserPlus size={18} />
            {loading ? '가입 중...' : '이메일로 가입'}
          </button>
        </form>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-border-subtle" />
          <span className="font-inter text-label-sm text-on-surface-variant">또는</span>
          <div className="flex-1 h-px bg-border-subtle" />
        </div>

        <div className="space-y-3 mb-8">
          <button onClick={() => handleOAuth('google')} disabled={loading} className="w-full py-3 bg-white text-gray-700 border border-border-subtle rounded-lg font-inter text-label-md font-bold hover:bg-gray-50 transition-colors disabled:opacity-50">
            Google로 가입
          </button>
          <button onClick={() => handleOAuth('kakao')} disabled={loading} className="w-full py-3 bg-yellow-400 text-black rounded-lg font-inter text-label-md font-bold hover:bg-yellow-500 transition-colors disabled:opacity-50">
            카카오로 가입
          </button>
          <button onClick={handleNaver} disabled={loading} className="w-full py-3 bg-green-500 text-white rounded-lg font-inter text-label-md font-bold hover:bg-green-600 transition-colors disabled:opacity-50">
            네이버로 가입
          </button>
        </div>

        <div className="text-center text-on-surface-variant text-body-sm font-inter">
          <p>
            이미 계정이 있으신가요?{' '}
            <Link href="/auth/login" className="text-primary hover:underline font-semibold">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-surface-deep"><p className="font-inter text-on-surface">로딩 중...</p></div>}>
      <SignupForm />
    </Suspense>
  )
}
