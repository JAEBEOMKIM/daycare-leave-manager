'use client'

import ReactEcharts from 'echarts-for-react'
import { mockLeaveHistory } from '@/lib/mock-data'

export function MonthlyChart() {
  // 월별 사용량 계산
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1
    const monthStr = String(month).padStart(2, '0')
    const total = mockLeaveHistory
      .filter((h) => h.start_date.includes(`-${monthStr}-`))
      .reduce((sum, h) => sum + h.days_used, 0)
    return {
      month: `${month}월`,
      value: parseFloat(total.toFixed(1)),
    }
  })

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
      },
      formatter: '{b}: {c}일',
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
      data: monthlyData.map((item) => item.month),
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
        name: '연차 사용량',
        type: 'line',
        data: monthlyData.map((item) => item.value),
        smooth: true,
        itemStyle: {
          color: '#0058c3',
        },
        areaStyle: {
          color: 'rgba(0, 88, 195, 0.2)',
        },
        lineStyle: {
          color: '#0058c3',
          width: 2,
        },
        symbol: 'circle',
        symbolSize: 6,
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
