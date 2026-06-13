'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  useStaffStore,
  selectLeave,
  selectSubstitute,
  positionName,
  CURRENT_YEAR,
} from '@/lib/staff-store'
import {
  LayoutGrid,
  List,
  CalendarDays,
  CalendarCheck,
  UserCog,
  MoreVertical,
  ArrowRight,
} from 'lucide-react'

interface StaffCard {
  id: string
  name: string
  position: string
  photoUrl?: string | null
  status: string
  hireDate: string
  leaveRemaining: number
  subRemaining: number
}

const POSITION_BADGE: Record<string, string> = {
  원장: 'bg-primary-fixed text-on-primary-fixed-variant',
  부원장: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  교사: 'bg-secondary-container text-on-secondary-container',
}
const STATUS_STYLE: Record<string, { dot: string; pill: string }> = {
  재직: { dot: 'bg-success-green', pill: 'bg-success-green/10 text-success-green' },
  휴직: { dot: 'bg-warning-amber', pill: 'bg-warning-amber/10 text-warning-amber' },
  퇴직: { dot: 'bg-error-red', pill: 'bg-error-red/10 text-error-red' },
  퇴사: { dot: 'bg-error-red', pill: 'bg-error-red/10 text-error-red' },
}

export default function IndividualListPage() {
  const store = useStaffStore()

  const allCards = useMemo<StaffCard[]>(
    () =>
      store.staff.map((staff) => {
        const leave = selectLeave(store, staff.id, CURRENT_YEAR)
        const sub = selectSubstitute(store, staff.id, CURRENT_YEAR)
        return {
          id: staff.id,
          name: staff.name,
          position: positionName(store, staff.position_id),
          photoUrl: staff.photo_url ?? null,
          status: staff.status,
          hireDate: staff.hire_date,
          leaveRemaining: leave.remaining,
          subRemaining: sub.remaining,
        }
      }),
    [store]
  )

  const [position, setPosition] = useState('all')
  const [status, setStatus] = useState('all')

  const positionOptions = useMemo(
    () => Array.from(new Set(allCards.map((c) => c.position))),
    [allCards]
  )
  const statusOptions = useMemo(
    () => Array.from(new Set(allCards.map((c) => c.status))),
    [allCards]
  )

  const cards = useMemo(
    () =>
      allCards.filter((c) => {
        if (position !== 'all' && c.position !== position) return false
        if (status !== 'all' && c.status !== status) return false
        return true
      }),
    [allCards, position, status]
  )

  return (
    <div className="space-y-6">
      {/* 헤더 + 필터 */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-headline-lg font-bold text-on-surface">개인별 조회</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            전체 교직원의 연차 및 대체교사 현황을 카드로 조회합니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Cards / List 토글 */}
          <div className="flex bg-surface-container rounded-lg p-1">
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface-white shadow-sm text-primary text-label-md font-medium">
              <LayoutGrid size={18} />
              카드
            </button>
            <Link
              href="/staff"
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-on-surface-variant text-label-md font-medium hover:text-primary transition-colors"
            >
              <List size={18} />
              목록
            </Link>
          </div>

          <select
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className="bg-surface-white border border-outline-variant rounded-lg px-4 py-2 text-label-md text-on-surface-variant focus:ring-2 focus:ring-primary/20 outline-none"
          >
            <option value="all">전체 직급</option>
            {positionOptions.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-surface-white border border-outline-variant rounded-lg px-4 py-2 text-label-md text-on-surface-variant focus:ring-2 focus:ring-primary/20 outline-none"
          >
            <option value="all">전체 상태</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 카드 그리드 */}
      {cards.length === 0 ? (
        <div className="py-16 text-center text-on-surface-variant">
          조건에 맞는 직원이 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {cards.map((c) => {
            const posBadge = POSITION_BADGE[c.position] ?? 'bg-surface-container text-on-surface-variant'
            const st = STATUS_STYLE[c.status] ?? { dot: 'bg-outline', pill: 'bg-surface-container text-on-surface-variant' }
            return (
              <Link
                key={c.id}
                href={`/individual/${c.id}`}
                className="bg-surface-white border border-outline-variant rounded-xl p-6 shadow-sm hover:shadow-md hover:border-primary/30 transition-all group flex flex-col"
              >
                {/* 상단: 아바타 + 메뉴 */}
                <div className="flex justify-between items-start mb-4">
                  <div className="relative">
                    {c.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.photoUrl} alt={c.name} className="w-16 h-16 rounded-full object-cover ring-4 ring-primary/5" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-primary-container ring-4 ring-primary/5 flex items-center justify-center text-on-primary text-2xl font-bold">
                        {c.name.charAt(0)}
                      </div>
                    )}
                    <span className={`absolute bottom-0 right-0 w-4 h-4 border-2 border-surface-white rounded-full ${st.dot}`} />
                  </div>
                  <MoreVertical
                    size={18}
                    className="text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </div>

                {/* 이름 + 직급 */}
                <h3 className="text-title-md font-semibold text-on-surface mb-1">{c.name}</h3>
                <span className={`inline-flex self-start px-2 py-1 rounded-full text-label-sm font-medium mb-4 ${posBadge}`}>
                  {c.position}
                </span>

                {/* 정보 */}
                <div className="space-y-2 text-on-surface-variant">
                  <div className="flex items-center gap-2 text-body-md">
                    <CalendarDays size={18} />
                    <span>입사 {c.hireDate}</span>
                  </div>
                  <div className="flex items-center gap-2 text-body-md">
                    <CalendarCheck size={18} className="text-success-green" />
                    <span>연차 잔여 <span className="font-semibold text-on-surface">{c.leaveRemaining}일</span></span>
                  </div>
                  <div className="flex items-center gap-2 text-body-md">
                    <UserCog size={18} className="text-warning-amber" />
                    <span>대체교사 잔여 <span className="font-semibold text-on-surface">{c.subRemaining}일</span></span>
                  </div>
                </div>

                {/* 푸터 */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-outline-variant/30">
                  <span className={`px-2 py-0.5 rounded text-label-sm font-medium ${st.pill}`}>
                    {c.status}
                  </span>
                  <span className="flex items-center gap-1 text-primary text-label-md font-medium group-hover:gap-2 transition-all">
                    프로필 보기
                    <ArrowRight size={16} />
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      <p className="text-sm text-on-surface-variant">
        전체 <span className="font-bold text-on-surface">{allCards.length}</span>명 중{' '}
        <span className="font-bold text-on-surface">{cards.length}</span>명 표시
      </p>
    </div>
  )
}
