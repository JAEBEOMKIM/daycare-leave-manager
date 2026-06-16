import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// 네이버는 Supabase 네이티브 미지원 → 커스텀 OAuth 후 service-role 로
// Supabase 사용자 생성 + 매직링크 토큰으로 세션 수립 (provider-id-비번 방식 폐기).
export async function GET(request: NextRequest) {
  const origin = new URL(request.url).origin
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=no_code`)
  }

  let redirectTo = '/'
  try {
    if (state) {
      const decoded = JSON.parse(Buffer.from(state, 'base64').toString())
      redirectTo = decoded.redirect || '/'
    }
  } catch {
    /* 기본값 사용 */
  }

  try {
    // 1) 네이버 토큰 교환
    const tokenResponse = await fetch('https://nid.naver.com/oauth2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.NEXT_PUBLIC_NAVER_CLIENT_ID || '',
        client_secret: process.env.NAVER_CLIENT_SECRET || '',
        code,
        state: state ?? '',
      }).toString(),
    })
    if (!tokenResponse.ok) throw new Error('Failed to get token from Naver')
    const tokenData = await tokenResponse.json()

    // 2) 네이버 사용자 정보
    const userResponse = await fetch('https://openapi.naver.com/v1/nid/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    if (!userResponse.ok) throw new Error('Failed to get user info from Naver')
    const userData = await userResponse.json()
    const naverId = userData.response?.id
    const email = userData.response?.email
    const nickname = userData.response?.nickname

    if (!email) {
      return NextResponse.redirect(`${origin}/auth/login?error=no_email`)
    }

    const admin = await createAdminClient()

    // 3) Supabase 사용자 보장 (없으면 생성 → handle_new_user 트리거가 profiles 생성)
    await admin.auth.admin
      .createUser({
        email,
        email_confirm: true,
        user_metadata: { provider: 'naver', naver_id: naverId, display_name: nickname || email.split('@')[0] },
      })
      .catch(() => {
        /* 이미 존재하면 무시 */
      })

    // 4) 매직링크 토큰 발급 → 현재 브라우저에 세션 쿠키 수립
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    })
    if (linkErr || !linkData?.properties?.hashed_token) {
      throw linkErr || new Error('Failed to generate session link')
    }

    const supabase = await createClient()
    const { error: verifyErr } = await supabase.auth.verifyOtp({
      type: 'magiclink',
      token_hash: linkData.properties.hashed_token,
    })
    if (verifyErr) throw verifyErr

    return NextResponse.redirect(`${origin}${redirectTo}`)
  } catch (error) {
    console.error('Naver auth error:', error)
    return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`)
  }
}
