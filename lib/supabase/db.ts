'use client'

import { createClient } from './client'
import type {
  Staff,
  Position,
  LeaveTier,
  StaffLeaveBalance,
  SpecialLeaveAdjustment,
  LeaveHistory,
  SubstituteBalance,
  SubstituteUsage,
} from '@/types'

let _sb: ReturnType<typeof createClient> | null = null
function sb() {
  if (!_sb) _sb = createClient()
  return _sb
}

export interface AppData {
  positions: Position[]
  leaveTiers: LeaveTier[]
  staff: Staff[]
  balances: StaffLeaveBalance[]
  adjustments: SpecialLeaveAdjustment[]
  leaveHistory: LeaveHistory[]
  subBalances: SubstituteBalance[]
  subUsages: SubstituteUsage[]
}

// ── 매퍼 (leave_tiers만 컬럼명 다름) ──
const rowToTier = (r: Record<string, unknown>): LeaveTier => ({
  id: r.id as string,
  minYears: Number(r.min_years ?? 0),
  days: Number(r.days ?? 0),
  label: (r.label as string) ?? '',
})
const tierToRow = (t: LeaveTier) => ({
  id: t.id,
  min_years: t.minYears,
  days: t.days,
  label: t.label,
})

const staffToRow = (s: Staff) => ({
  id: s.id,
  kindergarten_id: s.kindergarten_id ?? null,
  name: s.name,
  staff_number: s.staff_number ?? null,
  position_id: s.position_id ?? null,
  employment_type: s.employment_type ?? null,
  status: s.status ?? null,
  hire_date: s.hire_date || null,
  resignation_date: s.resignation_date || null,
  photo_url: s.photo_url ?? null,
})

const balanceToRow = (b: StaffLeaveBalance) => ({
  id: b.id,
  staff_id: b.staff_id,
  year: b.year,
  total_days: b.total_days,
  used_days: b.used_days,
  special_addition: b.special_addition ?? 0,
  special_deduction: b.special_deduction ?? 0,
})

const adjustmentToRow = (a: SpecialLeaveAdjustment) => ({
  id: a.id,
  staff_id: a.staff_id,
  year: a.year,
  adjustment_type: a.adjustment_type,
  days: a.days,
  reason: a.reason ?? null,
  created_at: a.created_at,
})

const subBalToRow = (b: SubstituteBalance) => ({
  id: b.id,
  staff_id: b.staff_id,
  year: b.year,
  total_days: b.total_days,
  is_custom: b.is_custom,
  used_days: b.used_days ?? 0,
})

const subUseToRow = (u: SubstituteUsage) => ({
  id: u.id,
  staff_id: u.staff_id,
  year: u.year,
  month: u.month,
  days_used: u.days_used,
  note: u.note ?? null,
})

const historyToRow = (h: LeaveHistory & { sub_name?: string; sub_phone?: string; sub_start?: string; sub_end?: string }) => ({
  id: h.id,
  staff_id: h.staff_id,
  year: h.year,
  leave_type: h.leave_type,
  start_date: h.start_date || null,
  end_date: h.end_date || null,
  days_used: h.days_used,
  reason: h.reason ?? null,
  sub_name: h.sub_name ?? null,
  sub_phone: h.sub_phone ?? null,
  sub_start: h.sub_start || null,
  sub_end: h.sub_end || null,
})

/** 전체 데이터 로드. 테이블 미존재/오류 시 throw → 호출부에서 폴백 */
export async function loadAll(): Promise<AppData> {
  const c = sb()
  const [positions, tiers, staff, balances, adjustments, history, subBal, subUse] =
    await Promise.all([
      c.from('positions').select('*'),
      c.from('leave_tiers').select('*'),
      c.from('staff').select('*'),
      c.from('leave_balances').select('*'),
      c.from('leave_adjustments').select('*'),
      c.from('leave_history').select('*'),
      c.from('substitute_balances').select('*'),
      c.from('substitute_usages').select('*'),
    ])
  const first = [positions, tiers, staff, balances, adjustments, history, subBal, subUse].find((r) => r.error)
  if (first?.error) throw first.error
  return {
    positions: (positions.data ?? []) as Position[],
    leaveTiers: (tiers.data ?? []).map(rowToTier),
    staff: (staff.data ?? []) as Staff[],
    balances: (balances.data ?? []) as StaffLeaveBalance[],
    adjustments: (adjustments.data ?? []) as SpecialLeaveAdjustment[],
    leaveHistory: (history.data ?? []) as LeaveHistory[],
    subBalances: (subBal.data ?? []) as SubstituteBalance[],
    subUsages: (subUse.data ?? []) as SubstituteUsage[],
  }
}

/** 최초 1회: Supabase가 비어 있으면 현재(mock) 상태를 일괄 업로드 */
export async function seedAll(data: AppData): Promise<void> {
  const c = sb()
  await Promise.all([
    c.from('positions').upsert(data.positions.map((p) => ({ id: p.id, kindergarten_id: p.kindergarten_id ?? null, name: p.name }))),
    c.from('leave_tiers').upsert(data.leaveTiers.map(tierToRow)),
    c.from('staff').upsert(data.staff.map(staffToRow)),
    c.from('leave_balances').upsert(data.balances.map(balanceToRow)),
    c.from('leave_adjustments').upsert(data.adjustments.map(adjustmentToRow)),
    c.from('leave_history').upsert(data.leaveHistory.map((h) => historyToRow(h))),
    c.from('substitute_balances').upsert(data.subBalances.map(subBalToRow)),
    c.from('substitute_usages').upsert(data.subUsages.map(subUseToRow)),
  ])
}

// ── 엔티티별 write-through (실패는 호출부에서 무시) ──
export const db = {
  upsertStaff: (s: Staff) => sb().from('staff').upsert(staffToRow(s)),
  deleteStaff: async (id: string) => {
    const c = sb()
    await Promise.all([
      c.from('leave_balances').delete().eq('staff_id', id),
      c.from('leave_adjustments').delete().eq('staff_id', id),
      c.from('leave_history').delete().eq('staff_id', id),
      c.from('substitute_balances').delete().eq('staff_id', id),
      c.from('substitute_usages').delete().eq('staff_id', id),
    ])
    return c.from('staff').delete().eq('id', id)
  },
  upsertBalance: (b: StaffLeaveBalance) => sb().from('leave_balances').upsert(balanceToRow(b)),
  upsertAdjustment: (a: SpecialLeaveAdjustment) => sb().from('leave_adjustments').upsert(adjustmentToRow(a)),
  upsertHistory: (h: LeaveHistory & { sub_name?: string; sub_phone?: string; sub_start?: string; sub_end?: string }) =>
    sb().from('leave_history').upsert(historyToRow(h)),
  upsertPosition: (p: Position) => sb().from('positions').upsert({ id: p.id, kindergarten_id: p.kindergarten_id ?? null, name: p.name }),
  upsertSubBalance: (b: SubstituteBalance) => sb().from('substitute_balances').upsert(subBalToRow(b)),
  replaceLeaveTiers: async (tiers: LeaveTier[]) => {
    const c = sb()
    await c.from('leave_tiers').delete().neq('id', '___none___')
    return c.from('leave_tiers').upsert(tiers.map(tierToRow))
  },
}
