'use client'

import { use, useMemo, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  useStaffStore,
  selectLeave,
  selectSubstitute,
  selectYears,
  positionName,
  addAdjustment,
  CURRENT_YEAR,
} from '@/lib/staff-store'
import type { LeaveHistory } from '@/types'
import {
  ArrowLeft,
  Pencil,
  CalendarPlus,
  Briefcase,
  CalendarDays,
  Hash,
  Umbrella,
  Stethoscope,
  Clock,
  Heart,
  CalendarRange,
  UserCog,
  MoreVertical,
  Plus,
  Minus,
  Lock,
  X,
  Phone,
} from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

const RING_CIRCUMFERENCE = 2 * Math.PI * 58

function RingCard({
  value,
  unit,
  label,
  sub,
  fraction,
  ringClass,
}: {
  value: string
  unit: string
  label: string
  sub: string
  fraction: number
  ringClass: string
}) {
  const offset = RING_CIRCUMFERENCE * (1 - Math.max(0, Math.min(1, fraction)))
  return (
    <div className="bg-surface-white p-6 rounded-xl border border-outline-variant shadow-sm flex flex-col items-center text-center">
      <div className="relative w-32 h-32 mb-4">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
          <circle className="text-surface-container-high" cx="64" cy="64" r="58" fill="transparent" stroke="currentColor" strokeWidth="8" />
          <circle
            className={ringClass}
            cx="64" cy="64" r="58" fill="transparent" stroke="currentColor" strokeWidth="8" strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-headline-md font-bold text-on-surface">{value}</span>
          <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">{unit}</span>
        </div>
      </div>
      <h3 className="text-title-md font-semibold text-on-surface">{label}</h3>
      <p className="text-sm text-on-surface-variant mt-1">{sub}</p>
    </div>
  )
}

const LEAVE_ICON: Record<string, { Icon: typeof Umbrella; tile: string }> = {
  종일휴가: { Icon: Umbrella, tile: 'bg-primary-container/20 text-primary' },
  병가: { Icon: Stethoscope, tile: 'bg-error-container/50 text-error' },
  오전반차: { Icon: Clock, tile: 'bg-success-green/15 text-success-green' },
  오후반차: { Icon: Clock, tile: 'bg-success-green/15 text-success-green' },
  경조사: { Icon: Heart, tile: 'bg-warning-amber/15 text-warning-amber' },
}
function leaveIcon(type: string) {
  return LEAVE_ICON[type] ?? { Icon: CalendarDays, tile: 'bg-secondary-container/40 text-secondary' }
}

