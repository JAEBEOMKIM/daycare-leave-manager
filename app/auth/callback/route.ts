import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 서버측 코드 교환 (PKCE): @supabase/ssr 가 쿠키에 저장한 code_verifier 를 읽어
// 세션 쿠키를 설정한다. 클라이언트 페이지 교환의 "verifier not found" 문제를 방지.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next') || '/'
  const oauthError =
    searchParams.get('error_description') || searchParams.get('error')

  if (oauthError) {
    return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(oauthError)}`)
  }
  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent('인증 코드를 받지 못했습니다')}`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(error.message)}`)
  }

  const dest = next.startsWith('/') ? next : `/${next}`
  return NextResponse.redirect(`${origin}${dest}`)
}
