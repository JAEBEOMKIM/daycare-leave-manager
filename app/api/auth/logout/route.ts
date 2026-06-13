import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/login`, {
      status: 302,
    })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/login`, {
      status: 302,
    })
  }
}
