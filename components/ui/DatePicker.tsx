'use client'

import { useEffect, useRef, useState, useCallback, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { DayPicker } from 'react-day-picker'
import { ko } from 'date-fns/locale'
import 'react-day-picker/style.css'
import { Calendar as CalendarIcon, X } from 'lucide-react'

interface DatePickerProps {
  value: string // YYYY-MM-DD ('' = 미선택)
  onChange: (value: string) => void
  placeholder?: string
  clearable?: boolean
  min?: string // 이 날짜 이전은 선택 불가 (YYYY-MM-DD)
  max?: string // 이 날짜 이후는 선택 불가 (YYYY-MM-DD)
}

const PANEL_HEIGHT = 360 // 캘린더 패널 대략 높이
const PANEL_WIDTH = 300

function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function parseIso(v: string): Date | undefined {
  if (!v) return undefined
  const [y, m, d] = v.split('-').map(Number)
  if (!y || !m || !d) return undefined
  return new Date(y, m - 1, d)
}

export function DatePicker({ value, onChange, placeholder = '날짜 선택', clearable, min, max }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ left: number; top?: number; bottom?: number }>({ left: 0 })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const selected = parseIso(value)

  // 트리거 위치 기준으로 패널 위치 계산 (아래 공간 부족 시 위로 플립)
  const reposition = useCallback(() => {
    const el = triggerRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const spaceBelow = window.innerHeight - r.bottom
    const spaceAbove = r.top
    const openUp = spaceBelow < PANEL_HEIGHT && spaceAbove > spaceBelow
    let left = r.left
    // 우측 화면 벗어남 방지
    if (left + PANEL_WIDTH > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - PANEL_WIDTH - 8)
    }
    if (openUp) {
      setPos({ left, bottom: window.innerHeight - r.top + 6 })
    } else {
      setPos({ left, top: r.bottom + 6 })
    }
  }, [])

  useLayoutEffect(() => {
    if (open) reposition()
  }, [open, reposition])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (
        triggerRef.current?.contains(t) ||
        panelRef.current?.contains(t)
      )
        return
      setOpen(false)
    }
    const onReposition = () => reposition()
    document.addEventListener('mousedown', onDown)
    window.addEventListener('resize', onReposition)
    // 스크롤 시 위치 갱신 (캡처 단계로 내부 스크롤도 감지)
    window.addEventListener('scroll', onReposition, true)
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('resize', onReposition)
      window.removeEventListener('scroll', onReposition, true)
    }
  }, [open, reposition])

  const handleSelect = useCallback(
    (d: Date | undefined) => {
      onChange(d ? toIso(d) : '')
      setOpen(false)
    },
    [onChange]
  )

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 rounded-lg border border-outline-variant px-4 py-2.5 text-label-md text-left bg-surface-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
      >
        <CalendarIcon size={18} className="text-on-surface-variant shrink-0" />
        <span className={value ? 'text-on-surface' : 'text-outline'}>
          {value || placeholder}
        </span>
        {clearable && value && (
          <span
            role="button"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation()
              onChange('')
            }}
            className="ml-auto text-outline hover:text-error transition-colors"
          >
            <X size={16} />
          </span>
        )}
      </button>

      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={panelRef}
            style={{
              position: 'fixed',
              left: pos.left,
              top: pos.top,
              bottom: pos.bottom,
              zIndex: 9999,
            }}
            className="rounded-xl border border-outline-variant bg-surface-white shadow-2xl p-2"
          >
            <DayPicker
              mode="single"
              locale={ko}
              selected={selected}
              defaultMonth={selected ?? (min ? parseIso(min) : max ? parseIso(max) : undefined)}
              onSelect={handleSelect}
              disabled={[
                ...(min ? [{ before: parseIso(min) as Date }] : []),
                ...(max ? [{ after: parseIso(max) as Date }] : []),
              ]}
              captionLayout="dropdown"
              startMonth={new Date(2000, 0)}
              endMonth={new Date(2035, 11)}
              styles={{ root: { ['--rdp-accent-color' as string]: '#4b4bc6' } }}
            />
          </div>,
          document.body
        )}
    </>
  )
}
