'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { AgGridReact } from 'ag-grid-react'
import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
  type ColDef,
  type ColGroupDef,
  type GridReadyEvent,
  type ICellRendererParams,
} from 'ag-grid-community'
import { Pencil, CalendarPlus } from 'lucide-react'
import {
  mockStaff,
  mockPositions,
  mockStaffLeaveBalance,
  mockSubstituteBalance,
  getSubstituteUsedDays,
} from '@/lib/mock-data'

// 모듈은 1회만 등록 (모듈 스코프)
ModuleRegistry.registerModules([AllCommunityModule])

const YEAR = 2026

// LeaveSync(Luminous) 디자인에 맞춘 Quartz 테마 — 밝은 헤더 (CSS import 불필요)
const leaveSyncTheme = themeQuartz.withParams({
  accentColor: '#4b4bc6',
  fontFamily: 'Inter, sans-serif',
  headerFontFamily: 'Inter, sans-serif',
  headerBackgroundColor: '#f3f3f4',
  headerTextColor: '#464553',
  headerFontWeight: 600,
  backgroundColor: '#ffffff',
  foregroundColor: '#1a1c1d',
  borderColor: '#eaecf0',
  rowBorder: { style: 'solid', width: 1, color: '#eaecf0' },
  rowHoverColor: '#f9f9fa',
  oddRowBackgroundColor: '#ffffff',
  fontSize: 13,
  headerHeight: 44,
  rowHeight: 60,
  wrapperBorderRadius: 0,
  wrapperBorder: false,
})

export interface StaffRow {
  id: string
  name: string
  position: string
  photoUrl?: string | null
  hireDate: string
  resignationDate: string | null
  status: string
  leaveTotal: number
  leaveUsed: number
  leaveRemaining: number
  subTotal: number
  subUsed: number
  subRemaining: number
}

function positionName(positionId?: string): string {
  return mockPositions.find((p) => p.id === positionId)?.name ?? '직원'
}

// 직원 행 데이터 빌더 (데이터 로직 분리 — page에서 필터링에 사용)
export function buildStaffRows(): StaffRow[] {
  return mockStaff.map((staff) => {
    const leave = mockStaffLeaveBalance.find((b) => b.staff_id === staff.id)
    const sub = mockSubstituteBalance.find((b) => b.staff_id === staff.id)
    const subTotal = sub?.total_days ?? 0
    const subUsed = getSubstituteUsedDays(staff.id, YEAR)
    const leaveTotal =
      (leave?.total_days ?? 0) +
      (leave?.special_addition ?? 0) -
      (leave?.special_deduction ?? 0)
    const leaveUsed = leave?.used_days ?? 0
    return {
      id: staff.id,
      name: staff.name,
      position: positionName(staff.position_id),
      hireDate: staff.hire_date,
      resignationDate: staff.resignation_date ?? staff.leave_date ?? null,
      status: staff.status,
      leaveTotal,
      leaveUsed,
      leaveRemaining: leaveTotal - leaveUsed,
      subTotal,
      subUsed,
      subRemaining: subTotal - subUsed,
    }
  })
}

// ── Cell renderers ──
function EmployeeCell({ data }: ICellRendererParams<StaffRow>) {
  if (!data) return null
  return (
    <div className="flex items-center gap-3">
      {data.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={data.photoUrl}
          alt={data.name}
          className="w-9 h-9 rounded-full object-cover shrink-0"
        />
      ) : (
        <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-on-primary font-bold text-[13px] shrink-0">
          {data.name.charAt(0)}
        </div>
      )}
      <div className="leading-tight text-left">
        <Link
          href={`/individual/${data.id}`}
          className="block font-bold text-[14px] text-on-surface hover:text-primary hover:underline"
        >
          {data.name}
        </Link>
        <span className="text-[12px] text-on-surface-variant">{data.position}</span>
      </div>
    </div>
  )
}

