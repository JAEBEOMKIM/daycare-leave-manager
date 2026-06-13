'use client'

import { Suspense, useState, useMemo, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { DatePicker } from '@/components/ui/DatePicker'
import { useStaffStore, selectLeave, addLeaveHistory, CURRENT_YEAR } from '@/lib/staff-store'
import { useHolidayMap } from '@/lib/holidays'
import { countLeaveDays } from '@/lib/leave-period'
import {
  ClipboardList,
  Users,
  BarChart3,
  Info,
  Send,
  ShieldCheck,
  User,
  Phone,
  History,
} from 'lucide-react'

const LEAVE_TYPES = [
  '종일휴가',
  '오전반차',
  '오후반차',
  '지각',
  '병가',
  '경조사',
  '출산휴가',
  '돌봄휴가',
]

export default function LeavePage() {
  return (
    <Suspense fallback={null}>
      <LeaveForm />
    </Suspense>
  )
}

function diffDays(start: string, end: string): number {
  if (!start || !end) return 0
  const s = new Date(start).getTime()
  const e = new Date(end).getTime()
  if (Number.isNaN(s) || Number.isNaN(e) || e < s) return 0
  return Math.floor((e - s) / (1000 * 60 * 60 * 24)) + 1
}

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const PHONE_RE = /^\d{3}-\d{4}-\d{4}$/

function LeaveForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const store = useStaffStore()

  const staffParam = searchParams.get('staff')
  const initialStaff =
    staffParam && store.staff.some((s) => s.id === staffParam)
      ? staffParam
      : store.staff[0]?.id ?? ''

  const today = todayStr()
  const [selectedStaff, setSelectedStaff] = useState(initialStaff)
  const [selectedType, setSelectedType] = useState('종일휴가')
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)
  const [reason, setReason] = useState('')
  const [pastMode, setPastMode] = useState(false) // 이전(과거) 연차 등록 허용

  const [subEnabled, setSubEnabled] = useState(false)
  const [subName, setSubName] = useState('')
  const [subPhone, setSubPhone] = useState('')
  const [subSameAsLeave, setSubSameAsLeave] = useState(true)
  const [subStart, setSubStart] = useState('')
  const [subEnd, setSubEnd] = useState('')

  const [submitting, setSubmitting] = useState(false)

  const balance = useMemo(
    () => selectLeave(store, selectedStaff, CURRENT_YEAR),
    [store, selectedStaff]
  )

  // 연차 기간이 연말을 넘기는 경우까지 대비해 시작/종료 연도의 공휴일을 로드
  const holidayYears = useMemo(() => {
    const ys = new Set<number>([CURRENT_YEAR])
    if (startDate) ys.add(Number(startDate.slice(0, 4)))
    if (endDate) ys.add(Number(endDate.slice(0, 4)))
    return Array.from(ys)
  }, [startDate, endDate])
  const holidayMap = useHolidayMap(holidayYears)

  // 차감 일수 = 토·일·공휴일 제외 근무일 (반차는 0.5)
  const expectedDays = useMemo(
    () => countLeaveDays(startDate, endDate, selectedType, holidayMap),
    [startDate, endDate, selectedType, holidayMap]
  )

  const remainingAfter = balance.remaining - expectedDays
  const utilization = balance.total > 0 ? Math.round((balance.used / balance.total) * 100) : 0

  // 전역 설정이 꺼져 있으면 대체교사 입력 자체를 비활성화
  const subActive = store.substituteEnabled && subEnabled
  const effectiveSubStart = subSameAsLeave ? startDate : subStart
  const effectiveSubEnd = subSameAsLeave ? endDate : subEnd
  const subDays = useMemo(
    () => diffDays(effectiveSubStart, effectiveSubEnd),
    [effectiveSubStart, effectiveSubEnd]
  )

  // ── 유효성 검증 ──
  const errors = useMemo(() => {
    const e: string[] = []
    if (!startDate) e.push('시작일을 선택하세요.')
    else if (!pastMode && startDate < today) e.push('연차 시작일은 오늘 이전일 수 없습니다. (과거 등록은 "이전 연차등록"을 체크하세요)')
    if (!endDate) e.push('종료일을 선택하세요.')
    else if (startDate && endDate < startDate) e.push('연차 종료일은 시작일 이전일 수 없습니다.')
    if (remainingAfter < 0) e.push('잔여 연차가 부족합니다.')
    if (subActive) {
      if (!subName.trim()) e.push('대체교사 이름을 입력하세요.')
      if (!subPhone.trim()) e.push('대체교사 전화번호를 입력하세요.')
      else if (!PHONE_RE.test(subPhone.trim()))
        e.push('전화번호 형식이 올바르지 않습니다. (예: 010-1234-5678)')
      if (!effectiveSubStart) e.push('대체교사 지원 시작일을 선택하세요.')
      else if (startDate && effectiveSubStart < startDate) e.push('대체교사 지원 시작일은 연차 시작일보다 빠를 수 없습니다.')
      if (!effectiveSubEnd) e.push('대체교사 지원 종료일을 선택하세요.')
      else if (effectiveSubStart && effectiveSubEnd < effectiveSubStart)
        e.push('대체교사 지원 종료일은 시작일 이전일 수 없습니다.')
      else if (endDate && effectiveSubEnd > endDate) e.push('대체교사 지원 종료일은 연차 종료일보다 늦을 수 없습니다.')
    }
    return e
  }, [startDate, endDate, today, pastMode, remainingAfter, subActive, subName, subPhone, effectiveSubStart, effectiveSubEnd])

  const invalid = errors.length > 0

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (submitting || invalid) return // 중복/유효성 위반 방지
      setSubmitting(true)
      addLeaveHistory({
        staff_id: selectedStaff,
        leave_type: selectedType,
        start_date: startDate,
        end_date: endDate,
        days_used: expectedDays,
        reason: reason || undefined,
        sub_name: subActive ? subName.trim() : undefined,
        sub_phone: subActive ? subPhone.trim() : undefined,
        sub_start: subActive ? effectiveSubStart : undefined,
        sub_end: subActive ? effectiveSubEnd : undefined,
      })
      router.push('/dashboard') // 등록 후 대시보드로 이동
    },
    [
      submitting, invalid, router,
      selectedStaff, selectedType, startDate, endDate, expectedDays, reason,
      subActive, subName, subPhone, effectiveSubStart, effectiveSubEnd,
    ]
  )

  const inputCls =
    'w-full bg-surface-bright border border-outline-variant rounded-lg px-4 py-3 text-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all'
  const labelCls = 'text-label-md font-medium text-on-surface-variant'

  return (
    <form onSubmit={handleSubmit} className="max-w-container-max">
      {/* Hero 헤더 */}
      <div className="mb-6">
        <h1 className="text-headline-lg font-bold text-on-surface">연차 신청</h1>
        <p className="text-on-surface-variant text-body-lg mt-1">
          아래 정보를 입력해 연차를 등록하세요.
        </p>
      </div>


      <div className="grid grid-cols-12 gap-6 items-start">
        {/* 좌측: 연차 요약 */}
        <section className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-surface-white rounded-xl border border-outline-variant p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-title-md font-semibold text-on-surface">연차 요약</h3>
              <BarChart3 size={20} className="text-primary" />
            </div>
            <div className="space-y-6">
              <div className="flex items-end justify-between border-b border-outline-variant pb-4">
                <div>
                  <p className="text-label-md text-on-surface-variant mb-1">총 부여 연차</p>
                  <p className="text-display-lg font-bold text-primary leading-none">{balance.total}</p>
                </div>
                <p className="text-label-sm text-outline mb-1">일 / 년</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-container-low p-4 rounded-lg">
                  <p className="text-label-sm text-on-surface-variant">사용</p>
                  <p className="text-title-lg font-semibold text-secondary">{balance.used}</p>
                </div>
                <div className="bg-surface-container-low p-4 rounded-lg">
                  <p className="text-label-sm text-on-surface-variant">잔여</p>
                  <p className="text-title-lg font-semibold text-success-green">{balance.remaining}</p>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-label-sm mb-2">
                  <span className="text-on-surface-variant">사용률</span>
                  <span className="font-bold text-primary">{utilization}%</span>
                </div>
                <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${utilization}%` }} />
                </div>
              </div>
              {/* 신청 후 예상 */}
              <div className="rounded-lg bg-surface-container p-4 flex items-center justify-between">
                <span className="text-label-sm text-on-surface-variant">신청 후 잔여</span>
                <span className={`text-title-md font-bold ${remainingAfter < 0 ? 'text-error' : 'text-on-surface'}`}>
                  {remainingAfter.toFixed(1)}일
                </span>
              </div>
            </div>
          </div>

          {/* 안내 카드 */}
          <div className="relative overflow-hidden rounded-xl h-44 bg-primary-container p-6 text-on-primary-container flex flex-col justify-between">
            <div>
              <p className="text-headline-md font-semibold">휴식이 필요하신가요?</p>
              <p className="text-body-md opacity-90 mt-1">미리 계획해 업무 균형을 유지하세요.</p>
            </div>
            <div className="flex items-center gap-2 text-label-md">
              <Info size={18} />
              <span>연차 정책 안내</span>
            </div>
          </div>
        </section>

        {/* 우측: 폼 + 대체교사 */}
        <section className="col-span-12 lg:col-span-8 space-y-6">
          {/* 연차 상세 */}
          <div className="bg-surface-white rounded-xl p-6 shadow-sm border border-outline-variant">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-primary">
                <ClipboardList size={20} />
              </div>
              <h3 className="text-title-lg font-semibold text-on-surface">연차 상세</h3>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className={labelCls}>직원 <span className="text-error">*</span></label>
                  <select value={selectedStaff} onChange={(e) => setSelectedStaff(e.target.value)} className={inputCls}>
                    {store.staff.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className={labelCls}>연차 유형 <span className="text-error">*</span></label>
                  <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className={inputCls}>
                    {LEAVE_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 이전(과거) 연차 등록 토글 */}
              <label className="flex items-center gap-2 cursor-pointer w-fit">
                <input
                  type="checkbox"
                  checked={pastMode}
                  onChange={(e) => setPastMode(e.target.checked)}
                  className="rounded border-outline text-primary focus:ring-primary"
                />
                <History size={16} className="text-on-surface-variant" />
                <span className="text-label-md text-on-surface">이전 연차등록 (과거 일자 선택)</span>
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className={labelCls}>시작일 <span className="text-error">*</span></label>
                  <DatePicker value={startDate} onChange={setStartDate} placeholder="시작일 선택" min={pastMode ? undefined : today} />
                </div>
                <div className="space-y-2">
                  <label className={labelCls}>종료일 <span className="text-error">*</span></label>
                  <DatePicker value={endDate} onChange={setEndDate} placeholder="종료일 선택" min={startDate || (pastMode ? undefined : today)} />
                </div>
              </div>

              {/* 차감 일수 안내 */}
              <div className="rounded-lg bg-surface-container px-4 py-3 flex items-center justify-between text-label-md">
                <span className="text-on-surface-variant">차감 연차 (토·일·공휴일 제외)</span>
                <span className="font-bold text-primary">{expectedDays}일</span>
              </div>

              <div className="space-y-2">
                <label className={labelCls}>사유</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="연차 사유를 입력하세요 (선택)"
                  className={`${inputCls} resize-none`}
                />
              </div>
            </div>
          </div>

          {/* 대체교사 지원 (전역 설정이 켜진 경우에만 노출) */}
          {store.substituteEnabled ? (
          <div className="bg-surface-white rounded-xl p-6 shadow-sm border-2 border-primary-container/30 relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="text-title-lg font-semibold text-on-surface">대체교사 지원</h3>
                  <p className="text-label-sm text-on-surface-variant">대체교사 지원 신청</p>
                </div>
              </div>
              {/* 지원 여부 토글 */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={subEnabled}
                  onChange={(e) => setSubEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <span className="w-11 h-6 rounded-full bg-surface-container-high peer-checked:bg-success-green transition-colors" />
                <span className="absolute left-1 top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
              </label>
            </div>

            {subEnabled ? (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className={labelCls}>대체교사 이름 <span className="text-error">*</span></label>
                    <div className="relative">
                      <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                      <input type="text" value={subName} onChange={(e) => setSubName(e.target.value)} placeholder="대체교사 이름" className={`${inputCls} pl-10`} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className={labelCls}>전화번호 <span className="text-error">*</span></label>
                    <div className="relative">
                      <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                      <input
                        type="tel"
                        value={subPhone}
                        onChange={(e) => setSubPhone(e.target.value)}
                        placeholder="010-1234-5678"
                        className={`${inputCls} pl-10 ${subPhone && !PHONE_RE.test(subPhone.trim()) ? 'border-error focus:ring-error/20' : ''}`}
                      />
                    </div>
                    <p className="text-xs text-on-surface-variant">형식: 010-1234-5678</p>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer w-fit">
                  <input
                    type="checkbox"
                    checked={subSameAsLeave}
                    onChange={(e) => setSubSameAsLeave(e.target.checked)}
                    className="rounded border-outline text-primary focus:ring-primary"
                  />
                  <span className="text-label-md text-on-surface">휴가 일자와 동일</span>
                </label>

                {subSameAsLeave ? (
                  <div className="rounded-lg bg-surface-container px-4 py-3 text-label-md text-on-surface-variant">
                    지원 기간:{' '}
                    <span className="font-semibold text-on-surface">{startDate || '—'}</span>
                    {' ~ '}
                    <span className="font-semibold text-on-surface">{endDate || '—'}</span>
                    {subDays > 0 && <span className="ml-2 text-primary font-semibold">({subDays}일)</span>}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className={labelCls}>지원 시작일 <span className="text-error">*</span></label>
                      <DatePicker value={subStart} onChange={setSubStart} placeholder="시작일 선택" min={startDate} max={endDate} />
                    </div>
                    <div className="space-y-2">
                      <label className={labelCls}>지원 종료일 <span className="text-error">*</span></label>
                      <DatePicker value={subEnd} onChange={setSubEnd} placeholder="종료일 선택" min={subStart || startDate} max={endDate} />
                    </div>
                    <p className="md:col-span-2 text-xs text-on-surface-variant -mt-2">
                      대체교사 지원 기간은 연차 기간({startDate || '—'} ~ {endDate || '—'}) 안에서 선택할 수 있습니다.
                    </p>
                  </div>
                )}

                <div className="p-4 bg-surface-container rounded-lg border border-outline-variant/50 flex gap-3">
                  <ShieldCheck size={20} className="text-primary shrink-0" />
                  <p className="text-label-sm text-on-surface-variant leading-relaxed">
                    대체교사 정보는 연차 승인 시 함께 등록되며, 지정한 기간 동안 학급 지원에 배정됩니다.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-label-md text-on-surface-variant">
                대체교사 지원이 필요하면 토글을 켜고 정보를 입력하세요.
              </p>
            )}
          </div>
          ) : null}

          {/* 유효성 안내 */}
          {errors.length > 0 && (
            <ul className="rounded-lg bg-error-container/30 border border-error/20 px-4 py-3 space-y-1">
              {errors.map((msg) => (
                <li key={msg} className="text-sm text-error flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-error" />
                  {msg}
                </li>
              ))}
            </ul>
          )}

          {/* 액션 */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="px-8 py-3 rounded-xl border border-outline-variant text-on-surface font-label-md hover:bg-surface-container transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={invalid || submitting}
              className="px-10 py-3 rounded-xl bg-primary text-on-primary font-label-md font-semibold shadow-lg shadow-primary/25 hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {submitting ? '등록 중...' : '등록'}
              <Send size={18} />
            </button>
          </div>
        </section>
      </div>
    </form>
  )
}
