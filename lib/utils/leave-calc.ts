/**
 * 근속 개월 수를 기준으로 기본 연차 일수 계산
 */
export function calcBaseDays(
  monthsOfService: number,
  standards: Array<{
    months_service_from: number
    months_service_to: number | null
    annual_days: number
  }>
): number {
  const match = standards.find(
    (s) =>
      monthsOfService >= s.months_service_from &&
      (s.months_service_to === null || monthsOfService < s.months_service_to)
  )

  return match ? match.annual_days : 11 // 기본 11일
}

/**
 * 잔여 연차 계산
 */
export function calcRemaining(row: {
  base_days: number
  additional_days: number
  used_days: number
  deducted_days: number
}): number {
  return row.base_days + row.additional_days - row.used_days - row.deducted_days
}

/**
 * 연차 소진 일수 계산 (타입별)
 */
export function calcDaysConsumed(
  leaveType: string,
  isDayOff: boolean = true
): number {
  switch (leaveType) {
    case '오전반차':
    case '오후반차':
      return 0.5
    case '연차':
    case '병가':
    case '경조사':
    case '출산휴가':
    case '돌봄휴가':
      return isDayOff ? 1.0 : 0
    case '지각':
      return 0
    default:
      return 1.0
  }
}

/**
 * 연차 타입 한글명
 */
export function getLeaveTypeName(type: string): string {
  const names: Record<string, string> = {
    annual: '연차',
    morning_half: '오전반차',
    afternoon_half: '오후반차',
    sick: '병가',
    family: '경조사',
    maternity: '출산휴가',
    childcare: '돌봄휴가',
    late: '지각',
    unpaid: '무급휴가',
  }

  return names[type] || type
}

/**
 * 연차 타입 색상
 */
export function getLeaveTypeColor(type: string): string {
  const colors: Record<string, string> = {
    annual: 'bg-primary/20 text-primary',
    morning_half: 'bg-data-teal/20 text-data-teal',
    afternoon_half: 'bg-data-purple/20 text-data-purple',
    sick: 'bg-error-red/20 text-error-red',
    family: 'bg-secondary-container/20 text-secondary',
    maternity: 'bg-primary-container/20 text-primary-container',
    childcare: 'bg-data-teal/20 text-data-teal',
    late: 'bg-outline/20 text-outline',
  }

  return colors[type] || 'bg-on-surface-variant/20 text-on-surface-variant'
}
