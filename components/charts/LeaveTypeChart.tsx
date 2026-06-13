'use client'

import ReactEcharts from 'echarts-for-react'
import { mockLeaveHistory } from '@/lib/mock-data'

export function LeaveTypeChart() {
  const leaveTypeStats = mockLeaveHistory.reduce(
    (acc, history) => {
      const existing = acc.find((item) => item.type === history.leave_type)
      if (existing) {
        existing.value += history.days_used
      } else {
        acc.push({
          type: history.leave_type,
          value: history.days_used,
        })
      }
      return acc
    },
    [] as Array<{ type: string; value: number }>
  )

  const colors = {
    종일휴가: '#0058c3',
    오전반차: '#067647',
    오후반차: '#8b7300',
    지각: '#f79009',
    병가: '#ba1a1a',
    경조사: '#7b68ee',
    춤산휴가: '#00a86b',
    돌봄휴가: '#ff69b4',
  }

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}일 ({d}%)',
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
        name: '휴가 유형',
        type: 'pie',
        radius: '50%',
        data: leaveTypeStats.map((item) => ({
          value: item.value,
          name: item.type,
          itemStyle: {
            color:
              colors[item.type as keyof typeof colors] ||
              '#999',
          },
        })),
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
