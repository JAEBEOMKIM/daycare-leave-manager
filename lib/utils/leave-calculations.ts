import { StaffLeaveBalance, LeaveType } from '@/types'

/**
 * 연차 유형별 일수 계산
 */
export function calculateDaysForLeaveType(
  leaveType: LeaveType,
  startDate: Date,
  endDate: Date
): number {
  const dayCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

  switch (leaveType) {
    case '종일휴가':
      return dayCount
    case '오전반차':
    case '오후반차':
      return dayCount * 0.5
    case '지각':
    case '병가':
    case '경조사':
    case '춤산휴가':
    case '돌봄휴가':
      return dayCount
    default:
      return dayCount
  }
}

/**
 * 남은 연차 계산
 */
export function calculateRemainingDays(balance: StaffLeaveBalance): number {
  return balance.total_days - balance.used_days - balance.special_deduction + balance.special_addition
}

/**
 * 근속년수 계산
 */
export function calculateYearsOfService(hireDate: Date, referenceDate: Date = new Date()): number {
  const years =
    (referenceDate.getFullYear() - hireDate.getFullYear()) * 12 +
    (referenceDate.getMonth() - hireDate.getMonth())

  return Math.floor(years / 12)
}

/**
 * 회계연도 기준 연차 시작 월 계산
 */
export function getFiscalYearStart(year: number, fiscalBasis: number): Date {
  return new Date(year, fiscalBasis - 1, 1) // 1=1월, 3=3월
}

/**
 * 현재 회계연도 계산
 */
export function getCurrentFiscalYear(fiscalBasis: number = 1): number {
  const today = new Date()
  const currentMonth = today.getMonth() + 1

  if (currentMonth < fiscalBasis) {
    return today.getFullYear() - 1
  }
  return today.getFullYear()
}

/**
 * 기간 내 근무일 계산 (주말 제외)
 */
export function calculateWorkingDays(startDate: Date, endDate: Date): number {
  let count = 0
  const current = new Date(startDate)

  while (current <= endDate) {
    const dayOfWeek = current.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      // 일요일(0), 토요일(6) 제외
      count++
    }
    current.setDate(current.getDate() + 1)
  }

  return count
}

/**
 * 연차 사용률 계산
 */
export function calculateLeaveUsageRate(balance: StaffLeaveBalance): number {
  if (balance.total_days === 0) return 0
  return (balance.used_days / balance.total_days) * 100
}

/**
 * 연차 소진 여부 확인
 */
export function isLeaveExhausted(balance: StaffLeaveBalance): boolean {
  return calculateRemainingDays(balance) <= 0
}

/**
 * 연차 부족 여부 확인
 */
export function isLeaveInsufficient(balance: StaffLeaveBalance, requestedDays: number): boolean {
  return calculateRemainingDays(balance) < requestedDays
}

/**
 * 휴가 유형별 설명
 */
export function getLeaveTypeLabel(leaveType: LeaveType): string {
  const labels: Record<LeaveType, string> = {
    '종일휴가': '종일 휴가',
    '오전반차': '오전 반차',
    '오후반차': '오후 반차',
    '지각': '지각',
    '병가': '병가',
    '경조사': '경조사',
    '춤산휴가': '춤산휴가',
    '돌봄휴가': '돌봄휴가',
  }
  return labels[leaveType] || leaveType
}

/**
 * 연차 소진 일수 포맷팅
 */
export function formatLeaveDays(days: number): string {
  if (days === 0) return '없음'
  if (days < 1) {
    const halfDays = Math.round(days * 2)
    return `${halfDays > 1 ? halfDays + '개 반차' : '반차'}`
  }
  if (days === Math.floor(days)) {
    return `${Math.floor(days)}일`
  }
  return `${Math.floor(days)}일 ${days % 1 > 0 ? '반차' : ''}`
}

/**
 * 날짜 범위 내 연차 계산
 */
export function calculateLeaveDaysInRange(
  startDate: Date,
  endDate: Date,
  leaveType: LeaveType = '종일휴가'
): number {
  const days = calculateDaysForLeaveType(leaveType, startDate, endDate)
  return days
}
