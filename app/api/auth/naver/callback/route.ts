import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/login?error=no_code`)
  }

  let redirect = '/dashboard'
  try {
    if (state) {
      const decodedState = JSON.parse(Buffer.from(state, 'base64').toString())
      redirect = decodedState.redirect || '/dashboard'
    }
  } catch (e) {
    // 기본값 사용
  }

  try {
    // Naver에서 토큰 받기
    const tokenResponse = await fetch('https://nid.naver.com/oauth2.0/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.NEXT_PUBLIC_NAVER_CLIENT_ID || '',
        client_secret: process.env.NAVER_CLIENT_SECRET || '',
        code,
        state: state ?? '',
      }).toString(),
    })

    if (!tokenResponse.ok) {
      throw new Error('Failed to get token from Naver')
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Naver 사용자 정보 가져오기
    const userResponse = await fetch('https://openapi.naver.com/v1/nid/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!userResponse.ok) {
      throw new Error('Failed to get user info from Naver')
    }

    const userData = await userResponse.json()
    const naverId = userData.response.id
    const email = userData.response.email
    const nickname = userData.response.nickname

    if (!email) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/auth/login?error=no_email`
      )
    }

    // Supabase에 사용자 등록 또는 로그인
    const supabase = await createClient()

    // 기존 사용자 확인
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (existingUser) {
      // 기존 사용자 로그인
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: naverId, // Naver ID를 암호로 사용 (더 보안이 필요할 수 있음)
      })

      if (signInError && signInError.message !== 'Invalid login credentials') {
        throw signInError
      }
    } else {
      // 새 사용자 회원가입
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password: naverId, // Naver ID를 임시 암호로 사용
        options: {
          data: {
            provider: 'naver',
            naver_id: naverId,
            display_name: nickname || email.split('@')[0],
          },
        },
      })

      if (signUpError && signUpError.message !== 'User already registered') {
        throw signUpError
      }
    }

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}${redirect}`)
  } catch (error) {
    console.error('Naver auth error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/auth/login?error=auth_failed`
    )
  }
}
