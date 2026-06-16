'use client'

import { useEffect } from 'react'
import { hydrateFromSupabase, resetStore } from '@/lib/staff-store'

/**
 * 로그인한 원장의 어린이집(테넌트) 데이터를 Supabase에서 하이드레이션.
 * tenantId 가 없으면(미인증/미승인) 아무것도 로드하지 않는다.
 */
export function StoreHydrator({ tenantId }: { tenantId: string | null }) {
  useEffect(() => {
    if (!tenantId) {
      resetStore()
      return
    }
    hydrateFromSupabase(tenantId)
    return () => {
      // 테넌트가 바뀌면 다음 마운트에서 새 테넌트로 재하이드레이션
    }
  }, [tenantId])
  return null
}
