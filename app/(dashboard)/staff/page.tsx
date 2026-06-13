'use client'

import { useMemo, useState, useCallback } from 'react'
import Link from 'next/link'
import { StaffGrid, type StaffRow } from '@/components/staff/StaffGrid'
import {
  useStaffStore,
  selectLeave,
  selectSubstitute,
  positionName,
  CURRENT_YEAR,
} from '@/lib/staff-store'
import {
  Search,
  Download,
  UserPlus,
  Users,
  TrendingUp,
  CalendarCheck,
  UserCog,
} from 'lucide-react'

export default function StaffPage() {
  const store = useStaffStore()

  const allRows = useMemo<StaffRow[]>(
    () =>
      store.staff.map((staff) => {
        const leave = selectLeave(store, staff.id, CURRENT_YEAR)
        const sub = selectSubstitute(store, staff.id, CURRENT_YEAR)
        return {
          id: staff.id,
          name: staff.name,
          position: positionName(store, staff.position_id),
          photoUrl: staff.photo_url ?? null,
          hireDate: staff.hire_date,
          resignationDate: staff.resignation_date ?? staff.leave_date ?? null,
          status: staff.status,
          leaveTotal: leave.total,
          leaveUsed: leave.used,
          leaveRemaining: leave.remaining,
          subTotal: sub.total,
          subUsed: sub.used,
          subRemaining: sub.remaining,
        }
      }),
    [store]
  )

  const [search, setSearch] = useState('')
  const [position, setPosition] = useState('all')
  const [status, setStatus] = useState('all')

  const positionOptions = useMemo(
    () => Array.from(new Set(allRows.map((r) => r.position))),
    [allRows]
  )
  const statusOptions = useMemo(
    () => Array.from(new Set(allRows.map((r) => r.status))),
    [allRows]
  )

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return allRows.filter((r) => {
      if (q && !`${r.name} ${r.position}`.toLowerCase().includes(q)) return false
      if (position !== 'all' && r.position !== position) return false
      if (status !== 'all' && r.status !== status) return false
      return true
    })
  }, [allRows, search, position, status])

  // 테이블(필터 반영)을 스타일 적용된 엑셀(.xlsx)로 내보내기
  const handleExportExcel = useCallback(async () => {
    const ExcelJS = (await import('exceljs')).default
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('직원목록', {
      views: [{ state: 'frozen', ySplit: 2 }],
    })

    // 2단 헤더
    ws.mergeCells('A1:A2'); ws.getCell('A1').value = '이름'
    ws.mergeCells('B1:B2'); ws.getCell('B1').value = '직급'
    ws.mergeCells('C1:C2'); ws.getCell('C1').value = '입사일'
    ws.mergeCells('D1:D2'); ws.getCell('D1').value = '퇴사일'
    ws.mergeCells('E1:E2'); ws.getCell('E1').value = '재직상태'
    ws.mergeCells('F1:H1'); ws.getCell('F1').value = '연차'
    ws.mergeCells('I1:K1'); ws.getCell('I1').value = '대체교사'
    ws.getCell('F2').value = '총'; ws.getCell('G2').value = '사용'; ws.getCell('H2').value = '잔여'
    ws.getCell('I2').value = '총'; ws.getCell('J2').value = '사용'; ws.getCell('K2').value = '잔여'

    const PRIMARY = 'FF4B4BC6'
    const headerCells = ['A1','B1','C1','D1','E1','F1','I1','F2','G2','H2','I2','J2','K2']
    headerCells.forEach((ref) => {
      const cell = ws.getCell(ref)
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PRIMARY } }
      cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 11 }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
    })

    // 데이터
    filteredRows.forEach((r) => {
      ws.addRow([
        r.name, r.position, r.hireDate, r.resignationDate ?? '-', r.status,
        r.leaveTotal, r.leaveUsed, r.leaveRemaining,
        r.subTotal, r.subUsed, r.subRemaining,
      ])
    })

    // 컬럼 폭
    ws.columns.forEach((col, i) => {
      col.width = [12, 10, 13, 13, 11, 7, 7, 7, 7, 7, 7][i] ?? 10
    })

    // 테두리 + 정렬 (전체)
    const lastRow = ws.rowCount
    const lastCol = 11
    for (let row = 1; row <= lastRow; row++) {
      for (let c = 1; c <= lastCol; c++) {
        const cell = ws.getCell(row, c)
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        }
        if (row > 2) {
          // 데이터: 이름/직급/입사일/퇴사일은 좌측, 나머지 가운데
          cell.alignment = { horizontal: c <= 4 ? 'left' : 'center', vertical: 'middle' }
          if (row % 2 === 1) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF7F7FA' } }
          }
        }
      }
    }

    const buf = await wb.xlsx.writeBuffer()
    const blob = new Blob([buf], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `직원목록_${new Date().toISOString().slice(0, 10)}.xlsx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [filteredRows])

  const summary = useMemo(() => {
    const totalStaff = store.staff.length
    const activeStaff = store.staff.filter((s) => s.status === '재직').length
    const leaveTotal = allRows.reduce((s, r) => s + r.leaveTotal, 0)
    const leaveUsed = allRows.reduce((s, r) => s + r.leaveUsed, 0)
    const leaveRemaining = leaveTotal - leaveUsed
    const usageRate = leaveTotal > 0 ? Math.round((leaveUsed / leaveTotal) * 100) : 0
    const subTotal = allRows.reduce((s, r) => s + r.subTotal, 0)
    const subUsed = allRows.reduce((s, r) => s + r.subUsed, 0)

    return [
      { label: '전체 직원', value: `${totalStaff}명`, sub: `재직 ${activeStaff}명`, icon: Users, tile: 'bg-primary/10 text-primary' },
      { label: '연차 사용률', value: `${usageRate}%`, sub: `사용 ${leaveUsed} / 부여 ${leaveTotal}일`, icon: TrendingUp, tile: 'bg-success-green/10 text-success-green' },
      { label: '잔여 연차', value: `${leaveRemaining}일`, sub: '전 직원 합계', icon: CalendarCheck, tile: 'bg-primary/10 text-primary' },
      { label: '대체교사 잔여', value: `${subTotal - subUsed}일`, sub: `총 ${subTotal}일 중 ${subUsed}일 사용`, icon: UserCog, tile: 'bg-warning-amber/10 text-warning-amber' },
    ]
  }, [store, allRows])

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-headline-lg font-bold text-on-surface">직원 디렉토리</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            모든 교직원의 연차 및 대체교사 지원일 현황을 관리합니다.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-surface-white border border-outline-variant px-4 py-2 rounded-lg text-on-surface font-medium text-sm hover:bg-surface-container-low transition-colors"
          >
            <Download size={18} />
            엑셀 내보내기
          </button>
          <Link
            href="/staff/new"
            className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity shadow-sm"
          >
            <UserPlus size={18} />
            직원 추가
          </Link>
        </div>
      </div>

      {/* 요약 통계 카드 */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {summary.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className="rounded-2xl border border-outline-variant bg-surface-white p-5 flex items-center gap-4"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${card.tile}`}>
                <Icon size={24} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-on-surface-variant truncate">{card.label}</p>
                <p className="text-2xl font-bold text-on-surface leading-tight">{card.value}</p>
                <p className="text-[11px] text-on-surface-variant truncate">{card.sub}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* 필터 바 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 rounded-xl border border-outline-variant bg-surface-white p-4">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
            직원 검색
          </label>
          <div className="relative">
            <Search size={18} className="absolute left-0 top-1/2 -translate-y-1/2 text-primary opacity-60" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="이름 또는 직급..."
              className="w-full bg-transparent border-none p-0 pl-7 focus:ring-0 text-sm placeholder:text-outline outline-none"
            />
          </div>
        </div>

        <div className="rounded-xl border border-outline-variant bg-surface-white p-4">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">직급</label>
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-medium outline-none"
          >
            <option value="all">전체 직급</option>
            {positionOptions.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div className="rounded-xl border border-outline-variant bg-surface-white p-4">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">재직상태</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-medium outline-none"
          >
            <option value="all">전체 상태</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 테이블 카드 */}
      <div className="rounded-2xl border border-outline-variant bg-surface-white overflow-hidden shadow-sm">
        <StaffGrid rowData={filteredRows} />
        <div className="px-6 py-4 bg-surface-bright flex items-center justify-between border-t border-outline-variant">
          <p className="text-sm text-on-surface-variant">
            전체 <span className="font-bold text-on-surface">{allRows.length}</span>명 중{' '}
            <span className="font-bold text-on-surface">{filteredRows.length}</span>명 표시
          </p>
        </div>
      </div>
    </div>
  )
}
