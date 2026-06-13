'use client'

import ReactEcharts from 'echarts-for-react'
import { mockStaff, mockStaffLeaveBalance } from '@/lib/mock-data'

export function StaffComparisonChart() {
  const staffData = mockStaff.map((staff) => {
    const balance = mockStaffLeaveBalance.find((b) => b.staff_id === staff.id)
    return {
      name: staff.name,
      used: balance?.used_days || 0,
      remaining: balance?.remaining_days || 0,
    }
  })

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    legend: {
      data: ['사용', '남은연차'],
      textStyle: {
        color: '#49454e',
        fontSize: 12,
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: staffData.map((item) => item.name),
      axisLabel: {
        color: '#79747e',
        fontSize: 12,
      },
      axisLine: {
        lineStyle: {
          color: '#e0e0e0',
        },
      },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: '#79747e',
        fontSize: 12,
      },
      splitLine: {
        lineStyle: {
          color: '#e0e0e0',
        },
      },
    },
    series: [
      {
        name: '사용',
        type: 'bar',
        data: staffData.map((item) => item.used),
        itemStyle: {
          color: '#067647',
        },
      },
      {
        name: '남은연차',
        type: 'bar',
        data: staffData.map((item) => item.remaining),
        itemStyle: {
          color: '#e8f5e9',
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
