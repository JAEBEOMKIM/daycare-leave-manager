import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const redirect = searchParams.get('redirect') || '/dashboard'

  const clientId = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/kakao/callback`

  const kakaoAuthUrl = new URL('https://kauth.kakao.com/oauth/authorize')
  kakaoAuthUrl.searchParams.append('client_id', clientId || '')
  kakaoAuthUrl.searchParams.append('redirect_uri', redirectUri)
  kakaoAuthUrl.searchParams.append('response_type', 'code')
  kakaoAuthUrl.searchParams.append('state', Buffer.from(JSON.stringify({ redirect })).toString('base64'))

  return NextResponse.redirect(kakaoAuthUrl.toString())
}
