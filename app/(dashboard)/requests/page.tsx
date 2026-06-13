'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useStaffStore } from '@/lib/staff-store'
import { CalendarCheck, UserCog } from 'lucide-react'

type Tab = 'leave' | 'substitute'

function fmtDate(v?: string) {
  return v ? v.slice(0, 10) : '-'
}

export default function RequestsPage() {
  const store = useStaffStore()
  const [tab, setTab] = useState<Tab>('leave')

  const staffName = (id: string) => store.staff.find((s) => s.id === id)?.name ?? '미상'

  // 신청일(created_at) 최신순
  const sorted = useMemo(
    () =>
      [...store.leaveHistory].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    [store.leaveHistory]
  )

  const leaveRows = sorted
  const subRows = useMemo(() => sorted.filter((h) => h.sub_name), [sorted])

  const thCls = 'px-4 md:px-6 py-3 text-label-md font-medium text-on-surface-variant whitespace-nowrap'
  const tdCls = 'px-4 md:px-6 py-4 text-body-md text-on-surface whitespace-nowrap'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-headline-lg font-bold text-on-surface">신청 내역 조회</h1>
        <p className="mt-1 text-body-md text-on-surface-variant">
          전체 직원의 연차·대체교사 신청 이력을 조회합니다.
        </p>
      </div>

      {/* 탭 */}
      <div className="flex bg-surface-container rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab('leave')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-label-md font-medium transition-colors ${
            tab === 'leave' ? 'bg-surface-white text-primary shadow-sm' : 'text-on-surface-variant hover:text-primary'
          }`}
        >
          <CalendarCheck size={18} />
          연차 신청내역
        </button>
        <button
          onClick={() => setTab('substitute')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-label-md font-medium transition-colors ${
            tab === 'substitute' ? 'bg-surface-white text-primary shadow-sm' : 'text-on-surface-variant hover:text-primary'
          }`}
        >
          <UserCog size={18} />
          대체교사 신청내역
        </button>
      </div>

      {/* 테이블 카드 */}
      <div className="rounded-2xl border border-outline-variant bg-surface-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {tab === 'leave' ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  <th className={thCls}>신청일</th>
                  <th className={thCls}>직원</th>
                  <th className={thCls}>유형</th>
                  <th className={thCls}>기간</th>
                  <th className={thCls}>일수</th>
                  <th className={thCls}>사유</th>
                  <th className={thCls}>대체교사</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {leaveRows.map((h) => (
                  <tr key={h.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className={tdCls}>{fmtDate(h.created_at)}</td>
                    <td className={`${tdCls} font-semibold`}>
                      <Link href={`/individual/${h.staff_id}`} className="text-primary hover:underline">
                        {staffName(h.staff_id)}
                      </Link>
                    </td>
                    <td className={tdCls}>
                      <span className="px-2.5 py-0.5 rounded-full bg-primary-container/20 text-primary text-label-sm font-medium">
                        {h.leave_type}
                      </span>
                    </td>
                    <td className={tdCls}>
                      {h.start_date === h.end_date ? h.start_date : `${h.start_date} ~ ${h.end_date}`}
                    </td>
                    <td className={`${tdCls} text-center`}>{h.days_used}일</td>
                    <td className={`${tdCls} max-w-xs truncate`}>{h.reason ?? '-'}</td>
                    <td className={tdCls}>
                      {h.sub_name ? (
                        <span className="inline-flex items-center gap-1 text-warning-amber text-label-sm font-medium">
                          <UserCog size={14} /> {h.sub_name}
                        </span>
                      ) : (
                        <span className="text-on-surface-variant text-label-sm">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  <th className={thCls}>신청일</th>
                  <th className={thCls}>대상 직원</th>
                  <th className={thCls}>대체교사</th>
                  <th className={thCls}>전화번호</th>
                  <th className={thCls}>지원 기간</th>
                  <th className={thCls}>연관 연차</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {subRows.map((h) => (
                  <tr key={h.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className={tdCls}>{fmtDate(h.created_at)}</td>
                    <td className={`${tdCls} font-semibold`}>
                      <Link href={`/individual/${h.staff_id}`} className="text-primary hover:underline">
                        {staffName(h.staff_id)}
                      </Link>
                    </td>
                    <td className={`${tdCls} font-semibold`}>{h.sub_name}</td>
                    <td className={tdCls}>{h.sub_phone ?? '-'}</td>
                    <td className={tdCls}>
                      {h.sub_start === h.sub_end ? h.sub_start : `${h.sub_start} ~ ${h.sub_end}`}
                    </td>
                    <td className={tdCls}>
                      <span className="text-on-surface-variant text-label-sm">
                        {h.leave_type} ({h.start_date === h.end_date ? h.start_date : `${h.start_date}~${h.end_date}`})
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="px-6 py-4 bg-surface-bright border-t border-outline-variant">
          <p className="text-sm text-on-surface-variant">
            총 <span className="font-bold text-on-surface">{tab === 'leave' ? leaveRows.length : subRows.length}</span>건
          </p>
        </div>
      </div>
    </div>
  )
}
