// 연차/대체교사 기간 기준 및 일수 계산 (순수 함수, 타임존 안전)
//  - 연차(annual leave): 학년연도 (3월 1일 ~ 익년 2월 말)
//  - 대체교사(substitute): 회계연도 (1월 1일 ~ 12월 31일)
//  - 연차 일수 계산 시 토·일·공휴일은 차감하지 않음

function parts(iso: string): { y: number; m: number; d: number } {
  const [y, m, d] = iso.split('-').map(Number)
  return { y, m, d }
}

function toIso(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`
}

/** 토(6)·일(0) 여부 — 로컬 생성으로 타임존 파싱 오차 방지 */
export function isWeekendIso(iso: string): boolean {
  if (!iso) return false
  const { y, m, d } = parts(iso)
  const w = new Date(y, m - 1, d).getDay()
  return w === 0 || w === 6
}

/** start~end(포함) 사이의 날짜를 YYYY-MM-DD로 순회 */
export function* eachIso(start: string, end: string): Generator<string> {
  if (!start || !end) return
  const s = parts(start)
  const e = parts(end)
  const cur = new Date(s.y, s.m - 1, s.d)
  const last = new Date(e.y, e.m - 1, e.d)
  while (cur <= last) {
    yield toIso(cur)
    cur.setDate(cur.getDate() + 1)
  }
}

/**
 * 연차 차감 일수 계산.
 *  - 오전/오후 반차: 0.5일
 *  - 그 외: start~end(포함) 중 토·일·공휴일을 제외한 근무일 수
 */
export function countLeaveDays(
  start: string,
  end: string,
  type: string,
  holidayMap: Record<string, string> = {}
): number {
  if (type === '오전반차' || type === '오후반차') return 0.5
  if (!start || !end || end < start) return 0
  let n = 0
  for (const iso of eachIso(start, end)) {
    if (isWeekendIso(iso)) continue
    if (holidayMap[iso]) continue
    n += 1
  }
  return n
}

/** start~end(포함) 달력일 수 (대체교사 지원 기간 등, 주말 제외 안 함) */
export function countDaysInclusive(start: string, end: string): number {
  if (!start || !end || end < start) return 0
  let n = 0
  for (const _ of eachIso(start, end)) n += 1
  return n
}

// ── 학년연도 (3월 시작) ──
/** 해당 일자가 속한 학년연도(=3월이 시작되는 해) */
export function academicYearOf(iso: string): number {
  const { y, m } = parts(iso)
  return m >= 3 ? y : y - 1
}

export interface PeriodRange {
  start: string
  end: string
  label: string
}

export function academicRange(ay: number): PeriodRange {
  return {
    start: `${ay}-03-01`,
    // 2월 말일이 28/29 어느 쪽이든 문자열 비교상 안전한 상한
    end: `${ay + 1}-02-29`,
    label: `${ay}학년도 (${ay}.03 ~ ${ay + 1}.02)`,
  }
}

// ── 회계연도 (1월 시작 = 달력연도) ──
export function fiscalYearOf(iso: string): number {
  return Number(iso.slice(0, 4))
}

export function fiscalRange(fy: number): PeriodRange {
  return {
    start: `${fy}-01-01`,
    end: `${fy}-12-31`,
    label: `${fy}년 (${fy}.01 ~ ${fy}.12)`,
  }
}
