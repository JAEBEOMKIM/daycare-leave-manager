'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  X,
  Info,
  CalendarRange,
  UserCog,
} from 'lucide-react'
import { useHolidays } from '@/lib/holidays'
import { useStaffStore, selectLeave, CURRENT_YEAR } from '@/lib/staff-store'

/** Date → 로컬 기준 YYYY-MM-DD (toISOString의 UTC 변환 회피) */
function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** start~end(YYYY-MM-DD) 사이의 모든 날짜 ISO 배열 */
function expandDates(start: string, end: string): string[] {
  if (!start || !end) return []
  const s = new Date(start)
  const e = new Date(end)
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || e < s) return []
  const out: string[] = []
  const d = new Date(s)
  for (let i = 0; i < 366 && d <= e; i++) {
    out.push(toIso(d))
    d.setDate(d.getDate() + 1)
  }
  return out
}

// Static class maps (no dynamic interpolation — required for Tailwind JIT)
const LEAVE_STYLE: Record<string, string> = {
  종일휴가: 'bg-primary-container/10 border-primary-container text-on-primary-fixed-variant',
  오전반차: 'bg-success-green/10 border-success-green text-success-green',
  오후반차: 'bg-success-green/10 border-success-green text-success-green',
  병가: 'bg-error-red/10 border-error-red text-error-red',
  경조사: 'bg-primary-fixed/40 border-primary text-on-primary-fixed-variant',
  지각: 'bg-warning-amber/10 border-warning-amber text-warning-amber',
}

// 대체교사 필터 키 (연차 유형과 구분되는 별도 토글)
const SUBSTITUTE_FILTER = '대체교사'

const FILTERS = [
  { key: '종일휴가', label: '연차', dot: 'bg-primary-container' },
  { key: '병가', label: '병가', dot: 'bg-error-red' },
  { key: '오전반차', label: '반차', dot: 'bg-success-green' },
  { key: '경조사', label: '경조사', dot: 'bg-primary' },
  { key: SUBSTITUTE_FILTER, label: '대체교사', dot: 'bg-warning-amber' },
]

const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일']

