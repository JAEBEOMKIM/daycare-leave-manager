'use client'

import { useState, useMemo, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  useStaffStore,
  addStaff,
  updateStaff,
  removeStaff,
  computeEntitlement,
  yearsOfService,
} from '@/lib/staff-store'
import { DatePicker } from '@/components/ui/DatePicker'
import { uploadStaffPhoto } from '@/lib/supabase/staff-photos'
import {
  ArrowLeft,
  Save,
  Trash2,
  Camera,
  User,
  Briefcase,
  ToggleRight,
  CalendarCheck,
  Info,
  Lock,
  Upload,
  X,
} from 'lucide-react'

interface StaffFormProps {
  staffId?: string
}

interface FormState {
  name: string
  position_id: string
  status: string
  hire_date: string
  resignation_date: string
  photo_url: string
}

const STATUS_OPTIONS = ['재직', '휴직', '퇴직']
const inputCls =
  'w-full rounded-lg border border-outline-variant px-4 py-2.5 text-body-md text-on-surface bg-surface-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'
const labelCls = 'font-label-sm text-on-surface-variant ml-1'

export function StaffForm({ staffId }: StaffFormProps) {
  const router = useRouter()
  const store = useStaffStore()
  const isEdit = Boolean(staffId)

  const existing = useMemo(
    () => (staffId ? store.staff.find((s) => s.id === staffId) : undefined),
    [store.staff, staffId]
  )

  const initial = useMemo<FormState>(() => {
    if (existing) {
      return {
        name: existing.name,
        position_id: existing.position_id ?? store.positions[0]?.id ?? '',
        status: existing.status,
        hire_date: existing.hire_date,
        resignation_date: existing.resignation_date ?? '',
        photo_url: existing.photo_url ?? '',
      }
    }
    return {
      name: '',
      position_id: store.positions.find((p) => p.name === '교사')?.id ?? store.positions[0]?.id ?? '',
      status: '재직',
      hire_date: '',
      resignation_date: '',
      photo_url: '',
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing])

  const [form, setForm] = useState<FormState>(initial)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const setField = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) =>
      setForm((prev) => ({ ...prev, [key]: value })),
    []
  )

  const autoLeave = useMemo(
    () => (form.hire_date ? computeEntitlement(form.hire_date, store.leaveTiers) : null),
    [form.hire_date, store.leaveTiers]
  )

  const handlePhotoUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      e.target.value = '' // 같은 파일 재선택 허용
      if (!file) return
      if (!file.type.startsWith('image/')) {
        setError('이미지 파일만 업로드할 수 있습니다.')
        return
      }
      setError('')
      setUploading(true)
      try {
        // Supabase Storage 업로드 → public URL
        const url = await uploadStaffPhoto(file)
        setField('photo_url', url)
      } catch {
        // 버킷 미설정 등 실패 시: 로컬 미리보기(data URL)로 폴백
        const reader = new FileReader()
        reader.onload = () => setField('photo_url', String(reader.result))
        reader.readAsDataURL(file)
        setError('Supabase 업로드에 실패하여 임시 미리보기로 표시합니다. (버킷 설정 필요)')
      } finally {
        setUploading(false)
      }
    },
    [setField]
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!form.name.trim()) return setError('이름을 입력하세요.')
      if (!form.hire_date) return setError('입사일을 입력하세요.')
      const payload = {
        name: form.name.trim(),
        position_id: form.position_id,
        status: form.status,
        hire_date: form.hire_date,
        resignation_date: form.resignation_date || undefined,
        photo_url: form.photo_url || undefined,
      }
      setSaving(true)
      // 직원 정보(사진 URL 포함)는 staff 테이블에 write-through로 저장됨
      if (isEdit && staffId) updateStaff(staffId, payload)
      else addStaff(payload)
      router.push('/staff')
    },
    [form, isEdit, staffId, router]
  )

  const handleDelete = useCallback(() => {
    if (!staffId) return
    if (window.confirm('이 직원 정보를 삭제하시겠습니까?')) {
      removeStaff(staffId)
      router.push('/staff')
    }
  }, [staffId, router])

  if (isEdit && !existing) {
    return (
      <div className="py-16 text-center">
        <p className="text-on-surface-variant">직원 정보를 찾을 수 없습니다.</p>
        <Link href="/staff" className="mt-4 inline-block text-primary hover:underline">직원 목록으로</Link>
      </div>
    )
  }

  const avatarChar = form.name.trim().charAt(0) || '?'
  const role = store.positions.find((p) => p.id === form.position_id)?.name ?? '직원'
  const statusActive = form.status === '재직'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col">
        <Link href="/staff" className="inline-flex items-center gap-1 text-primary font-label-md mb-2 group w-fit">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          직원 목록
        </Link>
        <div className="flex justify-between items-end gap-4">
          <div>
            <h1 className="text-headline-lg font-bold text-on-surface">
              {isEdit ? '직원 정보 수정' : '직원 추가'}
            </h1>
            <p className="text-on-surface-variant text-body-md mt-1">
              {isEdit ? `${existing?.name} 님의 정보를 수정합니다.` : '새 직원의 기본 정보를 등록합니다.'}
            </p>
          </div>
          <div className={`flex items-center px-3 py-1 rounded-full border ${statusActive ? 'bg-success-green/10 text-success-green border-success-green/20' : 'bg-surface-container text-on-surface-variant border-outline-variant'}`}>
            <span className={`w-2 h-2 rounded-full mr-2 ${statusActive ? 'bg-success-green animate-pulse' : 'bg-outline'}`} />
            <span className="text-xs font-bold uppercase tracking-wider">{form.status}</span>
          </div>
        </div>
      </div>

      {/* Bento 그리드 */}
      <div className="grid grid-cols-12 gap-6">
        {/* 좌측: 프로필 & 요약 */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-surface-white rounded-xl shadow-sm border border-outline-variant p-6 text-center">
            {/* 단일 파일 input (버튼 onClick으로 트리거 — 가장 호환성 높은 방식) */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />

            <div className="relative w-40 h-40 mx-auto mb-6">
              {form.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.photo_url} alt="프로필" className="w-full h-full rounded-full object-cover border-4 border-surface-container-low" />
              ) : (
                <div className="w-full h-full rounded-full bg-primary-container flex items-center justify-center text-on-primary text-5xl font-bold border-4 border-surface-container-low">
                  {avatarChar}
                </div>
              )}
              {/* 카메라 배지 */}
              <button
                type="button"
                onClick={openFilePicker}
                className="absolute bottom-1 right-1 bg-primary text-on-primary p-2.5 rounded-full shadow-lg hover:scale-110 transition-transform flex items-center justify-center"
                title="사진 업로드"
              >
                <Camera size={18} />
              </button>
            </div>
            <h3 className="text-title-lg font-semibold text-on-surface">{form.name.trim() || '이름 미입력'}</h3>
            <p className="text-on-surface-variant text-body-md">{role}</p>

            {/* 명시적 사진 업로드 버튼 */}
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={openFilePicker}
                disabled={uploading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant px-3 py-2 text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors disabled:opacity-50"
              >
                <Upload size={16} />
                {uploading ? '업로드 중...' : form.photo_url ? '사진 변경' : '사진 업로드'}
              </button>
              {form.photo_url && (
                <button
                  type="button"
                  onClick={() => setField('photo_url', '')}
                  className="inline-flex items-center gap-1 rounded-lg border border-outline-variant px-3 py-2 text-sm text-on-surface-variant hover:text-error transition-colors"
                >
                  <X size={16} /> 제거
                </button>
              )}
            </div>
            <p className="mt-1.5 text-xs text-on-surface-variant">JPG·PNG 이미지 (저장 시 등록)</p>

            {/* 요약 */}
            <div className="mt-6 pt-6 border-t border-outline-variant text-left space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant text-sm flex items-center gap-1.5">
                  <CalendarCheck size={16} /> 올해 연차
                </span>
                <span className="text-on-surface font-bold">
                  {autoLeave !== null ? `${autoLeave}일` : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant text-sm">근속</span>
                <span className="text-primary font-bold">
                  {form.hire_date ? `${yearsOfService(form.hire_date)}년차` : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* 안내 */}
          <div className="bg-primary-container/10 rounded-xl p-5 border border-primary-container/20">
            <h4 className="font-label-md text-primary mb-2 flex items-center gap-1.5">
              <Info size={16} /> 안내
            </h4>
            <p className="text-sm text-on-primary-fixed-variant leading-relaxed">
              올해 연차는 입사일 기준으로 <b>연차 기준표</b>(설정 &gt; 연차 기준)에 따라 자동 산정됩니다.
              대체교사 지원일은 설정에서 관리합니다.
            </p>
          </div>
        </div>

        {/* 우측: 폼 */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-surface-white rounded-xl shadow-sm border border-outline-variant overflow-hidden">
            {/* 기본 정보 */}
            <div className="p-6 border-b border-outline-variant">
              <h3 className="text-title-md font-semibold mb-6 flex items-center gap-2">
                <User size={20} className="text-primary" /> 기본 정보
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className={labelCls}>이름 <span className="text-error">*</span></label>
                  <input type="text" value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="이름" className={inputCls} />
                </div>
                <div className="space-y-1.5">
                  <label className={labelCls}>사번</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={existing?.staff_number ?? '저장 시 자동 생성'}
                      disabled
                      className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-4 py-2.5 text-body-md text-on-surface-variant cursor-not-allowed"
                    />
                    <Lock size={14} className="absolute right-3 top-3.5 text-on-surface-variant" />
                  </div>
                </div>
              </div>
            </div>

            {/* 직무 정보 */}
            <div className="p-6 border-b border-outline-variant bg-surface-bright/50">
              <h3 className="text-title-md font-semibold mb-6 flex items-center gap-2">
                <Briefcase size={20} className="text-primary" /> 직무 정보
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className={labelCls}>직급</label>
                  <select value={form.position_id} onChange={(e) => setField('position_id', e.target.value)} className={inputCls}>
                    {store.positions.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className={labelCls}>올해 연차 <span className="text-on-surface-variant">(자동 산정)</span></label>
                  <div className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-4 py-2.5 text-body-md text-on-surface flex items-center justify-between">
                    <span className="font-semibold">{autoLeave !== null ? `${autoLeave}일` : '입사일 선택 필요'}</span>
                    {autoLeave !== null && <span className="text-xs text-on-surface-variant">근속 {yearsOfService(form.hire_date)}년차</span>}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className={labelCls}>입사일 <span className="text-error">*</span></label>
                  <DatePicker value={form.hire_date} onChange={(v) => setField('hire_date', v)} placeholder="입사일 선택" />
                </div>
                <div className="space-y-1.5">
                  <label className={labelCls}>퇴사일 <span className="text-on-surface-variant">(선택)</span></label>
                  <DatePicker value={form.resignation_date} onChange={(v) => setField('resignation_date', v)} placeholder="퇴사일 선택" clearable />
                </div>
              </div>
            </div>

            {/* 계정 상태 */}
            <div className="p-6">
              <h3 className="text-title-md font-semibold mb-6 flex items-center gap-2">
                <ToggleRight size={20} className="text-primary" /> 재직 상태
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className={labelCls}>상태</label>
                  <select value={form.status} onChange={(e) => setField('status', e.target.value)} className={inputCls}>
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 버튼 */}
            {error && <p className="px-6 text-sm text-error">{error}</p>}
            <div className="flex items-center justify-between p-6 border-t border-outline-variant bg-surface-bright/40">
              {isEdit ? (
                <button type="button" onClick={handleDelete} className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-error/30 text-error font-medium text-sm hover:bg-error-container/30 transition-colors">
                  <Trash2 size={18} /> 삭제
                </button>
              ) : (
                <span />
              )}
              <div className="flex gap-3">
                <Link href="/staff" className="px-5 py-2.5 rounded-lg border border-outline-variant text-on-surface font-medium text-sm hover:bg-surface-container-low transition-colors">
                  취소
                </Link>
                <button
                  type="submit"
                  disabled={uploading || saving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-on-primary font-semibold text-sm hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={18} /> {saving ? '저장 중...' : isEdit ? '저장' : '등록'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
