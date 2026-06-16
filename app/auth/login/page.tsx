'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogIn, Mail, Lock } from 'lucide-react'

export const dynamic = 'force-dynamic'

function LoginForm() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(
        authError.message === 'Invalid login credentials'
          ? '이메일 또는 비밀번호가 올바르지 않습니다'
          : authError.message
      )
      setLoading(false)
      return
    }

    window.location.href = searchParams.get('next') || '/'
  }

  // Google·Kakao 는 Supabase 네이티브 OAuth (안전)
  const handleOAuth = async (provider: 'google' | 'kakao') => {
    setLoading(true)
    const supabase = createClient()
    const next = searchParams.get('next') || '/'
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    })
    if (oauthError) {
      setError(oauthError.message)
      setLoading(false)
    }
  }

  // 네이버는 Supabase 미지원 → 커스텀 라우트 유지
  const handleNaverLogin = () => {
    window.location.href = `/api/auth/naver?redirect=${encodeURIComponent(searchParams.get('next') || '/')}`
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-deep px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-container mb-4">
            <span className="text-on-primary text-3xl font-bold font-hanken">어</span>
          </div>
          <h1 className="font-hanken text-headline-lg text-on-surface mb-2">
            어린이집 연차관리
          </h1>
          <p className="font-inter text-body-md text-on-surface-variant">
            원장님을 위한 연차 관리 시스템
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-error-red/20 border border-error-red rounded-lg">
            <p className="font-inter text-body-sm text-error-red">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSignIn} className="space-y-4 mb-6">
          {/* Email Input */}
          <div>
            <label className="block font-inter text-label-md text-on-surface mb-2">
              이메일
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-on-surface-variant" size={20} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full pl-10 pr-4 py-3 bg-surface-container border border-border-subtle rounded-lg font-inter text-body-sm text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                disabled={loading}
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block font-inter text-label-md text-on-surface mb-2">
              비밀번호
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-on-surface-variant" size={20} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-surface-container border border-border-subtle rounded-lg font-inter text-body-sm text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                disabled={loading}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-on-primary rounded-lg font-inter text-label-md font-bold btn-glow hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <LogIn size={18} />
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-border-subtle"></div>
          <span className="font-inter text-label-sm text-on-surface-variant">또는</span>
          <div className="flex-1 h-px bg-border-subtle"></div>
        </div>

        {/* Social Login */}
        <div className="space-y-3 mb-8">
          <button
            onClick={() => handleOAuth('google')}
            disabled={loading}
            className="w-full py-3 bg-white text-gray-700 border border-border-subtle rounded-lg font-inter text-label-md font-bold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Google로 로그인
          </button>
          <button
            onClick={() => handleOAuth('kakao')}
            disabled={loading}
            className="w-full py-3 bg-yellow-400 text-black rounded-lg font-inter text-label-md font-bold hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            카카오로 로그인
          </button>
          <button
            onClick={handleNaverLogin}
            disabled={loading}
            className="w-full py-3 bg-green-500 text-white rounded-lg font-inter text-label-md font-bold hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            네이버로 로그인
          </button>
        </div>

        {/* Footer */}
        <div className="text-center text-on-surface-variant text-body-sm font-inter">
          <p>
            계정이 없으신가요?{' '}
            <Link
              href="/auth/signup"
              className="text-primary hover:underline font-semibold"
            >
              가입하기
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-surface-deep">
        <p className="font-inter text-body-md text-on-surface">로딩 중...</p>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
