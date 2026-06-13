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

/**
 * 여러 연도의 공휴일을 병합한 맵을 반환한다. (연차 기간이 연말을 넘기는 경우 대비)
 * 외부 API 병렬 호출 → 실패한 연도는 정적 폴백 유지.
 */
export function useHolidayMap(years: number[]): Record<string, string> {
  const key = Array.from(new Set(years)).sort((a, b) => a - b).join(',')

  const [map, setMap] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {}
    for (const y of years) for (const h of FALLBACK_HOLIDAYS[y] ?? []) m[h.date] = h.name
    return m
  })

  useEffect(() => {
    const yrs = key ? key.split(',').map(Number) : []
    const controller = new AbortController()
    let active = true

    // 폴백 먼저 적용
    const fb: Record<string, string> = {}
    for (const y of yrs) for (const h of FALLBACK_HOLIDAYS[y] ?? []) fb[h.date] = h.name
    setMap(fb)

    Promise.all(
      yrs.map((y) => fetchHolidays(y, controller.signal).catch(() => null))
    ).then((results) => {
      if (!active) return
      const m: Record<string, string> = {}
      results.forEach((list, i) => {
        const y = yrs[i]
        const arr = list && list.length > 0 ? list : FALLBACK_HOLIDAYS[y] ?? []
        for (const h of arr) m[h.date] = h.name
      })
      setMap(m)
    })

    return () => {
      active = false
      controller.abort()
    }
  }, [key])

  return map
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
