'use client'

import { useSyncExternalStore } from 'react'
import {
  mockStaff,
  mockPositions,
  mockStaffLeaveBalance,
  mockLeaveHistory,
  mockSubstituteBalance,
  mockSubstituteUsage,
} from './mock-data'
import { loadAll, seedAll, db, type AppData } from './supabase/db'
import type {
  Staff,
  Position,
  LeaveTier,
  StaffLeaveBalance,
  SpecialLeaveAdjustment,
  LeaveHistory,
  LeaveType,
  SubstituteBalance,
  SubstituteUsage,
} from '@/types'

export const CURRENT_YEAR = 2026
const PRIOR_YEARS = [2024, 2025]

// 기본 연차 기준표 (입사일=근속년수 기준)
const DEFAULT_LEAVE_TIERS: LeaveTier[] = [
  { id: 'tier-0', minYears: 0, days: 11, label: '1년 미만' },
  { id: 'tier-1', minYears: 1, days: 15, label: '1~2년' },
  { id: 'tier-3', minYears: 3, days: 16, label: '3~4년' },
  { id: 'tier-5', minYears: 5, days: 17, label: '5~9년' },
  { id: 'tier-10', minYears: 10, days: 19, label: '10년 이상' },
]

export interface StaffStoreState {
  staff: Staff[]
  positions: Position[]
  leaveTiers: LeaveTier[]
  balances: StaffLeaveBalance[] // staff별 연도별 기본 부여/사용
  adjustments: SpecialLeaveAdjustment[] // 연차 추가/차감 이력
  leaveHistory: LeaveHistory[] // 연차 사용 이력 (대체교사 정보 포함)
  subBalances: SubstituteBalance[]
  subUsages: SubstituteUsage[]
}

// 근속년수 (입사일 → 오늘 기준)
export function yearsOfService(hireDate: string): number {
  if (!hireDate) return 0
  const diff = Date.now() - new Date(hireDate).getTime()
  return Math.max(0, Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000)))
}

// 연차 기준표로 입사일 기준 총연차 자동 산정
export function computeEntitlement(hireDate: string, tiers: LeaveTier[]): number {
  const yos = yearsOfService(hireDate)
  const sorted = [...tiers].sort((a, b) => a.minYears - b.minYears)
  let days = sorted[0]?.days ?? 0
  for (const t of sorted) {
    if (yos >= t.minYears) days = t.days
  }
  return days
}

// ── 이전 연도 데이터 시드 (조회 전용) ──
function seedPriorBalances(): StaffLeaveBalance[] {
  const rows: StaffLeaveBalance[] = []
  mockStaff.forEach((s, i) => {
    PRIOR_YEARS.forEach((year) => {
      const total = s.position_id === 'pos-001' ? 15 : 11
      const used = [7, 9, 8, 6][i % 4] - (year === 2024 ? 1 : 0)
      rows.push({
        id: `bal-${s.id}-${year}`,
        staff_id: s.id,
        year,
        total_days: total,
        used_days: Math.max(0, used),
        special_addition: 0,
        special_deduction: 0,
        created_at: `${year}-01-01T00:00:00Z`,
        updated_at: `${year}-01-01T00:00:00Z`,
      })
    })
  })
  return rows
}

function createInitialState(): StaffStoreState {
  return {
    staff: mockStaff.map((s) => ({ ...s })),
    positions: mockPositions.map((p) => ({ ...p })),
    leaveTiers: DEFAULT_LEAVE_TIERS.map((t) => ({ ...t })),
    balances: [
      ...mockStaffLeaveBalance.map((b) => ({ ...b })),
      ...seedPriorBalances(),
    ],
    adjustments: [],
    leaveHistory: mockLeaveHistory.map((h) => ({ ...h })),
    subBalances: mockSubstituteBalance.map((b) => ({
      ...b,
      // 폼에서 직접 수정 가능하도록 used_days를 명시 보관 (없으면 월별 합계로 대체)
      used_days: mockSubstituteUsage
        .filter((u) => u.staff_id === b.staff_id && u.year === b.year)
        .reduce((sum, u) => sum + u.days_used, 0),
    })),
    subUsages: mockSubstituteUsage.map((u) => ({ ...u })),
  }
}

let state: StaffStoreState = createInitialState()
const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
}
function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
function getSnapshot() {
  return state
}

let idCounter = 0
function nextId(prefix: string) {
  idCounter += 1
  // 세션 간 충돌 방지: UUID(있으면) + 카운터. 카운터는 동일 틱 내 충돌 방지용.
  const uuid =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10)
  return `${prefix}-${uuid}-${idCounter}`
}

// write-through: Supabase 기록 (실패는 무시 — 로컬 상태는 항상 유지)
function persist(run: () => unknown) {
  try {
    Promise.resolve(run() as Promise<unknown>).catch(() => {})
  } catch {
    /* noop */
  }
}

// ── Supabase 하이드레이션 ──
let hydrated = false

