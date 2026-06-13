'use client'

import { useEffect, useState } from 'react'
import { Menu, Plus } from 'lucide-react'
import Link from 'next/link'
import { mockKindergarten } from '@/lib/mock-data'
import { fetchFacilityName } from '@/lib/supabase/facility'

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const [facilityName, setFacilityName] = useState(mockKindergarten?.name ?? '어린이집')

  useEffect(() => {
    let active = true
    fetchFacilityName().then((name) => {
      if (active && name) setFacilityName(name + " 어린이집")
    })
    return () => {
      active = false
    }
  }, [])

  return (
    <header className="flex justify-between items-center w-full h-16 px-4 md:px-margin-page bg-surface-white border-b border-outline-variant shrink-0">
      {/* Left: 메뉴(모바일) + 시설명 */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-2 rounded-lg hover:bg-surface-container-low text-on-surface-variant"
          aria-label="메뉴 열기"
        >
          <Menu size={22} />
        </button>
        <h2 className="text-title-lg font-bold text-on-surface whitespace-nowrap">
          {facilityName}
        </h2>
      </div>

      {/* Right: 연차등록 */}
      <Link
        href="/leave"
        className="bg-primary text-on-primary px-4 py-2 rounded-lg text-label-md shadow-sm hover:opacity-90 transition-all active:scale-[0.95] flex items-center gap-1"
      >
        <Plus size={16} />
        <span className="hidden sm:inline">연차등록</span>
      </Link>
    </header>
  )
}
