'use client'

import { createClient } from './client'

/**
 * 로그인 시설(facilities)의 이름을 조회.
 * (인증 미구현 프로토타입: 첫 시설 사용. RLS/오류 시 null → 호출부 폴백)
 */
export async function fetchFacilityName(): Promise<string | null> {
  try {
    const { data, error } = await createClient()
      .from('facilities')
      .select('name')
      .limit(1)
      .maybeSingle()
    if (error || !data) return null
    return (data.name as string) ?? null
  } catch {
    return null
  }
}