function toAppData(s: StaffStoreState): AppData {
  return {
    positions: s.positions,
    leaveTiers: s.leaveTiers,
    staff: s.staff,
    balances: s.balances,
    adjustments: s.adjustments,
    leaveHistory: s.leaveHistory,
    subBalances: s.subBalances,
    subUsages: s.subUsages,
  }
}

/**
 * 앱 로드 시 1회: Supabase에서 전체 데이터 로드 → 스토어 교체.
 * Supabase가 비어 있으면 현재(mock) 상태를 업로드(seed).
 * 스키마 미생성/네트워크 오류 시 mock 상태 유지.
 */
export async function hydrateFromSupabase() {
  if (hydrated) return
  hydrated = true
  try {
    const data = await loadAll()
    if (data.staff.length === 0) {
      // 최초 실행: 현재 mock 상태를 Supabase에 시드
      await seedAll(toAppData(state))
      return
    }
    state = {
      staff: data.staff,
      positions: data.positions,
      leaveTiers: data.leaveTiers.length ? data.leaveTiers : state.leaveTiers,
      balances: data.balances,
      adjustments: data.adjustments,
      leaveHistory: data.leaveHistory,
      subBalances: data.subBalances,
      subUsages: data.subUsages,
    }
    emit()
  } catch {
    hydrated = false // 다음 마운트에서 재시도 허용
  }
}

interface StaffInput {
  name: string
  position_id: string
  status: string
  hire_date: string
  resignation_date?: string
  photo_url?: string
}

// ── Mutations ──
export function addStaff(input: StaffInput) {
  const id = nextId('staff')
  const now = new Date().toISOString()
  const newStaff: Staff = {
    id,
    kindergarten_id: 'kg-001',
    name: input.name,
    staff_number: String(state.staff.length + 1).padStart(3, '0'),
    position_id: input.position_id,
    employment_type: '정규직',
    status: input.status,
    hire_date: input.hire_date,
    resignation_date: input.resignation_date || undefined,
    photo_url: input.photo_url || undefined,
    created_at: now,
    updated_at: now,
  }
  // 올해 연차는 기준표로 자동 산정
  const newBalance: StaffLeaveBalance = {
    id: nextId('bal'),
    staff_id: id,
    year: CURRENT_YEAR,
    total_days: computeEntitlement(input.hire_date, state.leaveTiers),
    used_days: 0,
    special_addition: 0,
    special_deduction: 0,
    created_at: now,
    updated_at: now,
  }
  // 대체교사 지원일은 전체 기준 기본값
  const newSub: SubstituteBalance = {
    id: nextId('sub'),
    staff_id: id,
    year: CURRENT_YEAR,
    total_days: 15,
    is_custom: false,
    used_days: 0,
    created_at: now,
    updated_at: now,
  }
  state = {
    ...state,
    staff: [...state.staff, newStaff],
    balances: [...state.balances, newBalance],
    subBalances: [...state.subBalances, newSub],
  }
  emit()
  persist(() => db.upsertStaff(newStaff))
  persist(() => db.upsertBalance(newBalance))
  persist(() => db.upsertSubBalance(newSub))
  return id
}

export function updateStaff(id: string, patch: StaffInput) {
  const now = new Date().toISOString()
  let updated: Staff | undefined
  state = {
    ...state,
    staff: state.staff.map((s) => {
      if (s.id !== id) return s
      updated = {
        ...s,
        name: patch.name,
        position_id: patch.position_id,
        status: patch.status,
        hire_date: patch.hire_date,
        resignation_date: patch.resignation_date || undefined,
        photo_url: patch.photo_url || undefined,
        updated_at: now,
      }
      return updated
    }),
  }
  emit()
  if (updated) persist(() => db.upsertStaff(updated!))
}

export function addPosition(name: string): string {
  const id = nextId('pos')
  const now = new Date().toISOString()
  const pos: Position = {
    id,
    kindergarten_id: 'kg-001',
    name: name.trim(),
    created_at: now,
    updated_at: now,
  }
  state = { ...state, positions: [...state.positions, pos] }
  emit()
  persist(() => db.upsertPosition(pos))
  return id
}

export function updateLeaveTiers(tiers: LeaveTier[]) {
  const next = tiers.map((t) => ({ ...t }))
  state = { ...state, leaveTiers: next }
  emit()
  persist(() => db.replaceLeaveTiers(next))
}

// Supabase에 저장된 사진 URL을 스토어에 반영 (앱 로드 시 1회 하이드레이션)
export function hydrateStaffPhotos(photoMap: Record<string, string>) {
  let changed = false
  const staff = state.staff.map((s) => {
    const url = photoMap[s.id]
    if (url && url !== s.photo_url) {
      changed = true
      return { ...s, photo_url: url }
    }
    return s
  })
  if (changed) {
    state = { ...state, staff }
    emit()
  }
}

