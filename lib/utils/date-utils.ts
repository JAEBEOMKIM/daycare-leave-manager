/**
 * 주차 계산 (ISO 8601)
 */
export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

/**
 * 해당 주의 월요일-금요일 반환
 */
export function getWeekDays(date: Date): { start: Date; end: Date; dates: Date[] } {
  const d = new Date(date)
  const dayNum = d.getDay()
  const diff = d.getDate() - dayNum + (dayNum === 0 ? -6 : 1) // 월요일로 조정

  const start = new Date(d.setDate(diff))
  const dates: Date[] = []

  for (let i = 0; i < 7; i++) {
    const date = new Date(start)
    date.setDate(date.getDate() + i)
    dates.push(date)
  }

  const end = new Date(start)
  end.setDate(end.getDate() + 6)

  return { start, end, dates }
}

/**
 * 해당 월의 모든 날짜 반환 (주 단위로 그룹화)
 */
export function getMonthWeeks(date: Date): Date[][] {
  const year = date.getFullYear()
  const month = date.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - firstDay.getDay())

  const weeks: Date[][] = []
  let currentWeek: Date[] = []
  let currentDate = new Date(startDate)

  while (currentDate <= lastDay) {
    currentWeek.push(new Date(currentDate))
    currentDate.setDate(currentDate.getDate() + 1)

    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  }

  if (currentWeek.length > 0) {
    weeks.push(currentWeek)
  }

  return weeks
}

/**
 * 근속 개월 수 계산
 */
export function getMonthsOfService(hireDate: Date, referenceDate: Date = new Date()): number {
  const months =
    (referenceDate.getFullYear() - hireDate.getFullYear()) * 12 +
    (referenceDate.getMonth() - hireDate.getMonth())

  return Math.max(0, months)
}

/**
 * 연차 기준 연도 계산 (회계연도/학년연도)
 */
export function getLeaveYear(
  date: Date,
  basisType: 'fiscal' | 'school',
  startMonth: number = 1
): number {
  const month = date.getMonth() + 1
  const year = date.getFullYear()

  if (month < startMonth) {
    return year - 1
  }

  return year
}

/**
 * 날짜 포맷팅 (YYYY-MM-DD)
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * 두 날짜 사이의 일수 계산 (포함)
 */
export function getDaysBetween(startDate: Date, endDate: Date): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)

  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays + 1 // 양쪽 포함
}

/**
 * 한글 요일 반환
 */
export function getKoreanDayName(date: Date): string {
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return days[date.getDay()]
}

/**
 * 한글 월 반환 (1월, 2월, ...)
 */
export function getKoreanMonth(date: Date): string {
  return `${date.getMonth() + 1}월`
}

/**
 * 오늘 여부
 */
export function isToday(date: Date): boolean {
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}