export default function IndividualDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const store = useStaffStore()

  const staff = useMemo(() => store.staff.find((s) => s.id === id), [store, id])
  const years = useMemo(() => selectYears(store, id), [store, id])
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR)
  const [yearBasis, setYearBasis] = useState<'fiscal' | 'academic'>('fiscal')

  // 조회 기간 (회계년도: 1~12월 / 학년도: 3월~익년 2월)
  const period = useMemo(() => {
    if (yearBasis === 'academic') {
      return {
        start: `${selectedYear}-03-01`,
        end: `${selectedYear + 1}-02-29`,
        label: `${selectedYear}학년도 (${selectedYear}.03 ~ ${selectedYear + 1}.02)`,
      }
    }
    return {
      start: `${selectedYear}-01-01`,
      end: `${selectedYear}-12-31`,
      label: `${selectedYear}년 (회계연도)`,
    }
  }, [selectedYear, yearBasis])

  const leave = useMemo(() => selectLeave(store, id, selectedYear), [store, id, selectedYear])
  const substitute = useMemo(() => selectSubstitute(store, id, selectedYear), [store, id, selectedYear])

  // 연차 사용 내역 — 기준 기간으로 필터 (YYYY-MM-DD 문자열 비교)
  const history = useMemo(
    () =>
      store.leaveHistory
        .filter(
          (h) =>
            h.staff_id === id &&
            h.start_date >= period.start &&
            h.start_date <= period.end
        )
        .sort((a, b) => (a.start_date < b.start_date ? 1 : -1)),
    [store.leaveHistory, id, period]
  )

  // 상세 팝업 대상
  const [detail, setDetail] = useState<LeaveHistory | null>(null)

  // 연차 조정 폼 (현재 연도만)
  const [adjType, setAdjType] = useState<'추가' | '감소'>('추가')
  const [adjDays, setAdjDays] = useState(1)
  const [adjReason, setAdjReason] = useState('')

  const isCurrentYear = selectedYear === CURRENT_YEAR

  const handleApplyAdjustment = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!adjDays || adjDays <= 0 || !adjReason.trim()) return
      addAdjustment(id, selectedYear, adjType, adjDays, adjReason.trim())
      setAdjDays(1)
      setAdjReason('')
    },
    [id, selectedYear, adjType, adjDays, adjReason]
  )

  if (!staff) {
    return (
      <div className="py-16 text-center">
        <p className="text-label-lg text-on-surface-variant">직원 정보를 찾을 수 없습니다.</p>
        <Link href="/individual" className="mt-4 inline-block text-primary hover:underline">
          개인별 조회로 돌아가기
        </Link>
      </div>
    )
  }

  const role = positionName(store, staff.position_id)
  const usagePct = leave.total > 0 ? Math.round((leave.used / leave.total) * 100) : 0
  const hireYears = Math.max(
    0,
    Math.floor((Date.now() - new Date(staff.hire_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
  )
  const statusActive = staff.status === '재직'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/individual" className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-primary transition-colors">
          <ArrowLeft size={16} />
          개인별 조회
        </Link>

        {/* 조회 기준 + 연도 선택 */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* 기준 토글 */}
          <div className="flex bg-surface-container rounded-lg p-1">
            <button
              type="button"
              onClick={() => setYearBasis('fiscal')}
              className={`px-3 py-1 rounded-md text-label-sm font-medium transition-colors ${
                yearBasis === 'fiscal'
                  ? 'bg-surface-white text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              회계연도
            </button>
            <button
              type="button"
              onClick={() => setYearBasis('academic')}
              className={`px-3 py-1 rounded-md text-label-sm font-medium transition-colors ${
                yearBasis === 'academic'
                  ? 'bg-surface-white text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              학년도
            </button>
          </div>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="rounded-lg border border-outline-variant bg-surface-white px-3 py-1.5 text-label-md font-medium outline-none focus:ring-2 focus:ring-primary/20"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}{yearBasis === 'academic' ? '학년도' : '년'}
                {y === CURRENT_YEAR ? ' (올해)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 프로필 헤더 */}
      <section className="bg-surface-white p-6 md:p-8 rounded-xl border border-outline-variant shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            {staff.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={staff.photo_url} alt={staff.name} className="w-24 h-24 rounded-full object-cover border-4 border-primary-container" />
            ) : (
              <div className="w-24 h-24 rounded-full border-4 border-primary-container bg-primary-container flex items-center justify-center text-on-primary text-3xl font-bold">
                {staff.name.charAt(0)}
              </div>
            )}
            <span className={`absolute bottom-1 right-1 w-6 h-6 border-4 border-surface-white rounded-full ${statusActive ? 'bg-success-green' : 'bg-outline'}`} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-headline-md font-bold text-on-surface">{staff.name}</h2>
              <span className={`px-3 py-1 text-xs font-bold rounded-full ${statusActive ? 'bg-success-green/10 text-success-green' : 'bg-surface-container text-on-surface-variant'}`}>
                {staff.status}
              </span>
            </div>
            <p className="text-body-lg text-on-surface-variant mt-0.5">
              {role} • {staff.employment_type ?? '정규직'} • {hireYears}년차
            </p>
            <div className="flex flex-wrap gap-4 mt-2">
              <div className="flex items-center text-on-surface-variant text-sm gap-1"><Hash size={16} /><span>사번 {staff.staff_number ?? '-'}</span></div>
              <div className="flex items-center text-on-surface-variant text-sm gap-1"><CalendarDays size={16} /><span>입사 {staff.hire_date}</span></div>
              {staff.resignation_date && (
                <div className="flex items-center text-error text-sm gap-1"><CalendarDays size={16} /><span>퇴사 {staff.resignation_date}</span></div>
              )}
              <div className="flex items-center text-on-surface-variant text-sm gap-1"><Briefcase size={16} /><span>{staff.employment_type ?? '정규직'}</span></div>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Link href={`/staff/${staff.id}/edit`} className="flex items-center gap-2 px-5 py-2.5 bg-surface-container-low text-primary border border-primary/20 rounded-lg text-label-md font-medium hover:bg-primary-container/10 transition-colors">
            <Pencil size={18} />
            정보 수정
          </Link>
          <Link href={`/leave?staff=${staff.id}`} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-lg text-label-md font-medium hover:opacity-90 transition-opacity shadow-sm">
            <CalendarPlus size={18} />
            연차 등록
          </Link>
        </div>
      </section>

      {/* 연차 현황 (도넛 링) */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-title-md font-semibold text-on-surface">
            연차 현황 <span className="text-on-surface-variant font-normal">({selectedYear}년)</span>
          </h3>
          {!isCurrentYear && (
            <span className="flex items-center gap-1 text-xs text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-full">
              <Lock size={12} /> 조회 전용
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <RingCard value={leave.total.toFixed(1)} unit="일" label="총 부여" sub={leave.addition || leave.deduction ? `기본 ${leave.base} ${leave.addition ? `+${leave.addition}` : ''}${leave.deduction ? ` -${leave.deduction}` : ''}` : `${selectedYear}년 기준`} fraction={1} ringClass="text-primary" />
          <RingCard value={leave.used.toFixed(1)} unit="일" label="사용" sub={`연차의 ${usagePct}%`} fraction={leave.total ? leave.used / leave.total : 0} ringClass="text-secondary" />
          <RingCard value={leave.remaining.toFixed(1)} unit="일" label="잔여" sub="사용 가능" fraction={leave.total ? leave.remaining / leave.total : 0} ringClass="text-success-green" />
        </div>
      </section>

      {/* 연차 조정 (현재 연도만) */}
      {isCurrentYear && (
        <section className="bg-surface-white rounded-xl border border-outline-variant shadow-sm p-6">
          <h3 className="text-title-md font-semibold text-on-surface mb-1">연차 조정</h3>
          <p className="text-sm text-on-surface-variant mb-4">
            사유와 함께 연차를 추가하거나 차감합니다. 변경된 연차는 모든 화면의 총 연차에 반영됩니다.
          </p>
          <form onSubmit={handleApplyAdjustment} className="flex flex-wrap items-end gap-3">
            <div className="flex bg-surface-container-low rounded-lg p-1">
              <button type="button" onClick={() => setAdjType('추가')} className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-label-md font-medium transition-all ${adjType === '추가' ? 'bg-success-green text-white shadow-sm' : 'text-on-surface-variant hover:text-success-green'}`}>
                <Plus size={16} /> 추가
              </button>
              <button type="button" onClick={() => setAdjType('감소')} className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-label-md font-medium transition-all ${adjType === '감소' ? 'bg-error-red text-white shadow-sm' : 'text-on-surface-variant hover:text-error-red'}`}>
                <Minus size={16} /> 차감
              </button>
            </div>
            <div>
              <label className="block text-xs text-on-surface-variant mb-1">일수</label>
              <input type="number" min={0.5} step="0.5" value={adjDays} onChange={(e) => setAdjDays(e.target.valueAsNumber)} className="w-24 rounded-lg border border-outline-variant px-3 py-2 text-label-md text-center outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs text-on-surface-variant mb-1">사유</label>
              <input type="text" value={adjReason} onChange={(e) => setAdjReason(e.target.value)} placeholder="예: 근속 보상, 무단결근 차감" className="w-full rounded-lg border border-outline-variant px-3 py-2 text-label-md outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <button type="submit" className="px-5 py-2 rounded-lg bg-primary text-on-primary font-semibold text-sm hover:opacity-90 transition-opacity">
              적용
            </button>
          </form>

          {/* 조정 이력 */}
          {leave.adjustments.length > 0 && (
            <div className="mt-5 border-t border-outline-variant pt-4 space-y-2">
              <p className="text-label-md font-medium text-on-surface">조정 이력</p>
              {leave.adjustments.map((a) => (
                <div key={a.id} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${a.adjustment_type === '추가' ? 'bg-success-green/10 text-success-green' : 'bg-error-red/10 text-error-red'}`}>
                      {a.adjustment_type === '추가' ? '+' : '−'}{a.days}일
                    </span>
                    <span className="text-on-surface-variant">{a.reason}</span>
                  </span>
                  <span className="text-xs text-on-surface-variant">{a.created_at.slice(0, 10)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 대체교사 지원일 (도넛 링) */}
      <section>
        <h3 className="text-title-md font-semibold text-on-surface mb-3 flex items-center gap-2">
          <UserCog size={18} className="text-primary" />
          대체교사 지원일 <span className="text-on-surface-variant font-normal">({selectedYear}년)</span>
          {substitute.isCustom && <span className="text-[10px] text-primary bg-primary-container/40 rounded-full px-2 py-0.5 font-bold">개인설정</span>}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <RingCard value={`${substitute.total}`} unit="일" label="연간 지원" sub={`${selectedYear}년 기준`} fraction={1} ringClass="text-primary" />
          <RingCard value={`${substitute.used}`} unit="일" label="사용" sub={substitute.total ? `지원일의 ${Math.round((substitute.used / substitute.total) * 100)}%` : '-'} fraction={substitute.total ? substitute.used / substitute.total : 0} ringClass="text-warning-amber" />
          <RingCard value={`${substitute.remaining}`} unit="일" label="잔여" sub="신청 가능" fraction={substitute.total ? substitute.remaining / substitute.total : 0} ringClass="text-success-green" />
        </div>
      </section>

      {/* 연차 사용 내역 */}
      <section className="bg-surface-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="px-6 md:px-8 py-5 border-b border-outline-variant flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-title-lg font-semibold text-on-surface">연차 사용 내역</h3>
          <span className="text-label-sm text-on-surface-variant">{period.label}</span>
        </div>
        {history.length === 0 ? (
          <p className="px-8 py-10 text-center text-on-surface-variant">해당 기간 사용 내역이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low">
                  <th className="px-6 md:px-8 py-4 text-label-md font-medium text-on-surface-variant">휴가 유형</th>
                  <th className="px-6 md:px-8 py-4 text-label-md font-medium text-on-surface-variant">기간</th>
                  <th className="px-6 md:px-8 py-4 text-label-md font-medium text-on-surface-variant">사유</th>
                  <th className="px-6 md:px-8 py-4 text-label-md font-medium text-on-surface-variant text-center">상태</th>
                  <th className="px-6 md:px-8 py-4 text-label-md font-medium text-on-surface-variant text-right">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {history.map((item) => {
                  const { Icon, tile } = leaveIcon(item.leave_type)
                  const single = item.start_date === item.end_date
                  return (
                    <tr key={item.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-6 md:px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tile}`}><Icon size={18} /></div>
                          <span className="text-body-md font-semibold text-on-surface">{item.leave_type}</span>
                        </div>
                      </td>
                      <td className="px-6 md:px-8 py-5">
                        <p className="text-body-md text-on-surface">{single ? item.start_date : `${item.start_date} ~ ${item.end_date}`}</p>
                        <p className="text-xs text-on-surface-variant">{item.days_used}일</p>
                      </td>
                      <td className="px-6 md:px-8 py-5 max-w-xs"><p className="text-body-md text-on-surface-variant truncate">{item.reason ?? '-'}</p></td>
                      <td className="px-6 md:px-8 py-5"><div className="flex justify-center"><span className="px-3 py-1 bg-success-green/10 text-success-green text-xs font-bold rounded-full">승인</span></div></td>
                      <td className="px-6 md:px-8 py-5 text-right">
                        <button
                          type="button"
                          onClick={() => setDetail(item)}
                          title="상세 보기"
                          className="text-on-surface-variant hover:text-primary transition-colors p-1"
                        >
                          <MoreVertical size={18} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-6 md:px-8 py-4 bg-surface-container-low"><p className="text-xs text-on-surface-variant font-medium">총 {history.length}건의 연차 사용 내역</p></div>
      </section>

      {/* 대체교사 사용 내역 */}
      <section className="bg-surface-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="px-6 md:px-8 py-5 border-b border-outline-variant flex items-center gap-2">
          <CalendarRange size={20} className="text-warning-amber" />
          <h3 className="text-title-lg font-semibold text-on-surface">대체교사 사용 내역</h3>
        </div>
        {substitute.usages.length === 0 ? (
          <p className="px-8 py-10 text-center text-on-surface-variant">사용 내역이 없습니다.</p>
        ) : (
          <div className="divide-y divide-outline-variant">
            {substitute.usages.map((u) => (
              <div key={u.id} className="px-6 md:px-8 py-4 flex items-center justify-between hover:bg-surface-container-low/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 text-title-md font-bold text-warning-amber">{u.month}월</div>
                  <span className="text-body-md text-on-surface-variant">{u.note}</span>
                </div>
                <span className="text-body-md font-semibold text-on-surface">{u.days_used}일</span>
              </div>
            ))}
          </div>
        )}
        <div className="px-6 md:px-8 py-4 bg-surface-container-low">
          <p className="text-xs text-on-surface-variant font-medium">연간 {substitute.total}일 중 {substitute.used}일 사용 · 잔여 {substitute.remaining}일</p>
        </div>
      </section>

      {/* 상세 팝업 */}
      {detail && (
        <div
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 p-4"
          onClick={() => setDetail(null)}
        >
          <div
            className="w-full max-w-md bg-surface-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
              <div className="flex items-center gap-2">
                {(() => {
                  const { Icon, tile } = leaveIcon(detail.leave_type)
                  return (
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${tile}`}>
                      <Icon size={18} />
                    </span>
                  )
                })()}
                <h3 className="text-title-md font-semibold text-on-surface">{detail.leave_type}</h3>
              </div>
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* 본문 */}
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-label-sm text-on-surface-variant">기간</p>
                  <p className="text-body-md font-medium text-on-surface">
                    {detail.start_date === detail.end_date
                      ? detail.start_date
                      : `${detail.start_date} ~ ${detail.end_date}`}
                  </p>
                </div>
                <div>
                  <p className="text-label-sm text-on-surface-variant">사용 일수</p>
                  <p className="text-body-md font-medium text-on-surface">{detail.days_used}일</p>
                </div>
              </div>
              <div>
                <p className="text-label-sm text-on-surface-variant">사유</p>
                <p className="text-body-md text-on-surface">{detail.reason || '-'}</p>
              </div>

              {/* 대체교사 정보 */}
              <div className="rounded-lg border border-outline-variant bg-surface-bright/50 p-4">
                <div className="flex items-center gap-2 mb-2 text-primary">
                  <UserCog size={16} />
                  <span className="text-label-md font-semibold">대체교사 정보</span>
                </div>
                {detail.sub_name ? (
                  <div className="space-y-1.5 text-body-md text-on-surface">
                    <div className="flex items-center gap-2">
                      <span className="text-on-surface-variant text-sm w-12">이름</span>
                      <span className="font-medium">{detail.sub_name}</span>
                    </div>
                    {detail.sub_phone && (
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-on-surface-variant" />
                        <span>{detail.sub_phone}</span>
                      </div>
                    )}
                    {detail.sub_start && (
                      <div className="flex items-center gap-2">
                        <CalendarRange size={14} className="text-on-surface-variant" />
                        <span>
                          {detail.sub_start === detail.sub_end
                            ? detail.sub_start
                            : `${detail.sub_start} ~ ${detail.sub_end}`}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-on-surface-variant">대체교사 신청 없음</p>
                )}
              </div>
            </div>

            {/* 푸터 */}
            <div className="px-6 py-4 border-t border-outline-variant flex justify-end">
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="px-5 py-2 rounded-lg bg-primary text-on-primary text-label-md font-medium hover:opacity-90 transition-opacity"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