export function removeStaff(id: string) {
  state = {
    ...state,
    staff: state.staff.filter((s) => s.id !== id),
    balances: state.balances.filter((b) => b.staff_id !== id),
    adjustments: state.adjustments.filter((a) => a.staff_id !== id),
    leaveHistory: state.leaveHistory.filter((h) => h.staff_id !== id),
    subBalances: state.subBalances.filter((b) => b.staff_id !== id),
    subUsages: state.subUsages.filter((u) => u.staff_id !== id),
  }
  emit()
  persist(() => db.deleteStaff(id))
}

export function addAdjustment(
  staffId: string,
  year: number,
  type: '추가' | '감소',
  days: number,
  reason: string
) {
  const adj: SpecialLeaveAdjustment = {
    id: nextId('adj'),
    staff_id: staffId,
    year,
    adjustment_type: type,
    days,
    reason,
    created_at: new Date().toISOString(),
  }
  state = { ...state, adjustments: [...state.adjustments, adj] }
  emit()
  persist(() => db.upsertAdjustment(adj))
}

// 연차 사용 이력 등록 (+선택적 대체교사 정보)
export interface LeaveHistoryInput {
  staff_id: string
  leave_type: string
  start_date: string
  end_date: string
  days_used: number
  reason?: string
  sub_name?: string
  sub_phone?: string
  sub_start?: string
  sub_end?: string
}

export function addLeaveHistory(input: LeaveHistoryInput): string {
  const id = nextId('history')
  const now = new Date().toISOString()
  const record: LeaveHistory = {
    id,
    staff_id: input.staff_id,
    year: new Date(input.start_date).getFullYear() || CURRENT_YEAR,
    leave_type: input.leave_type as LeaveType,
    start_date: input.start_date,
    end_date: input.end_date,
    days_used: input.days_used,
    reason: input.reason,
    sub_name: input.sub_name,
    sub_phone: input.sub_phone,
    sub_start: input.sub_start,
    sub_end: input.sub_end,
    created_at: now,
    updated_at: now,
  }
  state = { ...state, leaveHistory: [...state.leaveHistory, record] }
  emit()
  persist(() => db.upsertHistory(record))
  return id
}

// ── Selectors (순수 함수) ──
export function selectLeaveHistory(
  s: StaffStoreState,
  staffId: string,
  year?: number
): LeaveHistory[] {
  return s.leaveHistory
    .filter((h) => h.staff_id === staffId && (year == null || h.year === year))
    .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
}
export function positionName(s: StaffStoreState, positionId?: string): string {
  return s.positions.find((p) => p.id === positionId)?.name ?? '직원'
}

export interface LeaveView {
  base: number
  addition: number
  deduction: number
  total: number
  used: number
  remaining: number
  adjustments: SpecialLeaveAdjustment[]
}

export function selectLeave(
  s: StaffStoreState,
  staffId: string,
  year: number
): LeaveView {
  const bal = s.balances.find((b) => b.staff_id === staffId && b.year === year)
  const adjs = s.adjustments.filter(
    (a) => a.staff_id === staffId && a.year === year
  )
  const addition =
    (bal?.special_addition ?? 0) +
    adjs.filter((a) => a.adjustment_type === '추가').reduce((x, a) => x + a.days, 0)
  const deduction =
    (bal?.special_deduction ?? 0) +
    adjs.filter((a) => a.adjustment_type === '감소').reduce((x, a) => x + a.days, 0)
  // 올해 기본 연차는 기준표로 자동 산정(입사일 기준), 이전 연도는 기록값 사용
  const staff = s.staff.find((st) => st.id === staffId)
  const base =
    year === CURRENT_YEAR && staff
      ? computeEntitlement(staff.hire_date, s.leaveTiers)
      : bal?.total_days ?? 0
  const total = base + addition - deduction
  const used = bal?.used_days ?? 0
  return { base, addition, deduction, total, used, remaining: total - used, adjustments: adjs }
}

export interface SubView {
  total: number
  used: number
  remaining: number
  isCustom: boolean
  usages: SubstituteUsage[]
}

export function selectSubstitute(
  s: StaffStoreState,
  staffId: string,
  year: number
): SubView {
  const bal = s.subBalances.find((b) => b.staff_id === staffId && b.year === year)
  const usages = s.subUsages
    .filter((u) => u.staff_id === staffId && u.year === year)
    .sort((a, b) => a.month - b.month)
  const usageSum = usages.reduce((x, u) => x + u.days_used, 0)
  const total = bal?.total_days ?? 0
  const used = bal?.used_days ?? usageSum
  return { total, used, remaining: total - used, isCustom: bal?.is_custom ?? false, usages }
}

export function selectYears(s: StaffStoreState, staffId: string): number[] {
  return Array.from(
    new Set(s.balances.filter((b) => b.staff_id === staffId).map((b) => b.year))
  ).sort((a, b) => b - a)
}

// ── Hook ──
export function useStaffStore(): StaffStoreState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