export default function DashboardPage() {
  const store = useStaffStore()
  const getStaffName = useCallback(
    (id: string) => store.staff.find((s) => s.id === id)?.name ?? '미상',
    [store.staff]
  )

  const [currentDate, setCurrentDate] = useState(new Date(2026, 5, 1)) // 2026-06
  const [activeFilters, setActiveFilters] = useState<string[]>(
    FILTERS.map((f) => f.key)
  )
  const [dayModalIso, setDayModalIso] = useState<string | null>(null)
  const [weekModalOpen, setWeekModalOpen] = useState(false)

  const showSubstitute = activeFilters.includes(SUBSTITUTE_FILTER)

  const handlePrev = useCallback(() => {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  }, [])
  const handleNext = useCallback(() => {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))
  }, [])
  const handleToday = useCallback(() => {
    const t = new Date()
    setCurrentDate(new Date(t.getFullYear(), t.getMonth(), 1))
  }, [])

  const toggleFilter = (key: string) =>
    setActiveFilters((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const { holidayMap } = useHolidays(year)

  const monthLabel = useMemo(
    () => `${year}년 ${month + 1}월`,
    [year, month]
  )

  // Build calendar cells (Monday-first), including leading/trailing ghost days
  const cells = useMemo(() => {
    const firstDay = new Date(year, month, 1)
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const lead = (firstDay.getDay() + 6) % 7 // Mon=0
    const prevMonthDays = new Date(year, month, 0).getDate()

    const result: { day: number; current: boolean; iso: string | null }[] = []

    for (let i = lead - 1; i >= 0; i--) {
      result.push({ day: prevMonthDays - i, current: false, iso: null })
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      result.push({ day: d, current: true, iso })
    }
    while (result.length % 7 !== 0) {
      const tail = result.length - (lead + daysInMonth) + 1
      result.push({ day: tail, current: false, iso: null })
    }
    return result
  }, [year, month])

  const eventsForDate = useCallback(
    (iso: string) =>
      store.leaveHistory.filter((lv) => {
        if (!activeFilters.includes(lv.leave_type)) return false
        const cur = new Date(iso).getTime()
        return (
          cur >= new Date(lv.start_date).getTime() &&
          cur <= new Date(lv.end_date).getTime()
        )
      }),
    [activeFilters, store.leaveHistory]
  )

  // 오늘 (실제 날짜)
  const todayIso = useMemo(() => toIso(new Date()), [])

  // 이번주(월~일) 날짜 집합 — 오늘 기준
  const thisWeekIsos = useMemo(() => {
    const t = new Date(todayIso)
    const dow = (t.getDay() + 6) % 7 // Mon=0
    const monday = new Date(t)
    monday.setDate(t.getDate() - dow)
    const set = new Set<string>()
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      set.add(toIso(d))
    }
    return set
  }, [todayIso])

  // 날짜별 대체교사 배치 맵 — 연차이력(leave_history)의 대체교사 정보에서 직접 파생
  interface DeploymentItem {
    id: string
    covered_staff_id: string
    substitute_name: string
  }
  const deploymentsByDate = useMemo(() => {
    const map: Record<string, DeploymentItem[]> = {}
    for (const lv of store.leaveHistory) {
      if (!lv.sub_name || !lv.sub_start || !lv.sub_end) continue
      for (const iso of expandDates(lv.sub_start, lv.sub_end)) {
        ;(map[iso] ??= []).push({
          id: `${lv.id}-${iso}`,
          covered_staff_id: lv.staff_id,
          substitute_name: lv.sub_name,
        })
      }
    }
    return map
  }, [store.leaveHistory])

  // 이번주 일정 요약 (연차 + 대체교사) — "알아두세요" 대체용
  const thisWeekSchedule = useMemo(() => {
    const weekDates = Array.from(thisWeekIsos).sort()
    const leaves = store.leaveHistory
      .filter((lv) => {
        const s = new Date(lv.start_date).getTime()
        const e = new Date(lv.end_date).getTime()
        return weekDates.some((iso) => {
          const c = new Date(iso).getTime()
          return c >= s && c <= e
        })
      })
      .map((lv) => ({
        id: lv.id,
        name: getStaffName(lv.staff_id),
        label: lv.leave_type,
        range: lv.start_date === lv.end_date
          ? lv.start_date.slice(5).replace('-', '/')
          : `${lv.start_date.slice(5).replace('-', '/')}~${lv.end_date.slice(5).replace('-', '/')}`,
      }))

    // 이번주 대체교사 — 연차이력의 대체교사 기간에서 파생 (직원별 중복 제거)
    const seen = new Set<string>()
    const deployments: { id: string; name: string; covered: string; date: string }[] = []
    for (const lv of store.leaveHistory) {
      if (!lv.sub_name || !lv.sub_start || !lv.sub_end) continue
      for (const iso of expandDates(lv.sub_start, lv.sub_end)) {
        if (!thisWeekIsos.has(iso)) continue
        const key = `${lv.id}-${iso}`
        if (seen.has(key)) continue
        seen.add(key)
        deployments.push({
          id: key,
          name: lv.sub_name,
          covered: getStaffName(lv.staff_id),
          date: iso.slice(5).replace('-', '/'),
        })
      }
    }

    return { leaves, deployments }
  }, [thisWeekIsos, store.leaveHistory, getStaffName])

  // My balance (원장) — 스토어에서 조정 반영
  const balance = useMemo(() => {
    const v = selectLeave(store, 'staff-001', CURRENT_YEAR)
    return { total_days: v.total, used_days: v.used, remaining_days: v.remaining }
  }, [store])
  const usedPct = balance.total_days
    ? Math.round((balance.used_days / balance.total_days) * 100)
    : 0

  // 일자별 팝업용 데이터
  const dayModalData = useMemo(() => {
    if (!dayModalIso) return null
    const leaves = eventsForDate(dayModalIso).map((ev) => ({
      id: ev.id,
      name: getStaffName(ev.staff_id),
      type: ev.leave_type,
      range: ev.start_date === ev.end_date ? ev.start_date : `${ev.start_date} ~ ${ev.end_date}`,
    }))
    const deps = (deploymentsByDate[dayModalIso] ?? []).map((d) => ({
      id: d.id,
      name: d.substitute_name,
      covered: getStaffName(d.covered_staff_id),
    }))
    return { iso: dayModalIso, leaves, deps }
  }, [dayModalIso, eventsForDate, deploymentsByDate, getStaffName])

  return (
    <div className="flex h-full overflow-hidden">
      {/* ===== Calendar main ===== */}
      <div className="flex-1 flex flex-col bg-surface-container-lowest overflow-hidden">
        {/* Controls */}
        <div className="px-4 md:px-8 py-4 flex flex-wrap gap-3 justify-between items-center shrink-0 border-b border-outline-variant/30">
          <div className="flex items-center gap-4">
            <h3 className="text-headline-md text-on-surface">{monthLabel}</h3>
            <div className="flex items-center bg-surface-container-low rounded-lg p-1">
              <button
                onClick={handlePrev}
                className="p-1.5 hover:bg-surface-white rounded-md transition-all text-on-surface-variant"
                aria-label="이전 달"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={handleToday}
                className="px-4 py-1 bg-surface-white text-on-surface shadow-sm rounded-md text-label-md"
              >
                오늘
              </button>
              <button
                onClick={handleNext}
                className="p-1.5 hover:bg-surface-white rounded-md transition-all text-on-surface-variant"
                aria-label="다음 달"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="px-4 md:px-8 py-2 flex flex-wrap items-center gap-4 shrink-0 border-b border-outline-variant/20 text-label-sm text-on-surface-variant">
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-error-red text-white flex items-center justify-center text-[9px] font-bold">
              N
            </span>
            오늘
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-error-red/70" />
            주말·공휴일 (연차 사용 불가)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-warning-amber" />
            대체교사
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-primary/15 ring-1 ring-primary/30" />
            이번주
          </span>
        </div>

        {/* Calendar */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Weekday header */}
          <div className="grid grid-cols-7 border-b border-outline-variant/30">
            {WEEKDAYS.map((d, i) => (
              <div
                key={d}
                className={`py-3 text-center text-label-sm uppercase tracking-wider ${
                  i >= 5 ? 'text-error-red/60' : 'text-secondary'
                }`}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 border-l border-outline-variant/20">
            {cells.map((cell, idx) => {
              const weekendCell = idx % 7 >= 5
              const events = cell.iso ? eventsForDate(cell.iso) : []
              const deployments =
                cell.iso && showSubstitute
                  ? deploymentsByDate[cell.iso] ?? []
                  : []
              const isToday = cell.iso === todayIso
              const isThisWeek = cell.iso ? thisWeekIsos.has(cell.iso) : false
              const holidayName = cell.iso ? holidayMap[cell.iso] : undefined
              const isHoliday = Boolean(holidayName)
              // 연차 사용 불가일: 주말 또는 공휴일
              const nonSelectable = cell.current && (weekendCell || isHoliday)

              // 배경 우선순위: 오늘 < 공휴일 < 주말 < 이번주 < 평일
              const cellBg = !cell.current
                ? 'bg-surface-container-low/30'
                : isToday
                  ? 'bg-error-red/5 ring-2 ring-inset ring-error-red/40'
                  : isHoliday
                    ? 'bg-error-red/5'
                    : isThisWeek
                      ? 'bg-primary/[0.06] ring-1 ring-inset ring-primary/15'
                      : weekendCell
                        ? 'bg-surface-container-low/40'
                        : ''

              return (
                <div
                  key={idx}
                  title={nonSelectable ? '연차 사용 불가일 (주말·공휴일)' : undefined}
                  className={`border-b border-r border-outline-variant/20 p-2 min-h-[120px] ${cellBg}`}
                >
                  <div className="flex justify-between items-start gap-1">
                    {isToday ? (
                      <span className="w-6 h-6 rounded-full bg-error-red text-white flex items-center justify-center text-[11px] font-bold shadow-sm">
                        {cell.day}
                      </span>
                    ) : (
                      <span
                        className={`text-label-sm ${
                          !cell.current
                            ? 'text-outline'
                            : isHoliday || weekendCell
                              ? 'text-error-red/70 font-semibold'
                              : 'text-on-surface'
                        }`}
                      >
                        {cell.day}
                      </span>
                    )}
                    {isToday && (
                      <span className="text-[10px] text-error-red font-bold">
                        오늘
                      </span>
                    )}
                  </div>

                  {/* 공휴일 표시 */}
                  {holidayName && (
                    <div className="mt-1 truncate rounded bg-error-red/10 px-1.5 py-0.5 text-[10px] font-medium text-error-red">
                      {holidayName}
                    </div>
                  )}

                  {(() => {
                    // 같은 날 연차 + 대체교사 통합 목록
                    const items = [
                      ...events.map((ev) => ({
                        kind: 'leave' as const,
                        id: ev.id,
                        label: `${getStaffName(ev.staff_id)} (${ev.leave_type})`,
                        style:
                          LEAVE_STYLE[ev.leave_type] ??
                          'bg-surface-container border-outline text-on-surface-variant',
                      })),
                      ...deployments.map((dep) => ({
                        kind: 'sub' as const,
                        id: dep.id,
                        label: `${dep.substitute_name} (${getStaffName(dep.covered_staff_id)})`,
                        style: 'border-warning-amber bg-warning-amber/10 text-warning-amber',
                      })),
                    ]
                    // 최대 3개, 4건 이상이면 2개 + "+N건"
                    const visible = items.length > 3 ? items.slice(0, 2) : items
                    const overflow = items.length > 3 ? items.length - 2 : 0
                    return (
                      <div className="mt-2 space-y-1">
                        {visible.map((it) => (
                          <div
                            key={it.id}
                            className={`flex items-center gap-1 border-l-4 px-2 py-1 rounded text-[11px] font-medium truncate ${it.style}`}
                            title={it.label}
                          >
                            {it.kind === 'sub' && <UserCog size={11} className="shrink-0" />}
                            <span className="truncate">{it.label}</span>
                          </div>
                        ))}
                        {overflow > 0 && cell.iso && (
                          <button
                            type="button"
                            onClick={() => setDayModalIso(cell.iso)}
                            className="w-full text-left text-[11px] font-semibold text-primary hover:underline px-2 py-0.5"
                          >
                            +{overflow}건 더보기
                          </button>
                        )}
                      </div>
                    )
                  })()}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ===== Right panel ===== */}
      <aside className="hidden xl:flex w-80 border-l border-outline-variant bg-surface-white flex-col shrink-0 overflow-y-auto custom-scrollbar">
        <div className="p-6 space-y-6">
          {/* My balance */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-label-md font-medium text-on-surface">
                내 연차
              </h4>
              <Info size={18} className="text-outline" />
            </div>
            <div className="bg-primary p-5 rounded-xl text-on-primary shadow-xl shadow-primary/20">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <p className="text-[10px] opacity-70 uppercase tracking-widest font-bold">
                    남은 연차
                  </p>
                  <p className="text-display-lg leading-none">
                    {balance.remaining_days}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] opacity-70 uppercase tracking-widest font-bold">
                    전체
                  </p>
                  <p className="text-title-lg leading-none">
                    {balance.total_days}
                  </p>
                </div>
              </div>
              <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-white h-full"
                  style={{ width: `${usedPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div>
            <h4 className="text-label-md font-medium text-on-surface mb-3">
              필터
            </h4>
            <div className="space-y-2">
              {FILTERS.map((f) => (
                <label
                  key={f.key}
                  className="flex items-center justify-between p-3 bg-surface-container-low border border-outline-variant rounded-lg cursor-pointer hover:bg-surface-container transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full ${f.dot}`} />
                    <span className="text-label-md text-on-surface-variant">
                      {f.label}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={activeFilters.includes(f.key)}
                    onChange={() => toggleFilter(f.key)}
                    className="rounded border-outline text-primary focus:ring-primary"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* This week schedule (최대 10건 + 전체 보기) */}
          <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/30">
            <div className="flex items-center gap-2 mb-3 text-primary">
              <CalendarRange size={20} />
              <span className="text-label-md font-bold">이번주 인력 일정</span>
            </div>

            {/* 연차 */}
            <div className="mb-3">
              <p className="text-label-sm font-semibold text-on-surface-variant mb-1.5">
                연차
              </p>
              {thisWeekSchedule.leaves.length === 0 ? (
                <p className="text-label-sm text-on-surface-variant/70">이번주 연차 없음</p>
              ) : (
                <ul className="space-y-1">
                  {thisWeekSchedule.leaves.slice(0, 10).map((l) => (
                    <li key={l.id} className="flex items-center justify-between text-label-sm">
                      <span className="flex items-center gap-1.5 text-on-surface min-w-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        <span className="truncate">{l.name} <span className="text-on-surface-variant">({l.label})</span></span>
                      </span>
                      <span className="text-on-surface-variant shrink-0">{l.range}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* 대체교사 */}
            <div className="border-t border-outline-variant/30 pt-3">
              <p className="text-label-sm font-semibold text-on-surface-variant mb-1.5">
                대체교사
              </p>
              {thisWeekSchedule.deployments.length === 0 ? (
                <p className="text-label-sm text-on-surface-variant/70">이번주 대체 인력 없음</p>
              ) : (
                <ul className="space-y-1">
                  {thisWeekSchedule.deployments.slice(0, 10).map((d) => (
                    <li key={d.id} className="flex items-center justify-between text-label-sm">
                      <span className="flex items-center gap-1.5 text-on-surface min-w-0">
                        <UserCog size={12} className="text-warning-amber shrink-0" />
                        <span className="truncate">{d.name} <span className="text-on-surface-variant">({d.covered} 대체)</span></span>
                      </span>
                      <span className="text-on-surface-variant shrink-0">{d.date}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {(thisWeekSchedule.leaves.length + thisWeekSchedule.deployments.length) > 0 && (
              <button
                type="button"
                onClick={() => setWeekModalOpen(true)}
                className="w-full mt-3 pt-3 border-t border-outline-variant/30 text-primary text-label-md font-medium text-center hover:underline"
              >
                전체 보기 ({thisWeekSchedule.leaves.length + thisWeekSchedule.deployments.length}건)
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* 일자별 전체 일정 팝업 */}
      {dayModalData && (
        <div
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 p-4"
          onClick={() => setDayModalIso(null)}
        >
          <div
            className="w-full max-w-md max-h-[80vh] overflow-y-auto bg-surface-white rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant sticky top-0 bg-surface-white">
              <h3 className="text-title-md font-semibold text-on-surface">{dayModalData.iso} 일정</h3>
              <button type="button" onClick={() => setDayModalIso(null)} className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-5">
              <div>
                <p className="text-label-sm font-semibold text-on-surface-variant mb-2">연차 ({dayModalData.leaves.length})</p>
                {dayModalData.leaves.length === 0 ? (
                  <p className="text-sm text-on-surface-variant/70">연차 없음</p>
                ) : (
                  <ul className="space-y-2">
                    {dayModalData.leaves.map((l) => (
                      <li key={l.id} className="flex items-center justify-between text-body-md">
                        <span className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          {l.name} <span className="text-on-surface-variant">({l.type})</span>
                        </span>
                        <span className="text-sm text-on-surface-variant">{l.range}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="border-t border-outline-variant pt-4">
                <p className="text-label-sm font-semibold text-on-surface-variant mb-2">대체교사 ({dayModalData.deps.length})</p>
                {dayModalData.deps.length === 0 ? (
                  <p className="text-sm text-on-surface-variant/70">대체교사 없음</p>
                ) : (
                  <ul className="space-y-2">
                    {dayModalData.deps.map((d) => (
                      <li key={d.id} className="flex items-center gap-2 text-body-md">
                        <UserCog size={14} className="text-warning-amber" />
                        {d.name} <span className="text-on-surface-variant">({d.covered} 대체)</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 이번주 인력 일정 전체 팝업 */}
      {weekModalOpen && (
        <div
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 p-4"
          onClick={() => setWeekModalOpen(false)}
        >
          <div
            className="w-full max-w-md max-h-[80vh] overflow-y-auto bg-surface-white rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant sticky top-0 bg-surface-white">
              <h3 className="text-title-md font-semibold text-on-surface">이번주 인력 일정</h3>
              <button type="button" onClick={() => setWeekModalOpen(false)} className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-5">
              <div>
                <p className="text-label-sm font-semibold text-on-surface-variant mb-2">연차 ({thisWeekSchedule.leaves.length})</p>
                {thisWeekSchedule.leaves.length === 0 ? (
                  <p className="text-sm text-on-surface-variant/70">없음</p>
                ) : (
                  <ul className="space-y-2">
                    {thisWeekSchedule.leaves.map((l) => (
                      <li key={l.id} className="flex items-center justify-between text-body-md">
                        <span className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          {l.name} <span className="text-on-surface-variant">({l.label})</span>
                        </span>
                        <span className="text-sm text-on-surface-variant">{l.range}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="border-t border-outline-variant pt-4">
                <p className="text-label-sm font-semibold text-on-surface-variant mb-2">대체교사 ({thisWeekSchedule.deployments.length})</p>
                {thisWeekSchedule.deployments.length === 0 ? (
                  <p className="text-sm text-on-surface-variant/70">없음</p>
                ) : (
                  <ul className="space-y-2">
                    {thisWeekSchedule.deployments.map((d) => (
                      <li key={d.id} className="flex items-center justify-between text-body-md">
                        <span className="flex items-center gap-2">
                          <UserCog size={14} className="text-warning-amber" />
                          {d.name} <span className="text-on-surface-variant">({d.covered} 대체)</span>
                        </span>
                        <span className="text-sm text-on-surface-variant">{d.date}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
