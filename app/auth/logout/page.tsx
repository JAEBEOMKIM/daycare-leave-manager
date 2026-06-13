'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LogoutPage() {
  useEffect(() => {
    const logout = async () => {
      const supabase = createClient()
      await supabase.auth.signOut()
      window.location.href = '/auth/login'
    }

    logout()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-deep">
      <p className="font-inter text-body-md text-on-surface">로그아웃 중...</p>
    </div>
  )
}
