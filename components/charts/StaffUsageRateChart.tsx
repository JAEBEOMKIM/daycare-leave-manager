'use client'

import { useMemo } from 'react'
import { useStaffStore, selectLeave, CURRENT_YEAR } from '@/lib/staff-store'

// 사용률 구간별 바 색상 (동적 클래스 금지 — 정적 매핑)
function barClass(rate: number): string {
  if (rate >= 80) return 'bg-error'
  if (rate >= 50) return 'bg-warning-amber'
  return 'bg-primary'
}

export function StaffUsageRateChart() {
  const store = useStaffStore()

  // 재직 직원별 휴가 사용률(%) = 사용 / 총부여 × 100 (학년연도 기준, 사용률 내림차순)
  const rows = useMemo(() => {
    return store.staff
      .filter((s) => s.status !== '퇴사')
      .map((s) => {
        const v = selectLeave(store, s.id, CURRENT_YEAR)
        const rate = v.total > 0 ? Math.round((v.used / v.total) * 100) : 0
        return { id: s.id, name: s.name, rate, used: v.used, total: v.total }
      })
      .sort((a, b) => b.rate - a.rate)
  }, [store])

  if (rows.length === 0) {
    return (
      <p className="py-10 text-center text-on-surface-variant">
        표시할 직원이 없습니다.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.id} className="flex items-center gap-3">
          <span className="w-20 shrink-0 truncate text-label-md font-medium text-on-surface" title={r.name}>
            {r.name}
          </span>
          <div className="relative h-6 flex-1 overflow-hidden rounded-full bg-surface-container">
            <div
              className={`h-full rounded-full transition-all duration-700 ${barClass(r.rate)}`}
              style={{ width: `${Math.min(100, r.rate)}%` }}
            />
          </div>
          <span className="w-24 shrink-0 text-right text-label-md font-semibold text-on-surface">
            {r.rate}%
            <span className="ml-1 text-label-sm font-normal text-on-surface-variant">
              ({r.used}/{r.total})
            </span>
          </span>
        </div>
      ))}
    </div>
  )
}
