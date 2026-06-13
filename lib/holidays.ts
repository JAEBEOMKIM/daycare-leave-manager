'use client'

import { useEffect, useMemo, useState } from 'react'

export interface Holiday {
  date: string // YYYY-MM-DD
  name: string
}

/**
 * 2026년 대한민국 공휴일 정적 폴백.
 * 외부 API 호출이 실패해도 달력이 동작하도록 보장한다.
 */
const FALLBACK_HOLIDAYS: Record<number, Holiday[]> = {
  2026: [
    { date: '2026-01-01', name: '신정' },
    { date: '2026-02-16', name: '설날 연휴' },
    { date: '2026-02-17', name: '설날' },
    { date: '2026-02-18', name: '설날 연휴' },
    { date: '2026-03-01', name: '삼일절' },
    { date: '2026-03-02', name: '대체공휴일' },
    { date: '2026-05-05', name: '어린이날' },
    { date: '2026-05-24', name: '부처님오신날' },
    { date: '2026-05-25', name: '대체공휴일' },
    { date: '2026-06-06', name: '현충일' },
    { date: '2026-08-15', name: '광복절' },
    { date: '2026-08-17', name: '대체공휴일' },
    { date: '2026-09-24', name: '추석 연휴' },
    { date: '2026-09-25', name: '추석' },
    { date: '2026-09-26', name: '추석 연휴' },
    { date: '2026-10-03', name: '개천절' },
    { date: '2026-10-05', name: '대체공휴일' },
    { date: '2026-10-09', name: '한글날' },
    { date: '2026-12-25', name: '성탄절' },
  ],
}

interface NagerHoliday {
  date: string
  localName: string
  name: string
}

async function fetchHolidays(year: number, signal: AbortSignal): Promise<Holiday[]> {
  const res = await fetch(
    `https://date.nager.at/api/v3/PublicHolidays/${year}/KR`,
    { signal }
  )
  if (!res.ok) throw new Error(`Holiday API ${res.status}`)
  const data: NagerHoliday[] = await res.json()
  return data.map((h) => ({ date: h.date, name: h.localName || h.name }))
}

/**
 * 지정 연도의 공휴일을 가져온다. (외부 API → 실패 시 정적 폴백)
 * 결과는 { 'YYYY-MM-DD': '공휴일명' } 맵으로 메모이즈해 반환한다.
 */
export function useHolidays(year: number) {
  const [holidays, setHolidays] = useState<Holiday[]>(
    () => FALLBACK_HOLIDAYS[year] ?? []
  )
  const [source, setSource] = useState<'api' | 'fallback'>('fallback')

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    setHolidays(FALLBACK_HOLIDAYS[year] ?? [])
    setSource('fallback')

    fetchHolidays(year, controller.signal)
      .then((list) => {
        if (active && list.length > 0) {
          setHolidays(list)
          setSource('api')
        }
      })
      .catch(() => {
        /* 폴백 유지 */
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [year])

  const holidayMap = useMemo(() => {
    const map: Record<string, string> = {}
    for (const h of holidays) map[h.date] = h.name
    return map
  }, [holidays])

  return { holidayMap, source }
}

/** 토(6)·일(0) 여부 */
export function isWeekend(iso: string): boolean {
  const day = new Date(iso).getDay()
  return day === 0 || day === 6
}

/** 연차 사용 가능 일자인지 (주말·공휴일 제외) */
export function isLeaveSelectable(
  iso: string,
  holidayMap: Record<string, string>
): boolean {
  return !isWeekend(iso) && !holidayMap[iso]
}
