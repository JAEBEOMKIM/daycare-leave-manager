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

// ── 현재 테넌트(어린이집) — 모든 read 필터 / write 스탬프에 사용 ──
let _tenant: string | null = null
export function setDbTenant(tenantId: string | null) {
  _tenant = tenantId
}
function tid(): string {
  if (!_tenant) throw new Error('테넌트가 설정되지 않았습니다 (setDbTenant 필요)')
  return _tenant
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

// ── 매퍼 (모든 row 에 kindergarten_id 스탬프 — RLS with check 통과 필수) ──
const rowToTier = (r: Record<string, unknown>): LeaveTier => ({
  id: r.id as string,
  minYears: Number(r.min_years ?? 0),
  days: Number(r.days ?? 0),
  label: (r.label as string) ?? '',
})
const tierToRow = (t: LeaveTier) => ({
  id: t.id,
  kindergarten_id: tid(),
  min_years: t.minYears,
  days: t.days,
  label: t.label,
})

const staffToRow = (s: Staff) => ({
  id: s.id,
  kindergarten_id: s.kindergarten_id || tid(),
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
  kindergarten_id: tid(),
  staff_id: b.staff_id,
  year: b.year,
  total_days: b.total_days,
  used_days: b.used_days,
  special_addition: b.special_addition ?? 0,
  special_deduction: b.special_deduction ?? 0,
})

const adjustmentToRow = (a: SpecialLeaveAdjustment) => ({
  id: a.id,
  kindergarten_id: tid(),
  staff_id: a.staff_id,
  year: a.year,
  adjustment_type: a.adjustment_type,
  days: a.days,
  reason: a.reason ?? null,
  created_at: a.created_at,
})

const subBalToRow = (b: SubstituteBalance) => ({
  id: b.id,
  kindergarten_id: tid(),
  staff_id: b.staff_id,
  year: b.year,
  total_days: b.total_days,
  is_custom: b.is_custom,
  enabled: b.enabled ?? true,
  used_days: b.used_days ?? 0,
})

const subUseToRow = (u: SubstituteUsage) => ({
  id: u.id,
  kindergarten_id: tid(),
  staff_id: u.staff_id,
  year: u.year,
  month: u.month,
  days_used: u.days_used,
  note: u.note ?? null,
})

const historyToRow = (h: LeaveHistory & { sub_name?: string; sub_phone?: string; sub_start?: string; sub_end?: string }) => ({
  id: h.id,
  kindergarten_id: tid(),
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

const positionToRow = (p: Position) => ({
  id: p.id,
  kindergarten_id: p.kindergarten_id || tid(),
  name: p.name,
})

/** 특정 테넌트의 전체 데이터 로드. 오류 시 throw → 호출부 처리. */
export async function loadAll(tenantId: string): Promise<AppData> {
  setDbTenant(tenantId)
  const c = sb()
  const K = 'kindergarten_id'
  const [positions, tiers, staff, balances, adjustments, history, subBal, subUse] =
    await Promise.all([
      c.from('positions').select('*').eq(K, tenantId),
      c.from('leave_tiers').select('*').eq(K, tenantId),
      c.from('staff').select('*').eq(K, tenantId),
      c.from('leave_balances').select('*').eq(K, tenantId),
      c.from('leave_adjustments').select('*').eq(K, tenantId),
      c.from('leave_history').select('*').eq(K, tenantId),
      c.from('substitute_balances').select('*').eq(K, tenantId),
      c.from('substitute_usages').select('*').eq(K, tenantId),
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

/** 신규 테넌트 기본 시드(직급 + 기본 연차기준표). mock 일괄 업로드는 더 이상 사용하지 않음. */
export async function seedTenantDefaults(
  tenantId: string,
  positions: Position[],
  leaveTiers: LeaveTier[]
): Promise<void> {
  setDbTenant(tenantId)
  const c = sb()
  await Promise.all([
    c.from('positions').upsert(positions.map(positionToRow)),
    c.from('leave_tiers').upsert(leaveTiers.map(tierToRow)),
  ])
}

// ── 엔티티별 write-through (실패는 호출부에서 무시). 모든 쓰기는 현재 테넌트로 스탬프됨. ──
export const db = {
  upsertStaff: (s: Staff) => sb().from('staff').upsert(staffToRow(s)),
  deleteStaff: async (id: string) => {
    const c = sb()
    const t = tid()
    await Promise.all([
      c.from('leave_balances').delete().eq('kindergarten_id', t).eq('staff_id', id),
      c.from('leave_adjustments').delete().eq('kindergarten_id', t).eq('staff_id', id),
      c.from('leave_history').delete().eq('kindergarten_id', t).eq('staff_id', id),
      c.from('substitute_balances').delete().eq('kindergarten_id', t).eq('staff_id', id),
      c.from('substitute_usages').delete().eq('kindergarten_id', t).eq('staff_id', id),
    ])
    return c.from('staff').delete().eq('kindergarten_id', t).eq('id', id)
  },
  upsertBalance: (b: StaffLeaveBalance) => sb().from('leave_balances').upsert(balanceToRow(b)),
  upsertAdjustment: (a: SpecialLeaveAdjustment) => sb().from('leave_adjustments').upsert(adjustmentToRow(a)),
  upsertHistory: (h: LeaveHistory & { sub_name?: string; sub_phone?: string; sub_start?: string; sub_end?: string }) =>
    sb().from('leave_history').upsert(historyToRow(h)),
  deleteHistory: (id: string) => sb().from('leave_history').delete().eq('kindergarten_id', tid()).eq('id', id),
  upsertPosition: (p: Position) => sb().from('positions').upsert(positionToRow(p)),
  deletePosition: (id: string) => sb().from('positions').delete().eq('kindergarten_id', tid()).eq('id', id),
  upsertSubBalance: (b: SubstituteBalance) => sb().from('substitute_balances').upsert(subBalToRow(b)),
  // ── 앱 설정(테넌트별 key-value, jsonb). 테이블 미존재 시 조용히 무시 ──
  saveSetting: (key: string, value: unknown) =>
    sb().from('app_settings').upsert({ kindergarten_id: tid(), key, value }),
  loadSettings: async (tenantId: string): Promise<Record<string, unknown>> => {
    try {
      const { data, error } = await sb()
        .from('app_settings')
        .select('key,value')
        .eq('kindergarten_id', tenantId)
      if (error || !data) return {}
      const m: Record<string, unknown> = {}
      for (const r of data as Array<{ key: string; value: unknown }>) m[r.key] = r.value
      return m
    } catch {
      return {}
    }
  },
  replaceLeaveTiers: async (tiers: LeaveTier[]) => {
    const c = sb()
    const t = tid()
    await c.from('leave_tiers').delete().eq('kindergarten_id', t)
    return c.from('leave_tiers').upsert(tiers.map(tierToRow))
  },
}