const STATUS_STYLE: Record<string, { dot: string; pill: string }> = {
  재직: { dot: 'bg-success-green', pill: 'bg-success-green/10 text-success-green' },
  휴직: { dot: 'bg-warning-amber', pill: 'bg-warning-amber/10 text-warning-amber' },
  퇴직: { dot: 'bg-error-red', pill: 'bg-error-red/10 text-error-red' },
  퇴사: { dot: 'bg-error-red', pill: 'bg-error-red/10 text-error-red' },
}

function StatusCell({ value }: ICellRendererParams<StaffRow>) {
  const s = STATUS_STYLE[value] ?? {
    dot: 'bg-outline',
    pill: 'bg-surface-container text-on-surface-variant',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-semibold ${s.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {value}
    </span>
  )
}

function ActionsCell({ data }: ICellRendererParams<StaffRow>) {
  if (!data) return null
  return (
    <div className="flex items-center justify-center gap-1">
      <Link
        href={`/staff/${data.id}/edit`}
        title="직원정보 수정"
        className="p-2 text-outline hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
      >
        <Pencil size={18} />
      </Link>
      <Link
        href={`/leave?staff=${data.id}`}
        title="연차등록"
        className="p-2 text-outline hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
      >
        <CalendarPlus size={18} />
      </Link>
    </div>
  )
}

interface StaffGridProps {
  rowData: StaffRow[]
  onGridReady?: (e: GridReadyEvent) => void
}

export function StaffGrid({ rowData, onGridReady }: StaffGridProps) {
  const columnDefs = useMemo<(ColDef<StaffRow> | ColGroupDef<StaffRow>)[]>(
    () => [
      {
        headerName: '직원',
        field: 'name',
        minWidth: 168,
        cellRenderer: EmployeeCell,
        cellStyle: { display: 'flex', alignItems: 'center' },
      },
      {
        headerName: '재직상태',
        field: 'status',
        minWidth: 104,
        cellRenderer: StatusCell,
      },
      {
        headerName: '입사일',
        field: 'hireDate',
        minWidth: 110,
        valueGetter: (p) =>
          p.data
            ? p.data.resignationDate
              ? `${p.data.hireDate} (퇴사: ${p.data.resignationDate})`
              : p.data.hireDate
            : '',
      },
      {
        headerName: '연차',
        marryChildren: true,
        children: [
          { headerName: '총', field: 'leaveTotal', minWidth: 56, valueFormatter: (p) => `${p.value}일` },
          { headerName: '사용', field: 'leaveUsed', minWidth: 56, valueFormatter: (p) => `${p.value}일` },
          {
            headerName: '잔여',
            field: 'leaveRemaining',
            minWidth: 56,
            valueFormatter: (p) => `${p.value}일`,
            cellClass: 'font-semibold',
          },
        ],
      },
      {
        headerName: '대체교사',
        marryChildren: true,
        children: [
          { headerName: '총', field: 'subTotal', minWidth: 56, valueFormatter: (p) => `${p.value}일` },
          { headerName: '사용', field: 'subUsed', minWidth: 56, valueFormatter: (p) => `${p.value}일` },
          {
            headerName: '잔여',
            field: 'subRemaining',
            minWidth: 56,
            valueFormatter: (p) => `${p.value}일`,
            cellClass: 'font-semibold',
          },
        ],
      },
      {
        headerName: '관리',
        minWidth: 96,
        sortable: false,
        cellRenderer: ActionsCell,
      },
    ],
    []
  )

  const defaultColDef = useMemo<ColDef>(
    () => ({
      sortable: true,
      filter: false,
      resizable: true,
      suppressHeaderMenuButton: true,
      cellStyle: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
    }),
    []
  )

  return (
    <AgGridReact<StaffRow>
      theme={leaveSyncTheme}
      rowData={rowData}
      columnDefs={columnDefs}
      defaultColDef={defaultColDef}
      autoSizeStrategy={{ type: 'fitGridWidth', defaultMinWidth: 56 }}
      domLayout="autoHeight"
      onGridReady={onGridReady}
      suppressCellFocus
      animateRows
    />
  )
}
