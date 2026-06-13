'use client'

import { mockStaffLeaveBalance, mockStaff, mockLeaveHistory } from '@/lib/mock-data'
import { Card } from '@/components/ui/card'
import { LeaveCalendar } from '@/components/calendar/LeaveCalendar'
import { Clock } from 'lucide-react'

export default function DashboardPage() {
  // 직원별 정보 조합
  const staffWithBalance = mockStaff.map((staff) => {
    const balance = mockStaffLeaveBalance.find((b) => b.staff_id === staff.id)
    return { ...staff, balance }
  })

  // 최근등록 - 최근 순으로 정렬
  const recentRecords = [...mockLeaveHistory]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 3)

  const getLeaveTypeColor = (leaveType: string) => {
    const colorMap: Record<string, string> = {
      종일휴가: 'bg-primary-container text-primary',
      오전반차: 'bg-success-container text-success',
      오후반차: 'bg-warning-container text-warning',
      지각: 'bg-warning-container text-warning',
      병가: 'bg-error-container text-error',
      경조사: 'bg-primary-container text-primary',
      춤산휴가: 'bg-success-container text-success',
      돌봄휴가: 'bg-primary-container text-primary',
    }
    return colorMap[leaveType] || 'bg-surface-container text-on-surface-variant'
  }

  return (
    <div className="space-y-8">
      {/* 섹션 1: 최근등록 */}
      <Card>
        <div className="border-b border-border-subtle p-6">
          <h2 className="text-title-md font-semibold text-on-surface flex items-center gap-2">
            <Clock size={20} />
            최근등록
          </h2>
          <p className="mt-1 text-label-sm text-on-surface-variant">
            최근 등록된 휴가 {recentRecords.length}건
          </p>
        </div>
        <div className="p-6">
          {recentRecords.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-label-md text-on-surface-variant">
                등록된 휴가가 없습니다
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentRecords.map((leave) => {
                const staff = mockStaff.find((s) => s.id === leave.staff_id)

                return (
                  <div
                    key={leave.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 bg-primary-container rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-label-sm font-bold text-primary">
                          {staff?.name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-on-surface truncate">
                          {staff?.name}
                        </p>
                        <p className="text-label-sm text-on-surface-variant">
                          {leave.start_date} ~ {leave.end_date}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                      <span
                        className={`px-3 py-1 rounded-full text-label-sm font-medium ${getLeaveTypeColor(
                          leave.leave_type
                        )}`}
                      >
                        {leave.leave_type}
                      </span>
                      <span className="text-label-md font-semibold text-on-surface min-w-12 text-right">
                        {leave.days_used}일
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </Card>

      {/* 섹션 2: 월간 휴가 현황 */}
      <LeaveCalendar />

      {/* 섹션 3: 직원별 연차 현황 */}
      <Card>
        <div className="border-b border-border-subtle p-6">
          <h2 className="text-title-md font-semibold text-on-surface">
            직원별 연차 현황
          </h2>
          <p className="mt-1 text-label-sm text-on-surface-variant">
            2026년도 연차 현황
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-subtle bg-surface-container">
                <th className="px-6 py-4 text-left text-label-md font-semibold text-on-surface">
                  직원명
                </th>
                <th className="px-6 py-4 text-left text-label-md font-semibold text-on-surface">
                  직급
                </th>
                <th className="px-6 py-4 text-center text-label-md font-semibold text-on-surface">
                  발생
                </th>
                <th className="px-6 py-4 text-center text-label-md font-semibold text-on-surface">
                  사용
                </th>
                <th className="px-6 py-4 text-center text-label-md font-semibold text-on-surface">
                  남은연차
                </th>
              </tr>
            </thead>
            <tbody>
              {staffWithBalance.map((staff) => (
                <tr
                  key={staff.id}
                  className="border-b border-border-subtle hover:bg-surface-container transition-colors"
                >
                  <td className="px-6 py-4 text-label-md text-on-surface font-medium">
                    {staff.name}
                  </td>
                  <td className="px-6 py-4 text-label-md text-on-surface-variant">
                    {staff.id === 'staff-001'
                      ? '원장'
                      : staff.id === 'staff-002'
                        ? '교사'
                        : staff.id === 'staff-003'
                          ? '교사'
                          : '교사'}
                  </td>
                  <td className="px-6 py-4 text-center text-label-md text-on-surface font-medium">
                    {staff.balance?.total_days}
                  </td>
                  <td className="px-6 py-4 text-center text-label-md text-on-surface font-medium">
                    {staff.balance?.used_days}
                  </td>
                  <td className="px-6 py-4 text-center text-label-md text-primary font-semibold">
                    {staff.balance?.remaining_days}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
