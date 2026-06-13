'use client'

import { useEffect } from 'react'
import { hydrateFromSupabase } from '@/lib/staff-store'

/**
 * 앱 로드 시 Supabase에서 전체 데이터를 1회 하이드레이션.
 * 스키마 미생성/오프라인이면 mock 상태로 동작(무해).
 */
export function StoreHydrator() {
  useEffect(() => {
    hydrateFromSupabase()
  }, [])
  return null
}
