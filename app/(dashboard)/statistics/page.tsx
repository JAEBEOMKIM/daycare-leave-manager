'use client'

import { useMemo } from 'react'
import {
  useStaffStore,
  selectLeave,
  positionName,
  CURRENT_YEAR,
} from '@/lib/staff-store'
import { academicYearOf } from '@/lib/leave-period'
import {
  CalendarX2,
  UserRound,
  TrendingUp,
  Umbrella,
  BarChart3,
  PieChart as PieChartIcon,
  Users,
} from 'lucide-react'

// 휴가 유형 도넛/범례 색상 팔레트 (정적)
const PALETTE = ['#4b4bc6', '#ea4c89', '#12b76a', '#f79009', '#0ea5e9', '#a855f7', '#f04438', '#64748b']
const MONTH_LABELS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

// 사용률 구간 → 바 색상 / 상태 (정적 매핑, 동적 클래스 회피)
function rateBar(rate: number): string {
  if (rate >= 80) return 'bg-error-red'
  if (rate >= 50) return 'bg-success-green'
  return 'bg-primary'
}
function statusBadge(rate: number): { label: string; cls: string } {
  if (rate >= 80) return { label: '활발', cls: 'bg-warning-amber/15 text-warning-amber' }
  if (rate >= 50) return { label: '안정', cls: 'bg-success-green/10 text-success-green' }
  return { label: '저조', cls: 'bg-primary/10 text-primary' }
}

