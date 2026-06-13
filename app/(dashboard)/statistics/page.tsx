'use client'

import { mockStaffLeaveBalance, mockStaff, mockLeaveHistory } from '@/lib/mock-data'
import { Card } from '@/components/ui/card'
import { OrganizationChart } from '@/components/charts/OrganizationChart'
import { StaffComparisonChart } from '@/components/charts/StaffComparisonChart'
import { LeaveTypeChart } from '@/components/charts/LeaveTypeChart'
import { MonthlyChart } from '@/components/charts/MonthlyChart'
import { BarChart3, PieChart as PieChartIcon } from 'lucide-react'

export default function StatisticsPage() {
  const totalStats = mockStaffLeaveBalance.reduce(
    (acc, balance) => ({
      total: acc.total + balance.total_days,
      used: acc.used + balance.used_days,
      remaining: acc.remaining + (balance.remaining_days ?? balance.total_days - balance.used_days),
    }),
    { total: 0, used: 0, remaining: 0 }
  )

  const usageRate = ((totalStats.used / totalStats.total) * 100).toFixed(1)

  return (
    <div className="space-y-8">
      {/* 섹션 1: 원 전체 통계 */}
      <Card>
        <div className="border-b border-border-subtle p-6">
          <h2 className="text-title-md font-semibold text-on-surface">
            원 전체 연차 현황
          </h2>
        </div>
        <div className="grid gap-6 p-6 sm:grid-cols-2">
          <div>
            <div className="grid gap-3 mb-6">
              <div className="rounded-lg bg-surface-container p-4">
                <p className="text-label-sm text-on-surface-variant">
                  총 발생 연차
                </p>
                <p className="mt-2 text-heading-sm font-semibold text-primary">
                  {totalStats.total.toFixed(1)}일
                </p>
              </div>
              <div className="rounded-lg bg-surface-container p-4">
                <p className="text-label-sm text-on-surface-variant">
                  총 사용 연차
                </p>
                <p className="mt-2 text-heading-sm font-semibold text-success">
                  {totalStats.used.toFixed(1)}일
                </p>
              </div>
              <div className="rounded-lg bg-surface-container p-4">
                <p className="text-label-sm text-on-surface-variant">
                  총 남은 연차
                </p>
                <p className="mt-2 text-heading-sm font-semibold text-warning">
                  {totalStats.remaining.toFixed(1)}일
                </p>
              </div>
              <div className="rounded-lg bg-surface-container p-4">
                <p className="text-label-sm text-on-surface-variant">사용률</p>
                <p className="mt-2 text-heading-sm font-semibold text-primary">
                  {usageRate}%
                </p>
              </div>
            </div>
          </div>
          <div>
            <OrganizationChart />
          </div>
        </div>
      </Card>

      {/* 섹션 2: 직원별 비교 */}
      <Card>
        <div className="border-b border-border-subtle p-6">
          <h2 className="text-title-md font-semibold text-on-surface flex items-center gap-2">
            <BarChart3 size={20} />
            직원별 연차 사용 현황
          </h2>
        </div>
        <div className="p-6">
          <StaffComparisonChart />
        </div>
      </Card>

      {/* 섹션 3: 월별 사용량 */}
      <Card>
        <div className="border-b border-border-subtle p-6">
          <h2 className="text-title-md font-semibold text-on-surface">
            월별 연차 사용량 (2026년)
          </h2>
        </div>
        <div className="p-6">
          <MonthlyChart />
        </div>
      </Card>

      {/* 섹션 4: 연차 유형별 */}
      <Card>
        <div className="border-b border-border-subtle p-6">
          <h2 className="text-title-md font-semibold text-on-surface flex items-center gap-2">
            <PieChartIcon size={20} />
            연차 유형별 사용 현황
          </h2>
        </div>
        <div className="p-6">
          <LeaveTypeChart />
        </div>
      </Card>
    </div>
  )
}
