'use client'

import ReactEcharts from 'echarts-for-react'
import { mockStaffLeaveBalance } from '@/lib/mock-data'

export function OrganizationChart() {
  const totalStats = mockStaffLeaveBalance.reduce(
    (acc, balance) => ({
      total: acc.total + balance.total_days,
      used: acc.used + balance.used_days,
      remaining: acc.remaining + balance.remaining_days,
    }),
    { total: 0, used: 0, remaining: 0 }
  )

  const usageRate = ((totalStats.used / totalStats.total) * 100).toFixed(1)

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      textStyle: {
        color: '#49454e',
        fontSize: 12,
      },
    },
    series: [
      {
        name: '연차 현황',
        type: 'pie',
        radius: '50%',
        data: [
          {
            value: totalStats.used,
            name: `사용 (${totalStats.used.toFixed(1)}일)`,
            itemStyle: { color: '#067647' },
          },
          {
            value: totalStats.remaining,
            name: `미사용 (${totalStats.remaining.toFixed(1)}일)`,
            itemStyle: { color: '#e8f5e9' },
          },
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  }

  return (
    <div className="w-full h-80">
      <ReactEcharts
        option={option}
        style={{ width: '100%', height: '100%' }}
        notMerge={true}
        lazyUpdate={true}
      />
    </div>
  )
}
