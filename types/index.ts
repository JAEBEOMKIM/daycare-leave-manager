// 어린이집
export interface Kindergarten {
  id: string
  name: string
  principal_id?: string
  business_number?: string
  location?: string
  phone?: string
  created_at: string
  updated_at: string
}

// 직급
export interface Position {
  id: string
  kindergarten_id: string
  name: string
  created_at: string
  updated_at: string
}

// 직원
export interface Staff {
  id: string
  kindergarten_id: string
  name: string
  staff_number?: string
  position_id?: string
  salary?: number
  employment_type?: string // 정규직, 계약직
  status: string // 재직, 휴직, 퇴사
  hire_date: string
  resignation_date?: string
  leave_date?: string
  photo_url?: string
  notes?: string
  created_at: string
  updated_at: string
  position?: Position
}

// 연차기준
export interface LeaveStandard {
  id: string
  kindergarten_id: string
  position_id?: string
  years_of_service?: number
  base_days: number
  fiscal_year_basis: number // 1=1월, 3=3월
  created_at: string
  updated_at: string
}

// 연차 기준 티어 (입사일=근속년수 기준 총연차 산정표)
export interface LeaveTier {
  id: string
  minYears: number // 이 근속년수 이상부터 적용
  days: number // 부여 연차 일수
  label: string
}

// 직원별 연차
export interface StaffLeaveBalance {
  id: string
  staff_id: string
  year: number
  total_days: number
  used_days: number
  special_addition: number
  special_deduction: number
  created_at: string
  updated_at: string
  remaining_days?: number // 계산되는 값
}

// 연차사용이력
export type LeaveType =
  | '종일휴가'
  | '오전반차'
  | '오후반차'
  | '지각'
  | '병가'
  | '경조사'
  | '춤산휴가'
  | '돌봄휴가'

export interface LeaveHistory {
  id: string
  staff_id: string
  year: number
  leave_type: LeaveType
  start_date: string
  end_date: string
  days_used: number
  reason?: string
  // 대체교사 신청 정보 (연차와 함께 등록)
  sub_name?: string
  sub_phone?: string
  sub_start?: string
  sub_end?: string
  created_by?: string
  created_at: string
  updated_at: string
}

// 특별연차 조정이력
export type AdjustmentType = '추가' | '감소'

export interface SpecialLeaveAdjustment {
  id: string
  staff_id: string
  year: number
  adjustment_type: AdjustmentType
  days: number
  reason?: string
  created_by?: string
  created_at: string
}

// 대체교사 지원일 - 전체 기준
export interface SubstituteStandard {
  id: string
  kindergarten_id: string
  year: number
  default_days: number // 연간 기본 지원일수 (모든 교사 공통)
  created_at: string
  updated_at: string
}

// 대체교사 지원일 - 직원별 연간 잔액
export interface SubstituteBalance {
  id: string
  staff_id: string
  year: number
  total_days: number // 해당 직원의 연간 지원일 (기본값 또는 개인별 변경값)
  is_custom: boolean // 개인별로 기준일을 변경했는지 여부
  enabled?: boolean // 이 직원이 대체교사 지원을 사용할 수 있는지 (직원별 토글, 기본 true)
  created_at: string
  updated_at: string
  used_days?: number // 계산값 (월별 사용 합계)
  remaining_days?: number // 계산값
}

// 대체교사 배치 - 날짜별 (누구의 대체인지)
export interface SubstituteDeployment {
  id: string
  covered_staff_id: string // 대체 대상(휴가 간) 교사
  date: string // YYYY-MM-DD
  substitute_name: string // 대체교사 이름
  note?: string
}

// 대체교사 지원일 - 월별 사용(신청) 내역
export interface SubstituteUsage {
  id: string
  staff_id: string
  year: number
  month: number // 1~12
  days_used: number
  note?: string
  created_at: string
}

// API 응답 타입
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

// 통계 데이터
export interface LeaveStatistics {
  total_staff: number
  total_leave_usage: number
  total_leave_days: number
  usage_rate: number
  by_type: Record<LeaveType, number>
  by_staff: StaffLeaveStats[]
  by_month: MonthlyLeaveStats[]
}

export interface StaffLeaveStats {
  staff_id: string
  staff_name: string
  total_days: number
  used_days: number
  remaining_days: number
}

export interface MonthlyLeaveStats {
  month: number
  total_usage: number
  by_type: Record<LeaveType, number>
}

// UI 컴포넌트 Props
export interface DashboardData {
  thisWeekLeaves: LeaveHistory[]
  thisMonthSummary: MonthlyLeaveStats
  staffLeaveBalance: StaffLeaveBalance[]
}
