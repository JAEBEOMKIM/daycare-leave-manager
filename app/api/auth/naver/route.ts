import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const redirect = searchParams.get('redirect') || '/dashboard'

  const clientId = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/naver/callback`

  const state = Buffer.from(JSON.stringify({ redirect })).toString('base64')

  const naverAuthUrl = new URL('https://nid.naver.com/oauth2.0/authorize')
  naverAuthUrl.searchParams.append('client_id', clientId || '')
  naverAuthUrl.searchParams.append('redirect_uri', redirectUri)
  naverAuthUrl.searchParams.append('response_type', 'code')
  naverAuthUrl.searchParams.append('state', state)

  return NextResponse.redirect(naverAuthUrl.toString())
}