export default function StatisticsPage() {
  const store = useStaffStore()

  // 모든 통계를 렌더 중 파생 (effect 사용 안 함)
  const data = useMemo(() => {
    const active = store.staff.filter((s) => s.status !== '퇴사')

    const perStaff = active.map((s) => {
      const v = selectLeave(store, s.id, CURRENT_YEAR)
      return {
        id: s.id,
        name: s.name,
        photo: s.photo_url,
        posId: s.position_id,
        used: v.used,
        total: v.total,
        rate: v.total > 0 ? Math.round((v.used / v.total) * 100) : 0,
      }
    })

    const totalUsed = perStaff.reduce((x, p) => x + p.used, 0)
    const totalEntitle = perStaff.reduce((x, p) => x + p.total, 0)
    const avgPerEmp = active.length ? totalUsed / active.length : 0
    const avgRate = totalEntitle > 0 ? Math.round((totalUsed / totalEntitle) * 100) : 0

    // 올해(학년연도) 연차 이력
    const hist = store.leaveHistory.filter((h) => academicYearOf(h.start_date) === CURRENT_YEAR)

    // 월별 사용량
    const monthly = MONTH_LABELS.map((label, i) => ({ label, month: i + 1, days: 0 }))
    for (const h of hist) {
      const m = Number(h.start_date.slice(5, 7))
      if (m >= 1 && m <= 12) monthly[m - 1].days += h.days_used || 0
    }
    const maxMonth = monthly.reduce((mx, m) => Math.max(mx, m.days), 0)

    // 휴가 유형별 분포
    const typeMap = new Map<string, number>()
    for (const h of hist) typeMap.set(h.leave_type, (typeMap.get(h.leave_type) || 0) + (h.days_used || 0))
    const typeTotal = Array.from(typeMap.values()).reduce((a, b) => a + b, 0)
    const types = Array.from(typeMap.entries())
      .map(([name, days], i) => ({
        name,
        days,
        pct: typeTotal > 0 ? Math.round((days / typeTotal) * 100) : 0,
        color: PALETTE[i % PALETTE.length],
      }))
      .sort((a, b) => b.days - a.days)
    const mostUsedType = types[0]

    // 사용률 TOP (내림차순)
    const top = [...perStaff].sort((a, b) => b.rate - a.rate)

    // 직급별 집계
    const posMap = new Map<string, { count: number; used: number; total: number }>()
    for (const p of perStaff) {
      const k = p.posId || 'none'
      const e = posMap.get(k) || { count: 0, used: 0, total: 0 }
      e.count += 1
      e.used += p.used
      e.total += p.total
      posMap.set(k, e)
    }
    const byPosition = Array.from(posMap.entries())
      .map(([posId, e]) => ({
        posId,
        name: positionName(store, posId === 'none' ? undefined : posId),
        count: e.count,
        used: e.used,
        total: e.total,
        rate: e.total > 0 ? Math.round((e.used / e.total) * 100) : 0,
      }))
      .sort((a, b) => b.rate - a.rate)

    return {
      employeeCount: active.length,
      totalUsed,
      totalEntitle,
      avgPerEmp,
      avgRate,
      monthly,
      maxMonth,
      types,
      typeTotal,
      mostUsedType,
      top,
      byPosition,
    }
  }, [store])

  // 도넛 세그먼트 누적 오프셋 계산
  const donut = useMemo(() => {
    let cum = 0
    return data.types.map((t) => {
      const seg = { ...t, offset: -cum }
      cum += t.pct
      return seg
    })
  }, [data.types])

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-headline-lg font-bold text-on-surface">통계 대시보드</h1>
          <p className="mt-2 text-body-md text-on-surface-variant max-w-xl">
            올해(학년연도) 기준 연차 사용 현황과 인력 가용성 지표입니다.
          </p>
        </div>
        <span className="self-start lg:self-auto inline-flex items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2 text-label-md text-on-surface-variant">
          <BarChart3 size={16} className="text-primary" />
          재직 {data.employeeCount}명 · {CURRENT_YEAR}학년도
        </span>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <KpiCard
          label="총 사용 연차"
          value={`${data.totalUsed.toFixed(1)}일`}
          sub={`총 부여 ${data.totalEntitle.toFixed(0)}일 중`}
          icon={<CalendarX2 size={26} />}
          tile="bg-primary-container/30 text-primary"
        />
        <KpiCard
          label="평균 사용 연차 / 직원"
          value={`${data.avgPerEmp.toFixed(1)}일`}
          sub={`재직 ${data.employeeCount}명 평균`}
          icon={<UserRound size={26} />}
          tile="bg-secondary-container text-primary"
        />
        <KpiCard
          label="평균 사용률"
          value={`${data.avgRate}%`}
          sub="전체 부여 대비 사용"
          icon={<TrendingUp size={26} />}
          tile="bg-success-green/10 text-success-green"
        />
        {/* 가장 많이 쓴 휴가 유형 */}
        <div className="bg-surface-white p-6 rounded-2xl border border-outline-variant shadow-sm transition-transform hover:-translate-y-0.5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-label-md text-on-surface-variant mb-1">가장 많이 쓴 휴가</p>
              <h4 className="text-headline-sm font-bold text-on-surface">
                {data.mostUsedType?.name ?? '-'}
              </h4>
            </div>
            <div className="bg-brand-pink/10 text-brand-pink p-3 rounded-xl">
              <Umbrella size={26} />
            </div>
          </div>
          <div className="mt-5 space-y-2">
            <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
              <div
                className="bg-brand-pink h-full rounded-full transition-all duration-700"
                style={{ width: `${data.mostUsedType?.pct ?? 0}%` }}
              />
            </div>
            <p className="text-label-sm text-on-surface-variant">
              전체 사용의 {data.mostUsedType?.pct ?? 0}%
            </p>
          </div>
        </div>
      </div>

      {/* 월별 사용 추이 */}
      <section className="bg-surface-white p-6 md:p-8 rounded-2xl border border-outline-variant shadow-sm">
        <div className="mb-8">
          <h2 className="text-title-lg font-bold text-on-surface">월별 연차 사용 추이</h2>
          <p className="text-body-md text-on-surface-variant">월별 연차 사용 일수 ({CURRENT_YEAR}학년도)</p>
        </div>
        <div className="relative h-64 flex items-end justify-between gap-2">
          {data.monthly.map((m) => {
            const h = data.maxMonth > 0 ? Math.round((m.days / data.maxMonth) * 100) : 0
            const peak = data.maxMonth > 0 && m.days === data.maxMonth
            return (
              <div key={m.month} className="flex-1 flex flex-col items-center justify-end h-full group">
                <span className={`mb-1.5 text-label-sm font-semibold ${peak ? 'text-primary' : 'text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity'}`}>
                  {m.days > 0 ? `${m.days}` : ''}
                </span>
                <div
                  className={`w-full max-w-[40px] rounded-t-lg transition-all duration-700 ${
                    peak ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-primary/15 group-hover:bg-primary/30'
                  }`}
                  style={{ height: `${Math.max(2, h)}%` }}
                />
                <span className={`mt-3 text-label-sm ${peak ? 'font-bold text-primary' : 'text-on-surface-variant'}`}>
                  {m.label}
                </span>
              </div>
            )
          })}
        </div>
      </section>

      {/* 중단: 유형 분포 + 사용률 TOP */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 휴가 유형별 분포 (도넛) */}
        <section className="bg-surface-white p-6 md:p-8 rounded-2xl border border-outline-variant shadow-sm">
          <h2 className="text-title-lg font-bold text-on-surface mb-6 flex items-center gap-2">
            <PieChartIcon size={20} className="text-primary" />
            휴가 유형별 분포
          </h2>
          {data.typeTotal > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <div className="relative w-44 h-44 flex-shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" fill="transparent" r="15.9" stroke="#eeeeef" strokeWidth="4" />
                  {donut.map((t) => (
                    <circle
                      key={t.name}
                      cx="18"
                      cy="18"
                      fill="transparent"
                      r="15.9"
                      stroke={t.color}
                      strokeDasharray={`${t.pct} 100`}
                      strokeDashoffset={t.offset}
                      strokeWidth="4"
                    />
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-headline-md font-bold text-on-surface">{data.typeTotal.toFixed(0)}</span>
                  <span className="text-label-sm text-on-surface-variant uppercase tracking-widest">일</span>
                </div>
              </div>
              <div className="flex-1 space-y-3 w-full">
                {data.types.map((t) => (
                  <div key={t.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />
                      <span className="text-body-md text-on-surface-variant">{t.name}</span>
                    </div>
                    <span className="text-title-md font-bold text-on-surface">{t.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="py-12 text-center text-on-surface-variant">사용 내역이 없습니다.</p>
          )}
        </section>

        {/* 휴가 사용률 TOP */}
        <section className="bg-surface-white p-6 md:p-8 rounded-2xl border border-outline-variant shadow-sm">
          <h2 className="text-title-lg font-bold text-on-surface mb-6 flex items-center gap-2">
            <BarChart3 size={20} className="text-primary" />
            선생님별 휴가 사용률
          </h2>
          {data.top.length > 0 ? (
            <div className="space-y-5">
              {data.top.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {p.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.photo} alt={p.name} className="w-10 h-10 rounded-full object-cover border border-outline-variant" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary font-bold text-label-sm">
                        {p.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-label-md font-bold text-on-surface truncate">{p.name}</p>
                      <div className="mt-1.5 w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${rateBar(p.rate)}`}
                          style={{ width: `${Math.min(100, p.rate)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-title-md font-bold text-on-surface">{p.used}일</p>
                    <p className="text-label-sm text-on-surface-variant">{p.rate}% 사용</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-12 text-center text-on-surface-variant">표시할 직원이 없습니다.</p>
          )}
        </section>
      </div>

      {/* 직급별 휴가 사용 현황 */}
      <section className="bg-surface-white rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-outline-variant">
          <h2 className="text-title-lg font-bold text-on-surface flex items-center gap-2">
            <Users size={20} className="text-primary" />
            직급별 휴가 사용 현황
          </h2>
          <p className="text-body-md text-on-surface-variant mt-1">직급 단위 평균 사용률 비교</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low">
                <th className="px-6 md:px-8 py-4 text-label-md font-bold text-on-surface">직급</th>
                <th className="px-6 md:px-8 py-4 text-label-md font-bold text-on-surface text-center">인원</th>
                <th className="px-6 md:px-8 py-4 text-label-md font-bold text-on-surface">평균 사용률</th>
                <th className="px-6 md:px-8 py-4 text-label-md font-bold text-on-surface">사용 / 부여</th>
                <th className="px-6 md:px-8 py-4 text-label-md font-bold text-on-surface text-center">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {data.byPosition.map((row) => {
                const badge = statusBadge(row.rate)
                return (
                  <tr key={row.posId} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-6 md:px-8 py-5">
                      <span className="text-body-md font-bold text-on-surface">{row.name}</span>
                    </td>
                    <td className="px-6 md:px-8 py-5 text-body-md text-on-surface-variant text-center">{row.count}명</td>
                    <td className="px-6 md:px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-28 bg-surface-container h-2 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${rateBar(row.rate)}`} style={{ width: `${Math.min(100, row.rate)}%` }} />
                        </div>
                        <span className="text-label-md font-bold text-on-surface">{row.rate}%</span>
                      </div>
                    </td>
                    <td className="px-6 md:px-8 py-5 text-body-md text-on-surface-variant">
                      {row.used.toFixed(1)} / {row.total.toFixed(0)}일
                    </td>
                    <td className="px-6 md:px-8 py-5 text-center">
                      <span className={`px-3 py-1 rounded-full text-label-sm font-bold ${badge.cls}`}>{badge.label}</span>
                    </td>
                  </tr>
                )
              })}
              {data.byPosition.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-10 text-center text-on-surface-variant">데이터가 없습니다.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function KpiCard({
  label,
  value,
  sub,
  icon,
  tile,
}: {
  label: string
  value: string
  sub: string
  icon: React.ReactNode
  tile: string
}) {
  return (
    <div className="bg-surface-white p-6 rounded-2xl border border-outline-variant shadow-sm transition-transform hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-label-md text-on-surface-variant mb-1">{label}</p>
          <h4 className="text-headline-md font-bold text-on-surface">{value}</h4>
        </div>
        <div className={`p-3 rounded-xl ${tile}`}>{icon}</div>
      </div>
      <p className="mt-5 text-label-sm text-on-surface-variant">{sub}</p>
    </div>
  )
}
