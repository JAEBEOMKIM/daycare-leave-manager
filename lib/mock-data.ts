import {
  Kindergarten,
  Staff,
  Position,
  StaffLeaveBalance,
  LeaveHistory,
  SubstituteStandard,
  SubstituteBalance,
  SubstituteUsage,
  SubstituteDeployment,
} from '@/types'

// 어린이집
export const mockKindergarten: Kindergarten = {
  id: 'kg-001',
  name: '어린이집',
  principal_id: 'staff-001',
  business_number: '123-45-67890',
  location: '서울시 강남구',
  phone: '02-1234-5678',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

// 직급
export const mockPositions: Position[] = [
  {
    id: 'pos-001',
    kindergarten_id: 'kg-001',
    name: '원장',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'pos-002',
    kindergarten_id: 'kg-001',
    name: '부원장',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'pos-003',
    kindergarten_id: 'kg-001',
    name: '교사',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
]

// 직원
export const mockStaff: Staff[] = [
  {
    id: 'staff-001',
    kindergarten_id: 'kg-001',
    name: '박수현',
    staff_number: '001',
    position_id: 'pos-001',
    salary: 5000000,
    employment_type: '정규직',
    status: '재직',
    hire_date: '2020-01-15',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'staff-002',
    kindergarten_id: 'kg-001',
    name: '김지은',
    staff_number: '002',
    position_id: 'pos-003',
    salary: 3000000,
    employment_type: '정규직',
    status: '재직',
    hire_date: '2022-03-15',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'staff-003',
    kindergarten_id: 'kg-001',
    name: '이미영',
    staff_number: '003',
    position_id: 'pos-003',
    salary: 3000000,
    employment_type: '정규직',
    status: '재직',
    hire_date: '2021-09-01',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'staff-004',
    kindergarten_id: 'kg-001',
    name: '최정희',
    staff_number: '004',
    position_id: 'pos-003',
    salary: 2800000,
    employment_type: '계약직',
    status: '재직',
    hire_date: '2023-06-01',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
]

// 직원별 연차
export const mockStaffLeaveBalance: StaffLeaveBalance[] = [
  {
    id: 'balance-001',
    staff_id: 'staff-001',
    year: 2026,
    total_days: 15,
    used_days: 5,
    special_addition: 0,
    special_deduction: 0,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    remaining_days: 10,
  },
  {
    id: 'balance-002',
    staff_id: 'staff-002',
    year: 2026,
    total_days: 11,
    used_days: 8,
    special_addition: 0,
    special_deduction: 0,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    remaining_days: 3,
  },
  {
    id: 'balance-003',
    staff_id: 'staff-003',
    year: 2026,
    total_days: 11,
    used_days: 4,
    special_addition: 0,
    special_deduction: 0,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    remaining_days: 7,
  },
  {
    id: 'balance-004',
    staff_id: 'staff-004',
    year: 2026,
    total_days: 10,
    used_days: 2,
    special_addition: 0,
    special_deduction: 0,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    remaining_days: 8,
  },
]

// 연차 사용 이력
export const mockLeaveHistory: LeaveHistory[] = [
  {
    id: 'history-001',
    staff_id: 'staff-002',
    year: 2026,
    leave_type: '종일휴가',
    start_date: '2026-06-01',
    end_date: '2026-06-02',
    days_used: 2,
    reason: '개인사유',
    sub_name: '박지원',
    sub_phone: '010-1111-2222',
    sub_start: '2026-06-01',
    sub_end: '2026-06-02',
    created_by: 'staff-001',
    created_at: '2026-05-20T00:00:00Z',
    updated_at: '2026-05-20T00:00:00Z',
  },
  {
    id: 'history-002',
    staff_id: 'staff-002',
    year: 2026,
    leave_type: '오전반차',
    start_date: '2026-06-08',
    end_date: '2026-06-08',
    days_used: 0.5,
    reason: '병원',
    created_by: 'staff-001',
    created_at: '2026-05-25T00:00:00Z',
    updated_at: '2026-05-25T00:00:00Z',
  },
  {
    id: 'history-003',
    staff_id: 'staff-002',
    year: 2026,
    leave_type: '종일휴가',
    start_date: '2026-06-10',
    end_date: '2026-06-12',
    days_used: 3,
    reason: '개인사유',
    sub_name: '박지원',
    sub_phone: '010-1111-2222',
    sub_start: '2026-06-10',
    sub_end: '2026-06-12',
    created_by: 'staff-001',
    created_at: '2026-05-28T00:00:00Z',
    updated_at: '2026-05-28T00:00:00Z',
  },
  {
    id: 'history-004',
    staff_id: 'staff-002',
    year: 2026,
    leave_type: '병가',
    start_date: '2026-06-15',
    end_date: '2026-06-15',
    days_used: 1,
    reason: '감기',
    created_by: 'staff-002',
    created_at: '2026-06-15T00:00:00Z',
    updated_at: '2026-06-15T00:00:00Z',
  },
  {
    id: 'history-005',
    staff_id: 'staff-003',
    year: 2026,
    leave_type: '종일휴가',
    start_date: '2026-06-05',
    end_date: '2026-06-07',
    days_used: 3,
    reason: '개인사유',
    sub_name: '최은영',
    sub_phone: '010-3333-4444',
    sub_start: '2026-06-05',
    sub_end: '2026-06-07',
    created_by: 'staff-001',
    created_at: '2026-05-22T00:00:00Z',
    updated_at: '2026-05-22T00:00:00Z',
  },
  {
    id: 'history-006',
    staff_id: 'staff-003',
    year: 2026,
    leave_type: '오후반차',
    start_date: '2026-06-11',
    end_date: '2026-06-11',
    days_used: 0.5,
    reason: '개인사유',
    created_by: 'staff-001',
    created_at: '2026-05-30T00:00:00Z',
    updated_at: '2026-05-30T00:00:00Z',
  },
]

// ===== 대체교사 지원일 =====

// 전체 기준 (모든 교사 공통 기본 지원일)
export const mockSubstituteStandard: SubstituteStandard = {
  id: 'sub-std-2026',
  kindergarten_id: 'kg-001',
  year: 2026,
  default_days: 15, // 연간 기본 15일
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

// 직원별 연간 지원일 잔액 (기본값 또는 개인별 변경값)
export const mockSubstituteBalance: SubstituteBalance[] = [
  {
    id: 'sub-bal-001',
    staff_id: 'staff-001',
    year: 2026,
    total_days: 15,
    is_custom: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'sub-bal-002',
    staff_id: 'staff-002',
    year: 2026,
    total_days: 15,
    is_custom: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'sub-bal-003',
    staff_id: 'staff-003',
    year: 2026,
    total_days: 20, // 개인별 변경 예시
    is_custom: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-02-10T00:00:00Z',
  },
  {
    id: 'sub-bal-004',
    staff_id: 'staff-004',
    year: 2026,
    total_days: 15,
    is_custom: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
]

// 월별 대체교사 지원일 사용(신청) 내역
export const mockSubstituteUsage: SubstituteUsage[] = [
  { id: 'sub-use-001', staff_id: 'staff-002', year: 2026, month: 3, days_used: 2, note: '연차 사용', created_at: '2026-03-05T00:00:00Z' },
  { id: 'sub-use-002', staff_id: 'staff-002', year: 2026, month: 5, days_used: 3, note: '연차 사용', created_at: '2026-05-12T00:00:00Z' },
  { id: 'sub-use-003', staff_id: 'staff-003', year: 2026, month: 4, days_used: 1, note: '병가', created_at: '2026-04-08T00:00:00Z' },
  { id: 'sub-use-004', staff_id: 'staff-003', year: 2026, month: 6, days_used: 3, note: '연차 사용', created_at: '2026-06-05T00:00:00Z' },
  { id: 'sub-use-005', staff_id: 'staff-004', year: 2026, month: 2, days_used: 2, note: '연차 사용', created_at: '2026-02-20T00:00:00Z' },
]

// 날짜별 대체교사 배치 (휴가 일정에 맞춰 대체교사가 투입된 날)
export const mockSubstituteDeployment: SubstituteDeployment[] = [
  { id: 'sub-dep-001', covered_staff_id: 'staff-002', date: '2026-06-01', substitute_name: '박지원' },
  { id: 'sub-dep-002', covered_staff_id: 'staff-002', date: '2026-06-02', substitute_name: '박지원' },
  { id: 'sub-dep-003', covered_staff_id: 'staff-003', date: '2026-06-05', substitute_name: '최은영' },
  { id: 'sub-dep-004', covered_staff_id: 'staff-002', date: '2026-06-10', substitute_name: '박지원' },
  { id: 'sub-dep-005', covered_staff_id: 'staff-002', date: '2026-06-11', substitute_name: '박지원' },
  { id: 'sub-dep-006', covered_staff_id: 'staff-002', date: '2026-06-12', substitute_name: '박지원' },
]

// 직원별 대체교사 지원일 사용 합계 계산 헬퍼
export function getSubstituteUsedDays(staffId: string, year: number): number {
  return mockSubstituteUsage
    .filter((u) => u.staff_id === staffId && u.year === year)
    .reduce((sum, u) => sum + u.days_used, 0)
}

// 현재 로그인한 사용자 (임시)
export const mockCurrentUser = mockStaff[0] // 박수현 (원장)
